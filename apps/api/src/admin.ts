import { Hono } from "hono";
import { failure, getBearerToken, success, verifyJwt, type Bindings } from "./auth";
import { activeBookingStatusesSql } from "./booking-workflow";

type AuthResult =
  | { success: true; userId: string; email: string; name: string }
  | { success: false; error: string; status: 401 | 403 };

type CountRow = {
  total: number;
};

const adminRoute = new Hono<{ Bindings: Bindings }>();

async function requireAdmin(c: { env: Bindings; req: { raw: Request } }): Promise<AuthResult> {
  const token = getBearerToken(c.req.raw);

  if (!token) {
    return { success: false, error: "Token tidak ditemukan", status: 401 };
  }

  const payload = await verifyJwt(token, c.env.JWT_SECRET);

  if (!payload) {
    return { success: false, error: "Token tidak valid atau sudah kedaluwarsa", status: 401 };
  }

  const user = await c.env.DB.prepare("SELECT id, email, name, is_admin FROM users WHERE id = ? LIMIT 1")
    .bind(payload.sub)
    .first<{ id: string; email: string; name: string; is_admin: number }>();

  if (!user || !user.is_admin) {
    return { success: false, error: "Akun ini tidak punya akses admin", status: 403 };
  }

  return { success: true, userId: user.id, email: user.email, name: user.name };
}

async function count(db: D1Database, sql: string, ...bindings: (string | number)[]) {
  const row = await db.prepare(sql).bind(...bindings).first<CountRow>();

  return row?.total ?? 0;
}

adminRoute.get("/summary", async (c) => {
  const auth = await requireAdmin(c);

  if (!auth.success) {
    return c.json(failure(auth.error), auth.status);
  }

  const [totalUsers, activeListings, activeBookings, pendingVerifications, openDisputes] =
    await Promise.all([
      count(c.env.DB, "SELECT COUNT(*) AS total FROM users"),
      count(c.env.DB, "SELECT COUNT(*) AS total FROM listings WHERE status = 'active'"),
      count(
        c.env.DB,
        `SELECT COUNT(*) AS total
         FROM bookings
         WHERE status IN (${activeBookingStatusesSql})`,
      ),
      count(c.env.DB, "SELECT COUNT(*) AS total FROM kyc_documents WHERE status = 'pending'"),
      count(c.env.DB, "SELECT COUNT(*) AS total FROM disputes WHERE status != 'cancelled'"),
    ]);

  const pendingKyc = await c.env.DB.prepare(
    `SELECT
       k.id,
       k.status,
       k.reviewed_at,
       u.id AS user_id,
       u.name,
       u.email
     FROM kyc_documents k
     JOIN users u ON u.id = k.user_id
     WHERE k.status = 'pending'
     ORDER BY u.created_at DESC
     LIMIT 8`,
  ).all<{
    id: string;
    status: string;
    reviewed_at: string | null;
    user_id: string;
    name: string;
    email: string;
  }>();

  const recentListings = await c.env.DB.prepare(
    `SELECT
       l.id,
       l.title,
       l.status,
       l.created_at,
       u.name AS owner_name
     FROM listings l
     JOIN users u ON u.id = l.owner_id
     ORDER BY l.created_at DESC
     LIMIT 8`,
  ).all<{
    id: string;
    title: string;
    status: string;
    created_at: string;
    owner_name: string;
  }>();

  const recentBookings = await c.env.DB.prepare(
    `SELECT
       b.id,
       b.status,
       b.created_at,
       l.title AS listing_title,
       renter.name AS renter_name,
       lender.name AS lender_name
     FROM bookings b
     JOIN listings l ON l.id = b.listing_id
     JOIN users renter ON renter.id = b.renter_id
     JOIN users lender ON lender.id = b.lender_id
     ORDER BY b.created_at DESC
     LIMIT 8`,
  ).all<{
    id: string;
    status: string;
    created_at: string;
    listing_title: string;
    renter_name: string;
    lender_name: string;
  }>();

  return c.json(
    success({
      admin: {
        email: auth.email,
        name: auth.name,
      },
      stats: {
        activeBookings,
        activeListings,
        openDisputes,
        pendingVerifications,
        totalUsers,
      },
      pendingKyc: pendingKyc.results,
      recentBookings: recentBookings.results,
      recentListings: recentListings.results,
    }),
  );
});

export { adminRoute };
