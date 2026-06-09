import { Database } from "bun:sqlite";
import bcrypt from "bcryptjs";
import { and, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  kycDocuments,
  listingAvailability,
  listingPhotos,
  listings,
  users,
} from "./src/schema";

type SeedUser = {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: "renter" | "lender" | "both";
  isVerified: boolean;
};

type SeedListing = {
  id: string;
  ownerId: string;
  title: string;
  category: string;
  description: string;
  condition: number;
  pricePerDay: number;
  depositAmount: number;
  location: string;
  photoUrl: string;
};

const password = "password123";

const seedUsers: SeedUser[] = [
  {
    id: "seed-user-rendy",
    email: "rendy@rentease.local",
    name: "Rendy Saputra",
    phone: "081234567001",
    role: "renter",
    isVerified: false,
  },
  {
    id: "seed-user-siti",
    email: "siti@rentease.local",
    name: "Siti Rahma",
    phone: "081234567002",
    role: "lender",
    isVerified: true,
  },
  {
    id: "seed-user-andi",
    email: "andi@rentease.local",
    name: "Andi Pratama",
    phone: "081234567003",
    role: "both",
    isVerified: true,
  },
];

const imageUrls = {
  camera: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400",
  drone: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400",
  baby: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400",
  camping: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400",
  guitar: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400",
  projector: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",
  mixer: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400",
  sleepingBag: "https://images.unsplash.com/photo-1487730116645-74489c95b41b?w=400",
};

const seedListings: SeedListing[] = [
  {
    id: "seed-listing-canon-eos-m50",
    ownerId: "seed-user-andi",
    title: "Kamera Canon EOS M50",
    category: "Elektronik",
    description:
      "Mirrorless Canon EOS M50 lengkap dengan lensa kit, baterai cadangan, charger, dan tas kamera. Cocok untuk dokumentasi acara, tugas kuliah, atau konten harian.",
    condition: 8,
    pricePerDay: 150_000,
    depositAmount: 500_000,
    location: "Jakarta Selatan",
    photoUrl: imageUrls.camera,
  },
  {
    id: "seed-listing-dji-mini-3-pro",
    ownerId: "seed-user-andi",
    title: "DJI Mini 3 Pro (Drone)",
    category: "Elektronik",
    description:
      "Drone DJI Mini 3 Pro dengan remote controller, baterai, dan propeller cadangan. Wajib digunakan di area legal dan aman untuk terbang.",
    condition: 9,
    pricePerDay: 200_000,
    depositAmount: 1_000_000,
    location: "Jakarta Pusat",
    photoUrl: imageUrls.drone,
  },
  {
    id: "seed-listing-stroller-babyelle-trevi",
    ownerId: "seed-user-siti",
    title: "Stroller Babyelle Trevi",
    category: "Perlengkapan Bayi",
    description:
      "Stroller Babyelle Trevi yang ringan, mudah dilipat, dan nyaman untuk jalan-jalan keluarga. Sudah dibersihkan sebelum disewakan.",
    condition: 7,
    pricePerDay: 75_000,
    depositAmount: 300_000,
    location: "Tangerang Selatan",
    photoUrl: imageUrls.baby,
  },
  {
    id: "seed-listing-tenda-coleman-4-orang",
    ownerId: "seed-user-andi",
    title: "Tenda Camping Coleman 4 Orang",
    category: "Outdoor & Camping",
    description:
      "Tenda Coleman kapasitas 4 orang, cocok untuk camping keluarga atau trip akhir pekan. Include pasak dan tas penyimpanan.",
    condition: 8,
    pricePerDay: 100_000,
    depositAmount: 400_000,
    location: "Depok",
    photoUrl: imageUrls.camping,
  },
  {
    id: "seed-listing-gitar-yamaha-f310",
    ownerId: "seed-user-andi",
    title: "Gitar Akustik Yamaha F310",
    category: "Alat Musik",
    description:
      "Gitar akustik Yamaha F310 dengan suara jernih, cocok untuk latihan, rekaman sederhana, atau acara kecil.",
    condition: 8,
    pricePerDay: 50_000,
    depositAmount: 200_000,
    location: "Bekasi",
    photoUrl: imageUrls.guitar,
  },
  {
    id: "seed-listing-lensa-canon-50mm",
    ownerId: "seed-user-andi",
    title: "Lensa Canon 50mm f/1.8",
    category: "Elektronik",
    description:
      "Lensa Canon 50mm f/1.8 untuk portrait dan low-light. Kondisi optik bersih, include front cap dan rear cap.",
    condition: 9,
    pricePerDay: 80_000,
    depositAmount: 300_000,
    location: "Jakarta Selatan",
    photoUrl: imageUrls.camera,
  },
  {
    id: "seed-listing-baby-bouncer-fisher-price",
    ownerId: "seed-user-siti",
    title: "Baby Bouncer Fisher-Price",
    category: "Perlengkapan Bayi",
    description:
      "Baby bouncer Fisher-Price untuk bayi, nyaman digunakan di rumah. Cover bisa dilepas dan dicuci.",
    condition: 7,
    pricePerDay: 60_000,
    depositAmount: 250_000,
    location: "Tangerang",
    photoUrl: imageUrls.baby,
  },
  {
    id: "seed-listing-matras-sleeping-bag-consina",
    ownerId: "seed-user-andi",
    title: "Matras Sleeping Bag Consina",
    category: "Outdoor & Camping",
    description:
      "Sleeping bag Consina dengan matras tipis untuk camping, hiking ringan, atau acara outdoor sekolah.",
    condition: 8,
    pricePerDay: 40_000,
    depositAmount: 150_000,
    location: "Bogor",
    photoUrl: imageUrls.sleepingBag,
  },
  {
    id: "seed-listing-proyektor-portable-xiaomi",
    ownerId: "seed-user-siti",
    title: "Proyektor Portable Xiaomi",
    category: "Elektronik",
    description:
      "Proyektor portable Xiaomi untuk presentasi, movie night, atau acara keluarga. Include kabel power dan HDMI.",
    condition: 8,
    pricePerDay: 120_000,
    depositAmount: 500_000,
    location: "Jakarta Barat",
    photoUrl: imageUrls.projector,
  },
  {
    id: "seed-listing-stand-mixer-kitchenaid",
    ownerId: "seed-user-siti",
    title: "Stand Mixer KitchenAid",
    category: "Rumah Tangga",
    description:
      "Stand mixer KitchenAid untuk baking rumahan, cocok untuk adonan kue, roti, dan whipped cream. Include bowl dan beater.",
    condition: 9,
    pricePerDay: 90_000,
    depositAmount: 400_000,
    location: "Jakarta Utara",
    photoUrl: imageUrls.mixer,
  },
];

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function findLocalDatabasePath() {
  if (process.env.LOCAL_DB_PATH) {
    return process.env.LOCAL_DB_PATH;
  }

  const root = process.cwd().replace(/packages[\\/]db$/, "");
  const candidates = [
    ".wrangler/state/v3/d1",
    "apps/api/.wrangler/state/v3/d1",
    "apps/api/.wrangler/state/v3/d1/miniflare-D1DatabaseObject",
  ];

  for (const candidate of candidates) {
    const matches = findSqliteFiles(join(root, candidate));

    if (matches[0]) {
      return matches[0];
    }
  }

  const fallback = join(root, "local.db");

  if (existsSync(fallback)) {
    return fallback;
  }

  throw new Error(
    "Local SQLite database not found. Run the D1 local migration first or set LOCAL_DB_PATH.",
  );
}

function findSqliteFiles(directory: string): string[] {
  if (!existsSync(directory)) {
    return [];
  }

  const files: string[] = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...findSqliteFiles(path));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".sqlite") && entry.name !== "metadata.sqlite") {
      files.push(path);
    }
  }

  return files.sort();
}

function buildAvailabilityBlocks(now: Date) {
  const canonDates = [1, 2, 3].map((day) => ({
    id: `seed-availability-canon-${day}`,
    listingId: "seed-listing-canon-eos-m50",
    blockedDate: toDateOnly(addDays(now, day)),
  }));

  const droneDates = Array.from({ length: 7 }, (_, index) => ({
    id: `seed-availability-drone-${index + 1}`,
    listingId: "seed-listing-dji-mini-3-pro",
    blockedDate: toDateOnly(addDays(now, 7 + index)),
  }));

  return [...canonDates, ...droneDates];
}

const dbPath = findLocalDatabasePath();
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);
const now = new Date();
const nowIso = now.toISOString();

console.log(`Using local database: ${dbPath}`);

try {
  db.transaction((tx) => {
    console.log("Seeding users...");

    const existingUsers = tx
      .select({ email: users.email })
      .from(users)
      .where(
        inArray(
          users.email,
          seedUsers.map((user) => user.email),
        ),
      )
      .all();
    const existingEmails = new Set(existingUsers.map((user) => user.email));
    const passwordHash = bcrypt.hashSync(password, 10);
    const usersToInsert = seedUsers
      .filter((user) => !existingEmails.has(user.email))
      .map((user) => ({
        id: user.id,
        email: user.email,
        passwordHash,
        name: user.name,
        phone: user.phone,
        role: user.role,
        avatarUrl: null,
        isVerified: user.isVerified,
        createdAt: nowIso,
      }));

    if (usersToInsert.length > 0) {
      tx.insert(users).values(usersToInsert).run();
    }

    console.log(`Seeded users: ${usersToInsert.length} inserted, ${existingEmails.size} skipped.`);
    console.log("Seeding KYC documents...");

    const verifiedUsers = seedUsers.filter((user) => user.isVerified);
    const kycToInsert = verifiedUsers.filter((user) => {
      const existing = tx
        .select({ id: kycDocuments.id })
        .from(kycDocuments)
        .where(eq(kycDocuments.userId, user.id))
        .get();
      return !existing;
    });

    if (kycToInsert.length > 0) {
      tx.insert(kycDocuments)
        .values(
          kycToInsert.map((user) => ({
            id: `seed-kyc-${user.id}`,
            userId: user.id,
            ktpUrl: `https://example.com/seed/${user.id}/ktp.jpg`,
            selfieUrl: `https://example.com/seed/${user.id}/selfie.jpg`,
            status: "verified" as const,
            reviewedAt: nowIso,
          })),
        )
        .run();
    }

    console.log(`Seeded KYC documents: ${kycToInsert.length} inserted.`);
    console.log("Seeding listings...");

    const existingListings = tx
      .select({ id: listings.id })
      .from(listings)
      .where(
        inArray(
          listings.id,
          seedListings.map((listing) => listing.id),
        ),
      )
      .all();
    const existingListingIds = new Set(existingListings.map((listing) => listing.id));
    const listingsToInsert = seedListings
      .filter((listing) => !existingListingIds.has(listing.id))
      .map((listing) => ({
        id: listing.id,
        ownerId: listing.ownerId,
        title: listing.title,
        category: listing.category,
        description: listing.description,
        condition: listing.condition,
        pricePerDay: listing.pricePerDay,
        depositAmount: listing.depositAmount,
        location: listing.location,
        status: "active" as const,
        createdAt: nowIso,
      }));

    if (listingsToInsert.length > 0) {
      tx.insert(listings).values(listingsToInsert).run();
    }

    console.log(
      `Seeded listings: ${listingsToInsert.length} inserted, ${existingListingIds.size} skipped.`,
    );
    console.log("Seeding listing photos...");

    const photosToInsert = seedListings.filter((listing) => {
      const existing = tx
        .select({ id: listingPhotos.id })
        .from(listingPhotos)
        .where(eq(listingPhotos.id, `seed-photo-${listing.id}`))
        .get();
      return !existing;
    });

    if (photosToInsert.length > 0) {
      tx.insert(listingPhotos)
        .values(
          photosToInsert.map((listing) => ({
            id: `seed-photo-${listing.id}`,
            listingId: listing.id,
            url: listing.photoUrl,
            order: 1,
            isPrimary: true,
          })),
        )
        .run();
    }

    console.log(`Seeded listing photos: ${photosToInsert.length} inserted.`);
    console.log("Seeding availability blocks...");

    const availabilityBlocks = buildAvailabilityBlocks(now);
    const availabilityToInsert = availabilityBlocks.filter((block) => {
      const existing = tx
        .select({ id: listingAvailability.id })
        .from(listingAvailability)
        .where(
          and(
            eq(listingAvailability.listingId, block.listingId),
            eq(listingAvailability.blockedDate, block.blockedDate),
          ),
        )
        .get();
      return !existing;
    });

    if (availabilityToInsert.length > 0) {
      tx.insert(listingAvailability).values(availabilityToInsert).run();
    }

    console.log(`Seeded availability blocks: ${availabilityToInsert.length} inserted.`);
  });

  console.log("Seed completed.");
} catch (error) {
  console.error("Seed failed. Transaction rolled back.");
  console.error(error);
  process.exit(1);
} finally {
  sqlite.close();
}
