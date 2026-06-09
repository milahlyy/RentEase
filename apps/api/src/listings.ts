import bcrypt from "bcryptjs";
import { Hono } from "hono";
import { z } from "zod";
import { failure, getBearerToken, success, verifyJwt, type Bindings } from "./auth";
import type { Listing, ListingPhoto } from "@rentease/shared";

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

const listingsRoute = new Hono<{ Bindings: Bindings }>();

const categoryLabelByValue: Record<string, string> = {
  electronics: "Elektronik",
  "baby-gear": "Perlengkapan Bayi",
  "outdoor-camping": "Outdoor & Camping",
  music: "Alat Musik",
  household: "Rumah Tangga",
  other: "Lainnya",
};

const seedOwners = [
  {
    id: "seed-owner-siti",
    email: "siti.seed@rentease.local",
    name: "Siti Rahma",
    phone: "081234567002",
    role: "lender",
    isVerified: 1,
  },
  {
    id: "seed-owner-andi",
    email: "andi.seed@rentease.local",
    name: "Andi Pratama",
    phone: "081234567003",
    role: "both",
    isVerified: 1,
  },
] as const;

const seedListings = [
  {
    id: "seed-canon-eos-m50",
    ownerId: "seed-owner-andi",
    title: "Kamera Canon EOS M50",
    category: "Elektronik",
    description: "Mirrorless Canon EOS M50 lengkap dengan lensa kit, baterai cadangan, dan tas kamera.",
    condition: 8,
    pricePerDay: 150_000,
    depositAmount: 500_000,
    location: "Jakarta Selatan",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400",
    rating: 4.8,
    reviewCount: 23,
  },
  {
    id: "seed-dji-mini-3-pro",
    ownerId: "seed-owner-andi",
    title: "DJI Mini 3 Pro (Drone)",
    category: "Elektronik",
    description: "Drone DJI Mini 3 Pro dengan remote controller, baterai, dan propeller cadangan.",
    condition: 9,
    pricePerDay: 200_000,
    depositAmount: 1_000_000,
    location: "Jakarta Pusat",
    image: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400",
    rating: 4.9,
    reviewCount: 18,
  },
  {
    id: "seed-stroller-babyelle",
    ownerId: "seed-owner-siti",
    title: "Stroller Babyelle Trevi",
    category: "Perlengkapan Bayi",
    description: "Stroller ringan dan mudah dilipat, cocok untuk perjalanan keluarga di akhir pekan.",
    condition: 7,
    pricePerDay: 75_000,
    depositAmount: 300_000,
    location: "Tangerang Selatan",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400",
    rating: 4.7,
    reviewCount: 12,
  },
  {
    id: "seed-tenda-coleman",
    ownerId: "seed-owner-andi",
    title: "Tenda Camping Coleman 4 Orang",
    category: "Outdoor & Camping",
    description: "Tenda Coleman kapasitas 4 orang, include pasak dan tas penyimpanan.",
    condition: 8,
    pricePerDay: 100_000,
    depositAmount: 400_000,
    location: "Depok",
    image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400",
    rating: 4.6,
    reviewCount: 9,
  },
  {
    id: "seed-gitar-yamaha-f310",
    ownerId: "seed-owner-andi",
    title: "Gitar Akustik Yamaha F310",
    category: "Alat Musik",
    description: "Gitar akustik Yamaha F310 dengan suara jernih untuk latihan atau acara kecil.",
    condition: 8,
    pricePerDay: 50_000,
    depositAmount: 200_000,
    location: "Bekasi",
    image: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400",
    rating: 4.8,
    reviewCount: 15,
  },
  {
    id: "seed-lensa-canon-50mm",
    ownerId: "seed-owner-andi",
    title: "Lensa Canon 50mm f/1.8",
    category: "Elektronik",
    description: "Lensa Canon 50mm f/1.8 untuk portrait dan low-light, optik bersih.",
    condition: 9,
    pricePerDay: 80_000,
    depositAmount: 300_000,
    location: "Jakarta Selatan",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400",
    rating: 4.9,
    reviewCount: 21,
  },
  {
    id: "seed-baby-bouncer",
    ownerId: "seed-owner-siti",
    title: "Baby Bouncer Fisher-Price",
    category: "Perlengkapan Bayi",
    description: "Baby bouncer nyaman untuk bayi, cover bisa dilepas dan dicuci.",
    condition: 7,
    pricePerDay: 60_000,
    depositAmount: 250_000,
    location: "Tangerang",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400",
    rating: 0,
    reviewCount: 0,
  },
  {
    id: "seed-sleeping-bag-consina",
    ownerId: "seed-owner-andi",
    title: "Matras Sleeping Bag Consina",
    category: "Outdoor & Camping",
    description: "Sleeping bag Consina dengan matras tipis untuk camping atau hiking ringan.",
    condition: 8,
    pricePerDay: 40_000,
    depositAmount: 150_000,
    location: "Bogor",
    image: "https://images.unsplash.com/photo-1487730116645-74489c95b41b?w=400",
    rating: 4.5,
    reviewCount: 7,
  },
  {
    id: "seed-proyektor-xiaomi",
    ownerId: "seed-owner-siti",
    title: "Proyektor Portable Xiaomi",
    category: "Elektronik",
    description: "Proyektor portable Xiaomi untuk presentasi, movie night, dan acara keluarga.",
    condition: 8,
    pricePerDay: 120_000,
    depositAmount: 500_000,
    location: "Jakarta Barat",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",
    rating: 4.7,
    reviewCount: 11,
  },
  {
    id: "seed-stand-mixer-kitchenaid",
    ownerId: "seed-owner-siti",
    title: "Stand Mixer KitchenAid",
    category: "Rumah Tangga",
    description: "Stand mixer KitchenAid untuk baking rumahan, adonan kue, roti, dan whipped cream.",
    condition: 9,
    pricePerDay: 90_000,
    depositAmount: 400_000,
    location: "Jakarta Utara",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400",
    rating: 4.8,
    reviewCount: 16,
  },
];

const createListingSchema = z.object({
  title: z.string().trim().min(3),
  category: z.string().trim().min(1),
  description: z.string().trim().min(10),
  condition: z.number().int().min(1).max(10),
  pricePerDay: z.number().int().positive(),
  depositAmount: z.number().int().min(0),
  location: z.string().trim().min(2),
  photoUrl: z.string().url().optional(),
});

function normalizeCategory(category: string | null) {
  if (!category) {
    return null;
  }

  return categoryLabelByValue[category] ?? category;
}

function ratingSql() {
  const ratingCases = seedListings
    .map((listing) => `WHEN l.id = '${listing.id}' THEN ${listing.rating}`)
    .join(" ");
  const reviewCases = seedListings
    .map((listing) => `WHEN l.id = '${listing.id}' THEN ${listing.reviewCount}`)
    .join(" ");

  return {
    rating: `CASE ${ratingCases} ELSE 0 END`,
    reviewCount: `CASE ${reviewCases} ELSE 0 END`,
  };
}

function toListing(row: ListingRow, photos?: ListingPhoto[]): Listing {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    category: row.category,
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

async function ensureListingTables(db: D1Database) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        role TEXT NOT NULL DEFAULT 'renter',
        avatar_url TEXT,
        is_verified INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      )`,
    )
    .run();

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS listings (
        id TEXT PRIMARY KEY,
        owner_id TEXT NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        condition INTEGER NOT NULL,
        price_per_day INTEGER NOT NULL,
        deposit_amount INTEGER NOT NULL,
        location TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        created_at TEXT NOT NULL,
        FOREIGN KEY (owner_id) REFERENCES users(id)
      )`,
    )
    .run();

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS listing_photos (
        id TEXT PRIMARY KEY,
        listing_id TEXT NOT NULL,
        url TEXT NOT NULL,
        "order" INTEGER NOT NULL,
        is_primary INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (listing_id) REFERENCES listings(id)
      )`,
    )
    .run();
}

async function seedListingsIfEmpty(db: D1Database) {
  const count = await db
    .prepare("SELECT COUNT(*) AS count FROM listings")
    .first<{ count: number }>();

  if ((count?.count ?? 0) > 0) {
    return;
  }

  const passwordHash = await bcrypt.hash("password123", 10);
  const now = new Date().toISOString();

  for (const owner of seedOwners) {
    await db
      .prepare(
        `INSERT OR IGNORE INTO users
         (id, email, password_hash, name, phone, role, is_verified, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        owner.id,
        owner.email,
        passwordHash,
        owner.name,
        owner.phone,
        owner.role,
        owner.isVerified,
        now,
      )
      .run();
  }

  for (const listing of seedListings) {
    await db
      .prepare(
        `INSERT OR IGNORE INTO listings
         (id, owner_id, title, category, description, condition, price_per_day, deposit_amount, location, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
      )
      .bind(
        listing.id,
        listing.ownerId,
        listing.title,
        listing.category,
        listing.description,
        listing.condition,
        listing.pricePerDay,
        listing.depositAmount,
        listing.location,
        now,
      )
      .run();

    await db
      .prepare(
        `INSERT OR IGNORE INTO listing_photos
         (id, listing_id, url, "order", is_primary)
         VALUES (?, ?, ?, 1, 1)`,
      )
      .bind(`seed-photo-${listing.id}`, listing.id, listing.image)
      .run();
  }
}

async function bootstrap(db: D1Database) {
  await ensureListingTables(db);
  await seedListingsIfEmpty(db);
}

listingsRoute.get("/", async (c) => {
  await bootstrap(c.env.DB);

  const url = new URL(c.req.url);
  const q = url.searchParams.get("q")?.trim();
  const category = normalizeCategory(url.searchParams.get("category")?.trim() ?? null);
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

  if (category) {
    where.push("l.category = ?");
    bindings.push(category);
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
  const { rating, reviewCount } = ratingSql();
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
       ${rating} AS rating,
       ${reviewCount} AS review_count
     FROM listings l
     JOIN users u ON u.id = l.owner_id
     LEFT JOIN listing_photos p ON p.listing_id = l.id AND p.is_primary = 1
     WHERE ${whereSql}
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

listingsRoute.get("/:id", async (c) => {
  await bootstrap(c.env.DB);

  const { rating, reviewCount } = ratingSql();
  const row = await c.env.DB.prepare(
    `SELECT
       l.*,
       p.url AS primary_photo_url,
       u.name AS owner_name,
       u.is_verified AS owner_is_verified,
       ${rating} AS rating,
       ${reviewCount} AS review_count
     FROM listings l
     JOIN users u ON u.id = l.owner_id
     LEFT JOIN listing_photos p ON p.listing_id = l.id AND p.is_primary = 1
     WHERE l.id = ?
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
    }),
  );
});

listingsRoute.post("/", async (c) => {
  await bootstrap(c.env.DB);

  const token = getBearerToken(c.req.raw);

  if (!token) {
    return c.json(failure("Token tidak ditemukan"), 401);
  }

  const payload = await verifyJwt(token, c.env.JWT_SECRET);

  if (!payload) {
    return c.json(failure("Token tidak valid atau sudah kedaluwarsa"), 401);
  }

  const body = createListingSchema.safeParse(await c.req.json().catch(() => null));

  if (!body.success) {
    return c.json(failure(body.error.issues[0]?.message ?? "Data listing tidak valid"), 400);
  }

  const id = crypto.randomUUID();
  const photoUrl =
    body.data.photoUrl ?? "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400";

  await c.env.DB.prepare(
    `INSERT INTO listings
     (id, owner_id, title, category, description, condition, price_per_day, deposit_amount, location, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)`,
  )
    .bind(
      id,
      payload.sub,
      body.data.title,
      normalizeCategory(body.data.category) ?? body.data.category,
      body.data.description,
      body.data.condition,
      body.data.pricePerDay,
      body.data.depositAmount,
      body.data.location,
      new Date().toISOString(),
    )
    .run();

  await c.env.DB.prepare(
    `INSERT INTO listing_photos (id, listing_id, url, "order", is_primary)
     VALUES (?, ?, ?, 1, 1)`,
  )
    .bind(crypto.randomUUID(), id, photoUrl)
    .run();

  return c.json(success({ id, status: "draft" }), 201);
});

export { listingsRoute };
