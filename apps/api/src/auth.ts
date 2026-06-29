import bcrypt from "bcryptjs";
import { Hono } from "hono";
import { z } from "zod";
import type { User, UserRole } from "@rentease/shared";

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  ALLOWED_ORIGINS?: string;
};

type Variables = {
  userId: string;
};

type ApiResponse<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
    };

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  is_verified: number;
  is_admin: number;
  created_at: string;
  kyc_status: "pending" | "verified" | "rejected" | null;
};

type JwtPayload = {
  sub: string;
  exp: number;
};

const auth = new Hono<{ Bindings: Bindings; Variables: Variables }>();

const registerSchema = z.object({
  name: z.string().trim().min(2, "Nama lengkap minimal 2 karakter"),
  email: z.string().trim().email("Format email tidak valid").toLowerCase(),
  password: z.string().min(8, "Password minimal 8 karakter"),
  phone: z.string().trim().min(8, "Nomor telepon minimal 8 karakter"),
});

const loginSchema = z.object({
  email: z.string().trim().email("Format email tidak valid").toLowerCase(),
  password: z.string().min(1, "Password wajib diisi"),
});

const updateProfileSchema = z.object({
  avatarUrl: z.string().url("URL foto profil tidak valid").nullable().optional(),
  name: z.string().trim().min(2, "Nama lengkap minimal 2 karakter"),
  phone: z.string().trim().min(8, "Nomor telepon minimal 8 karakter").nullable(),
});

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const oneMinute = 60_000;
const jwtTtlSeconds = 60 * 60 * 24 * 7;
const authCookieName = "rentease_session";

function success<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

function failure(error: string): ApiResponse<never> {
  return { success: false, error };
}

function getIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone,
    role: row.role,
    avatarUrl: row.avatar_url,
    isVerified: Boolean(row.is_verified),
    isAdmin: Boolean(row.is_admin),
    kycStatus: row.kyc_status ?? "pending",
    createdAt: row.created_at,
  };
}

function isSecureRequest(request: Request): boolean {
  const forwardedProto = request.headers.get("x-forwarded-proto");

  if (forwardedProto) {
    return forwardedProto === "https";
  }

  return new URL(request.url).protocol === "https:";
}

function cookieParts(request: Request, maxAge: number) {
  return [
    `Max-Age=${maxAge}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    isSecureRequest(request) ? "Secure" : "",
  ].filter(Boolean);
}

function setAuthCookie(c: { req: { raw: Request }; header: (name: string, value: string, options?: { append?: boolean }) => void }, token: string) {
  c.header(
    "Set-Cookie",
    [`${authCookieName}=${encodeURIComponent(token)}`, ...cookieParts(c.req.raw, jwtTtlSeconds)].join(
      "; ",
    ),
    { append: true },
  );
}

function clearAuthCookie(c: { req: { raw: Request }; header: (name: string, value: string, options?: { append?: boolean }) => void }) {
  c.header(
    "Set-Cookie",
    [`${authCookieName}=`, ...cookieParts(c.req.raw, 0)].join("; "),
    { append: true },
  );
}

function getCookieValue(request: Request, name: string): string | null {
  const cookie = request.headers.get("Cookie");

  if (!cookie) {
    return null;
  }

  for (const part of cookie.split(";")) {
    const [key, ...valueParts] = part.trim().split("=");

    if (key === name) {
      return decodeURIComponent(valueParts.join("="));
    }
  }

  return null;
}

function base64UrlEncode(value: string | ArrayBuffer): string {
  const bytes =
    typeof value === "string" ? new TextEncoder().encode(value) : new Uint8Array(value);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlDecode(value: string): string {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

  return new TextDecoder().decode(bytes);
}

async function signJwt(payload: JwtPayload, secret: string): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));

  return `${data}.${base64UrlEncode(signature)}`;
}

async function verifyJwt(token: string, secret: string): Promise<JwtPayload | null> {
  try {
    const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");

    if (!encodedHeader || !encodedPayload || !encodedSignature) {
      return null;
    }

    const parsedPayload = JSON.parse(base64UrlDecode(encodedPayload)) as JwtPayload;
    const expected = await signJwt(parsedPayload, secret);
    const expectedSignature = expected.split(".")[2];

    if (encodedSignature !== expectedSignature) {
      return null;
    }

    if (!parsedPayload.sub || typeof parsedPayload.exp !== "number") {
      return null;
    }

    if (parsedPayload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return parsedPayload;
  } catch {
    return null;
  }
}

function getBearerToken(request: Request): string | null {
  const cookieToken = getCookieValue(request, authCookieName);

  if (cookieToken) {
    return cookieToken;
  }

  const authorization = request.headers.get("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length);
}

auth.use("/register", async (c, next) => {
  const ip = getIp(c.req.raw);
  const key = `${ip}:register`;
  const now = Date.now();
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + oneMinute });
    return next();
  }

  if (current.count >= 5) {
    return c.json(failure("Terlalu banyak percobaan. Coba lagi dalam 1 menit."), 429);
  }

  current.count += 1;
  return next();
});

auth.use("/login", async (c, next) => {
  const ip = getIp(c.req.raw);
  const key = `${ip}:login`;
  const now = Date.now();
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + oneMinute });
    return next();
  }

  if (current.count >= 5) {
    return c.json(failure("Terlalu banyak percobaan. Coba lagi dalam 1 menit."), 429);
  }

  current.count += 1;
  return next();
});

auth.post("/register", async (c) => {
  const payload = registerSchema.safeParse(await c.req.json().catch(() => null));

  if (!payload.success) {
    return c.json(failure(payload.error.issues[0]?.message ?? "Data registrasi tidak valid"), 400);
  }

  const existing = await c.env.DB.prepare("SELECT id FROM users WHERE email = ?")
    .bind(payload.data.email)
    .first<{ id: string }>();

  if (existing) {
    return c.json(failure("Email sudah terdaftar"), 409);
  }

  const userId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const passwordHash = await bcrypt.hash(payload.data.password, 10);

  await c.env.DB.prepare(
    `INSERT INTO users (id, email, password_hash, name, phone, role, is_verified, created_at)
     VALUES (?, ?, ?, ?, ?, 'renter', 0, ?)`,
  )
    .bind(
      userId,
      payload.data.email,
      passwordHash,
      payload.data.name,
      payload.data.phone,
      createdAt,
    )
    .run();

  const user = await getUserById(c.env.DB, userId);

  if (!user) {
    return c.json(failure("Akun berhasil dibuat, tapi profil gagal dimuat"), 500);
  }

  const token = await signJwt(
    { sub: user.id, exp: Math.floor(Date.now() / 1000) + jwtTtlSeconds },
    c.env.JWT_SECRET,
  );
  setAuthCookie(c, token);

  return c.json(success({ user }), 201);
});

auth.post("/login", async (c) => {
  const payload = loginSchema.safeParse(await c.req.json().catch(() => null));

  if (!payload.success) {
    return c.json(failure(payload.error.issues[0]?.message ?? "Data login tidak valid"), 400);
  }

  const row = await getUserRowByEmail(c.env.DB, payload.data.email);

  if (!row) {
    return c.json(failure("Email atau password salah"), 401);
  }

  const isValidPassword = await bcrypt.compare(payload.data.password, row.password_hash);

  if (!isValidPassword) {
    return c.json(failure("Email atau password salah"), 401);
  }

  const user = toUser(row);
  const token = await signJwt(
    { sub: user.id, exp: Math.floor(Date.now() / 1000) + jwtTtlSeconds },
    c.env.JWT_SECRET,
  );
  setAuthCookie(c, token);

  return c.json(success({ user }));
});

auth.post("/logout", (c) => {
  clearAuthCookie(c);

  return c.json(success({ loggedOut: true }));
});

auth.get("/me", async (c) => {
  const token = getBearerToken(c.req.raw);

  if (!token) {
    return c.json(failure("Token tidak ditemukan"), 401);
  }

  const payload = await verifyJwt(token, c.env.JWT_SECRET);

  if (!payload) {
    return c.json(failure("Token tidak valid atau sudah kedaluwarsa"), 401);
  }

  const user = await getUserById(c.env.DB, payload.sub);

  if (!user) {
    return c.json(failure("User tidak ditemukan"), 404);
  }

  return c.json(success({ user }));
});

auth.patch("/me", async (c) => {
  const token = getBearerToken(c.req.raw);

  if (!token) {
    return c.json(failure("Token tidak ditemukan"), 401);
  }

  const payload = await verifyJwt(token, c.env.JWT_SECRET);

  if (!payload) {
    return c.json(failure("Token tidak valid atau sudah kedaluwarsa"), 401);
  }

  const body = updateProfileSchema.safeParse(await c.req.json().catch(() => null));

  if (!body.success) {
    return c.json(failure(body.error.issues[0]?.message ?? "Data profil tidak valid"), 400);
  }

  await c.env.DB.prepare("UPDATE users SET name = ?, phone = ?, avatar_url = ? WHERE id = ?")
    .bind(body.data.name, body.data.phone, body.data.avatarUrl ?? null, payload.sub)
    .run();

  const user = await getUserById(c.env.DB, payload.sub);

  if (!user) {
    return c.json(failure("User tidak ditemukan"), 404);
  }

  return c.json(success({ user }));
});

async function getUserById(db: D1Database, id: string): Promise<User | null> {
  const row = await db
    .prepare(
      `SELECT users.*, kyc_documents.status AS kyc_status
       FROM users
       LEFT JOIN kyc_documents ON kyc_documents.user_id = users.id
       WHERE users.id = ?
       LIMIT 1`,
    )
    .bind(id)
    .first<UserRow>();

  return row ? toUser(row) : null;
}

async function getUserRowByEmail(db: D1Database, email: string): Promise<UserRow | null> {
  return db
    .prepare(
      `SELECT users.*, kyc_documents.status AS kyc_status
       FROM users
       LEFT JOIN kyc_documents ON kyc_documents.user_id = users.id
       WHERE users.email = ?
       LIMIT 1`,
    )
    .bind(email)
    .first<UserRow>();
}

export { auth, failure, getBearerToken, success, verifyJwt };
export type { ApiResponse, Bindings };
