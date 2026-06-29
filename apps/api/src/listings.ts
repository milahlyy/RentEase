import { Hono } from "hono";
import { z } from "zod";
import { failure, getBearerToken, success, verifyJwt, type Bindings } from "./auth";
import {
  getCategoryLabel,
  listingStatuses,
  toCategoryValue,
  type Category,
  type Listing,
  type ListingAvailability,
  type ListingStatus,
  type ListingPhoto,
  type ListingReview,
} from "@rentease/shared";

type ListingRow = {
  id: string;
  owner_id: string;
  title: string;
  category: string;
  description: string;
  condition: number;
  price_per_day: number;
  deposit_amount: number;
  location: string;
  status: "draft" | "active" | "inactive" | "rented";
  created_at: string;
  primary_photo_url: string | null;
  owner_name: string;
  owner_is_verified: number;
  rating: number;
  review_count: number;
};

type ReviewRow = {
  id: string;
  booking_id: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

const listingsRoute = new Hono<{ Bindings: Bindings }>();

const createListingSchema = z.object({
  title: z.string().trim().min(3),
  category: z
    .string()
    .trim()
    .min(1)
    .refine((value) => toCategoryValue(value) !== null, "Kategori tidak valid"),
  description: z.string().trim().min(10),
  condition: z.number().int().min(1).max(10),
  pricePerDay: z.number().int().positive(),
  depositAmount: z.number().int().min(0),
  location: z.string().trim().min(2),
  photoUrl: z.string().url().optional(),
  photoUrls: z.array(z.string().url()).max(8).optional(),
});

const updateListingStatusSchema = z.object({
  status: z.enum(["draft", "active", "inactive"]),
});

const availabilitySchema = z.object({
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal selesai tidak valid"),
  reason: z.string().trim().max(120, "Alasan maksimal 120 karakter").nullable().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal mulai tidak valid"),
});

type AuthResult =
  | { success: true; userId: string }
  | { success: false; error: string; status: 401 };

async function requireUserId(c: { env: Bindings; req: { raw: Request } }): Promise<AuthResult> {
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

function categoryMatches(category: Category) {
  return [category, getCategoryLabel(category)];
}

function toListing(row: ListingRow, photos?: ListingPhoto[]): Listing {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    category: toCategoryValue(row.category) ?? "other",
    description: row.description,
    condition: row.condition,
    pricePerDay: row.price_per_day,
    depositAmount: row.deposit_amount,
    location: row.location,
    status: row.status,
    createdAt: row.created_at,
    rating: Number(row.rating),
    reviewCount: Number(row.review_count),
    primaryPhotoUrl: row.primary_photo_url,
    photos,
    owner: {
      id: row.owner_id,
      name: row.owner_name,
      isVerified: Boolean(row.owner_is_verified),
      rating: Number(row.rating),
    },
  };
}

function toListingReview(row: ReviewRow): ListingReview {
  return {
    id: row.id,
    bookingId: row.booking_id,
    reviewerId: row.reviewer_id,
    reviewerName: row.reviewer_name,
    revieweeId: row.reviewee_id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
  };
}

async function getOwnedListing(db: D1Database, id: string, ownerId: string) {
  const row = await db
    .prepare("SELECT id, title, owner_id FROM listings WHERE id = ? LIMIT 1")
    .bind(id)
    .first<{ id: string; title: string; owner_id: string }>();

  if (!row) {
    return { success: false as const, error: "Listing tidak ditemukan", status: 404 as const };
  }

  if (row.owner_id !== ownerId) {
    return { success: false as const, error: "Kamu tidak punya akses ke listing ini", status: 403 as const };
  }

  return { success: true as const, listing: row };
}

function toListingAvailability(row: {
  id: string;
  listing_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
}): ListingAvailability {
  return {
    id: row.id,
    listingId: row.listing_id,
    startDate: row.start_date,
    endDate: row.end_date,
    reason: row.reason,
  };
}

listingsRoute.get("/", async (c) => {
  const url = new URL(c.req.url);
  const q = url.searchParams.get("q")?.trim();
  const categoryParam = url.searchParams.get("category")?.trim();
  const category = categoryParam ? toCategoryValue(categoryParam) : null;
  const minPrice = Number(url.searchParams.get("min_price") ?? "");
  const maxPrice = Number(url.searchParams.get("max_price") ?? "");
  const sort = url.searchParams.get("sort") ?? "latest";
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? "20") || 20));
  const offset = (page - 1) * limit;
  const where = ["l.status = 'active'"];
  const bindings: (string | number)[] = [];

  if (q) {
    where.push("(LOWER(l.title) LIKE ? OR LOWER(l.description) LIKE ?)");
    bindings.push(`%${q.toLowerCase()}%`, `%${q.toLowerCase()}%`);
  }

  if (categoryParam) {
    if (category) {
      where.push("(l.category = ? OR l.category = ?)");
      bindings.push(...categoryMatches(category));
    } else {
      where.push("l.category = ?");
      bindings.push(categoryParam);
    }
  }

  if (Number.isFinite(minPrice) && minPrice > 0) {
    where.push("l.price_per_day >= ?");
    bindings.push(minPrice);
  }

  if (Number.isFinite(maxPrice) && maxPrice > 0) {
    where.push("l.price_per_day <= ?");
    bindings.push(maxPrice);
  }

  const whereSql = where.join(" AND ");
  const orderBy =
    sort === "price_asc"
      ? "l.price_per_day ASC"
      : sort === "price_desc"
        ? "l.price_per_day DESC"
        : sort === "rating_desc"
          ? "rating DESC, l.created_at DESC"
          : "l.created_at DESC";

  const total = await c.env.DB.prepare(`SELECT COUNT(*) AS total FROM listings l WHERE ${whereSql}`)
    .bind(...bindings)
    .first<{ total: number }>();

  const rows = await c.env.DB.prepare(
    `SELECT
       l.*,
       p.url AS primary_photo_url,
       u.name AS owner_name,
       u.is_verified AS owner_is_verified,
       COALESCE(AVG(r.rating), 0) AS rating,
       COUNT(r.id) AS review_count
     FROM listings l
     JOIN users u ON u.id = l.owner_id
     LEFT JOIN listing_photos p ON p.listing_id = l.id AND p.is_primary = 1
     LEFT JOIN reviews r ON r.reviewee_id = u.id
     WHERE ${whereSql}
     GROUP BY l.id, p.url, u.name, u.is_verified
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
  )
    .bind(...bindings, limit, offset)
    .all<ListingRow>();

  return c.json(
    success({
      listings: rows.results.map((row) => toListing(row)),
      total: total?.total ?? 0,
      page,
    }),
  );
});

listingsRoute.get("/mine", async (c) => {
  const auth = await requireUserId(c);

  if (!auth.success) {
    return c.json(failure(auth.error), auth.status);
  }

  const rows = await c.env.DB.prepare(
    `SELECT
       l.*,
       p.url AS primary_photo_url,
       u.name AS owner_name,
       u.is_verified AS owner_is_verified,
       COALESCE(AVG(r.rating), 0) AS rating,
       COUNT(r.id) AS review_count
     FROM listings l
     JOIN users u ON u.id = l.owner_id
     LEFT JOIN listing_photos p ON p.listing_id = l.id AND p.is_primary = 1
     LEFT JOIN reviews r ON r.reviewee_id = u.id
     WHERE l.owner_id = ?
     GROUP BY l.id, p.url, u.name, u.is_verified
     ORDER BY l.created_at DESC`,
  )
    .bind(auth.userId)
    .all<ListingRow>();

  return c.json(success({ listings: rows.results.map((row) => toListing(row)) }));
});

listingsRoute.get("/:id/reviews", async (c) => {
  const listing = await c.env.DB.prepare("SELECT id, owner_id FROM listings WHERE id = ? LIMIT 1")
    .bind(c.req.param("id"))
    .first<{ id: string; owner_id: string }>();

  if (!listing) {
    return c.json(failure("Listing tidak ditemukan"), 404);
  }

  const rows = await c.env.DB.prepare(
    `SELECT
       r.id,
       r.booking_id,
       r.reviewer_id,
       reviewer.name AS reviewer_name,
       r.reviewee_id,
       r.rating,
       r.comment,
       r.created_at
     FROM reviews r
     JOIN bookings b ON b.id = r.booking_id
     JOIN users reviewer ON reviewer.id = r.reviewer_id
     WHERE b.listing_id = ? AND r.reviewee_id = ?
     ORDER BY r.created_at DESC
     LIMIT 20`,
  )
    .bind(listing.id, listing.owner_id)
    .all<ReviewRow>();

  return c.json(success({ reviews: rows.results.map((row) => toListingReview(row)) }));
});

listingsRoute.get("/:id/availability", async (c) => {
  const auth = await requireUserId(c);

  if (!auth.success) {
    return c.json(failure(auth.error), auth.status);
  }

  const listing = await getOwnedListing(c.env.DB, c.req.param("id"), auth.userId);

  if (!listing.success) {
    return c.json(failure(listing.error), listing.status);
  }

  const rows = await c.env.DB.prepare(
    `SELECT id, listing_id, start_date, end_date, reason
     FROM listing_availability
     WHERE listing_id = ?
     ORDER BY start_date ASC, end_date ASC`,
  )
    .bind(listing.listing.id)
    .all<{
      id: string;
      listing_id: string;
      start_date: string;
      end_date: string;
      reason: string | null;
    }>();

  return c.json(
    success({
      listing: {
        id: listing.listing.id,
        title: listing.listing.title,
      },
      availability: rows.results.map((row) => toListingAvailability(row)),
    }),
  );
});

listingsRoute.post("/:id/availability", async (c) => {
  const auth = await requireUserId(c);

  if (!auth.success) {
    return c.json(failure(auth.error), auth.status);
  }

  const listing = await getOwnedListing(c.env.DB, c.req.param("id"), auth.userId);

  if (!listing.success) {
    return c.json(failure(listing.error), listing.status);
  }

  const body = availabilitySchema.safeParse(await c.req.json().catch(() => null));

  if (!body.success) {
    return c.json(failure(body.error.issues[0]?.message ?? "Data ketersediaan tidak valid"), 400);
  }

  if (body.data.endDate < body.data.startDate) {
    return c.json(failure("Tanggal selesai harus sama atau setelah tanggal mulai"), 400);
  }

  const overlapping = await c.env.DB.prepare(
    `SELECT id
     FROM listing_availability
     WHERE listing_id = ? AND start_date <= ? AND end_date >= ?
     LIMIT 1`,
  )
    .bind(listing.listing.id, body.data.endDate, body.data.startDate)
    .first<{ id: string }>();

  if (overlapping) {
    return c.json(failure("Range tanggal ini sudah bentrok dengan blok lain"), 409);
  }

  const id = crypto.randomUUID();

  await c.env.DB.prepare(
    `INSERT INTO listing_availability (id, listing_id, start_date, end_date, reason)
     VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      listing.listing.id,
      body.data.startDate,
      body.data.endDate,
      body.data.reason?.trim() || null,
    )
    .run();

  return c.json(
    success({
      availability: {
        id,
        listingId: listing.listing.id,
        startDate: body.data.startDate,
        endDate: body.data.endDate,
        reason: body.data.reason?.trim() || null,
      },
    }),
    201,
  );
});

listingsRoute.delete("/:id/availability/:blockId", async (c) => {
  const auth = await requireUserId(c);

  if (!auth.success) {
    return c.json(failure(auth.error), auth.status);
  }

  const listing = await getOwnedListing(c.env.DB, c.req.param("id"), auth.userId);

  if (!listing.success) {
    return c.json(failure(listing.error), listing.status);
  }

  const existing = await c.env.DB.prepare(
    "SELECT id FROM listing_availability WHERE id = ? AND listing_id = ? LIMIT 1",
  )
    .bind(c.req.param("blockId"), listing.listing.id)
    .first<{ id: string }>();

  if (!existing) {
    return c.json(failure("Blok tanggal tidak ditemukan"), 404);
  }

  await c.env.DB.prepare("DELETE FROM listing_availability WHERE id = ?")
    .bind(existing.id)
    .run();

  return c.json(success({ id: existing.id }));
});

listingsRoute.get("/:id", async (c) => {
  const row = await c.env.DB.prepare(
    `SELECT
       l.*,
       p.url AS primary_photo_url,
       u.name AS owner_name,
       u.is_verified AS owner_is_verified,
       COALESCE(AVG(r.rating), 0) AS rating,
       COUNT(r.id) AS review_count
     FROM listings l
     JOIN users u ON u.id = l.owner_id
     LEFT JOIN listing_photos p ON p.listing_id = l.id AND p.is_primary = 1
     LEFT JOIN reviews r ON r.reviewee_id = u.id
     WHERE l.id = ?
     GROUP BY l.id, p.url, u.name, u.is_verified
     LIMIT 1`,
  )
    .bind(c.req.param("id"))
    .first<ListingRow>();

  if (!row) {
    return c.json(failure("Listing tidak ditemukan"), 404);
  }

  const photos = await c.env.DB.prepare(
    `SELECT id, url, "order", is_primary
     FROM listing_photos
     WHERE listing_id = ?
     ORDER BY "order" ASC`,
  )
    .bind(row.id)
    .all<{ id: string; url: string; order: number; is_primary: number }>();

  const availability = await c.env.DB.prepare(
    `SELECT id, listing_id, start_date, end_date, reason
     FROM listing_availability
     WHERE listing_id = ?
     ORDER BY start_date ASC`,
  )
    .bind(row.id)
    .all<{
      id: string;
      listing_id: string;
      start_date: string;
      end_date: string;
      reason: string | null;
    }>();

  const activeBookings = await c.env.DB.prepare(
    `SELECT id, listing_id, start_date, end_date
     FROM bookings
     WHERE listing_id = ?
       AND status IN ('pending_owner', 'awaiting_payment', 'confirmed', 'ready_for_pickup', 'in_transit', 'active', 'return_pending', 'disputed')
     ORDER BY start_date ASC`,
  )
    .bind(row.id)
    .all<{
      id: string;
      listing_id: string;
      start_date: string;
      end_date: string;
    }>();

  const unavailableRanges: ListingAvailability[] = [
    ...availability.results.map((item) => ({
      id: item.id,
      listingId: item.listing_id,
      startDate: item.start_date,
      endDate: item.end_date,
      reason: item.reason,
    })),
    ...activeBookings.results.map((booking) => ({
      id: `booking-${booking.id}`,
      listingId: booking.listing_id,
      startDate: booking.start_date,
      endDate: booking.end_date,
      reason: "Sudah dipesan",
    })),
  ];

  return c.json(
    success({
      listing: toListing(
        row,
        photos.results.map((photo) => ({
          id: photo.id,
          url: photo.url,
          order: photo.order,
          isPrimary: Boolean(photo.is_primary),
        })),
      ),
      unavailableRanges,
    }),
  );
});

listingsRoute.post("/", async (c) => {
  const auth = await requireUserId(c);

  if (!auth.success) {
    return c.json(failure(auth.error), auth.status);
  }

  const body = createListingSchema.safeParse(await c.req.json().catch(() => null));

  if (!body.success) {
    return c.json(failure(body.error.issues[0]?.message ?? "Data listing tidak valid"), 400);
  }

  const id = crypto.randomUUID();
  const category = toCategoryValue(body.data.category);

  if (!category) {
    return c.json(failure("Kategori tidak valid"), 400);
  }

  const photoUrls =
    body.data.photoUrls && body.data.photoUrls.length > 0
      ? body.data.photoUrls
      : [body.data.photoUrl ?? "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400"];

  await c.env.DB.prepare(
    `INSERT INTO listings
     (id, owner_id, title, category, description, condition, price_per_day, deposit_amount, location, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)`,
  )
    .bind(
      id,
      auth.userId,
      body.data.title,
      category,
      body.data.description,
      body.data.condition,
      body.data.pricePerDay,
      body.data.depositAmount,
      body.data.location,
      new Date().toISOString(),
    )
    .run();

  await c.env.DB.batch(
    photoUrls.map((photoUrl, index) =>
      c.env.DB.prepare(
        `INSERT INTO listing_photos (id, listing_id, url, "order", is_primary)
         VALUES (?, ?, ?, ?, ?)`,
      ).bind(crypto.randomUUID(), id, photoUrl, index + 1, index === 0 ? 1 : 0),
    ),
  );

  return c.json(success({ id, status: "draft" }), 201);
});

listingsRoute.patch("/:id/status", async (c) => {
  const auth = await requireUserId(c);

  if (!auth.success) {
    return c.json(failure(auth.error), auth.status);
  }

  const body = updateListingStatusSchema.safeParse(await c.req.json().catch(() => null));

  if (!body.success) {
    return c.json(failure(body.error.issues[0]?.message ?? "Status listing tidak valid"), 400);
  }

  const existing = await c.env.DB.prepare(
    "SELECT owner_id, status FROM listings WHERE id = ? LIMIT 1",
  )
    .bind(c.req.param("id"))
    .first<{ owner_id: string; status: ListingStatus }>();

  if (!existing) {
    return c.json(failure("Listing tidak ditemukan"), 404);
  }

  if (existing.owner_id !== auth.userId) {
    return c.json(failure("Kamu tidak punya akses ke listing ini"), 403);
  }

  if (existing.status === "rented") {
    return c.json(failure("Listing yang sedang disewa tidak bisa diubah statusnya"), 409);
  }

  if (!listingStatuses.includes(body.data.status)) {
    return c.json(failure("Status listing tidak valid"), 400);
  }

  await c.env.DB.prepare("UPDATE listings SET status = ? WHERE id = ?")
    .bind(body.data.status, c.req.param("id"))
    .run();

  return c.json(success({ id: c.req.param("id"), status: body.data.status }));
});

export { listingsRoute };
