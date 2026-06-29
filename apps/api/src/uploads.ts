import { Hono } from "hono";
import { failure, getBearerToken, success, verifyJwt, type Bindings } from "./auth";

type UploadBindings = Bindings & {
  ASSETS: R2Bucket;
};

type AuthResult =
  | { success: true; userId: string }
  | { success: false; error: string; status: 401 };

const uploadsRoute = new Hono<{ Bindings: UploadBindings }>();
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxPhotos = 8;
const maxPhotoSize = 5 * 1024 * 1024;
const maxAvatarSize = 2 * 1024 * 1024;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const oneMinute = 60_000;
const maxUploadsPerMinute = 20;

async function requireUserId(c: { env: UploadBindings; req: { raw: Request } }): Promise<AuthResult> {
  const token = getBearerToken(c.req.raw);

  if (!token) {
    return { success: false, error: "Token tidak ditemukan", status: 401 };
  }

  const payload = await verifyJwt(token, c.env.JWT_SECRET);

  if (!payload) {
    return { success: false, error: "Token tidak valid atau sudah kedaluwarsa", status: 401 };
  }

  return { success: true, userId: payload.sub };
}

function extensionFor(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

function getIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

uploadsRoute.use("*", async (c, next) => {
  const ip = getIp(c.req.raw);
  const now = Date.now();
  const current = rateLimitStore.get(ip);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + oneMinute });
    return next();
  }

  if (current.count >= maxUploadsPerMinute) {
    return c.json(failure("Terlalu banyak unggahan. Coba lagi dalam 1 menit."), 429);
  }

  current.count += 1;
  return next();
});

uploadsRoute.post("/listing-photos", async (c) => {
  const auth = await requireUserId(c);

  if (!auth.success) {
    return c.json(failure(auth.error), auth.status);
  }

  const form = await c.req.formData().catch(() => null);

  if (!form) {
    return c.json(failure("File foto tidak valid"), 400);
  }

  const files = form
    .getAll("photos")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (files.length === 0) {
    return c.json(failure("Pilih minimal 1 foto barang"), 400);
  }

  if (files.length > maxPhotos) {
    return c.json(failure(`Maksimal ${maxPhotos} foto per barang`), 400);
  }

  for (const file of files) {
    if (!allowedImageTypes.has(file.type)) {
      return c.json(failure("Format foto harus JPG, PNG, atau WebP"), 400);
    }

    if (file.size > maxPhotoSize) {
      return c.json(failure("Ukuran tiap foto maksimal 5MB"), 400);
    }
  }

  const origin = new URL(c.req.url).origin;
  const uploaded = [];

  for (const [index, file] of files.entries()) {
    const key = `listing-photos/${auth.userId}/${crypto.randomUUID()}-${index}.${extensionFor(
      file.type,
    )}`;
    await c.env.ASSETS.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: {
        uploadedBy: auth.userId,
        originalName: file.name,
      },
    });

    uploaded.push({
      key,
      url: `${origin}/assets/${key}`,
      contentType: file.type,
      size: file.size,
    });
  }

  return c.json(success({ photos: uploaded }), 201);
});

uploadsRoute.post("/avatar", async (c) => {
  const auth = await requireUserId(c);

  if (!auth.success) {
    return c.json(failure(auth.error), auth.status);
  }

  const form = await c.req.formData().catch(() => null);

  if (!form) {
    return c.json(failure("File foto profil tidak valid"), 400);
  }

  const file = form.get("avatar");

  if (!(file instanceof File) || file.size === 0) {
    return c.json(failure("Pilih foto profil dulu"), 400);
  }

  if (!allowedImageTypes.has(file.type)) {
    return c.json(failure("Format foto harus JPG, PNG, atau WebP"), 400);
  }

  if (file.size > maxAvatarSize) {
    return c.json(failure("Ukuran foto profil maksimal 2MB"), 400);
  }

  const key = `avatars/${auth.userId}/${crypto.randomUUID()}.${extensionFor(file.type)}`;
  const origin = new URL(c.req.url).origin;

  await c.env.ASSETS.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type,
    },
    customMetadata: {
      uploadedBy: auth.userId,
      originalName: file.name,
      purpose: "avatar",
    },
  });

  return c.json(success({ url: `${origin}/assets/${key}` }), 201);
});

export { uploadsRoute };
