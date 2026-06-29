import { Hono } from "hono";
import { z } from "zod";
import { failure, getBearerToken, success, verifyJwt, type Bindings } from "./auth";
import {
  bookingStatusLabels,
  evidencePhotoTypes,
  type Booking,
  type BookingStatus,
  type ConditionEvidence,
  type DepositTransaction,
  type DeliveryMethod,
  type EvidencePhotoType,
} from "@rentease/shared";
import {
  activeBookingStatusesSql,
  allowedEvidenceStatuses,
  evidenceOwnerFor,
  lifecycleTransitions,
} from "./booking-workflow";

type BookingBindings = Bindings & {
  ASSETS: R2Bucket;
};

type AuthResult =
  | { success: true; userId: string }
  | { success: false; error: string; status: 401 };

type ListingRow = {
  id: string;
  owner_id: string;
  title: string;
  price_per_day: number;
  deposit_amount: number;
  location: string;
  status: string;
  primary_photo_url: string | null;
  owner_name: string;
  owner_is_verified: number;
};

type BookingRow = {
  id: string;
  listing_id: string;
  renter_id: string;
  lender_id: string;
  start_date: string;
  end_date: string;
  rental_price: number;
  deposit_amount: number;
  delivery_fee: number;
  late_fee: number;
  delivery_method: DeliveryMethod;
  status: BookingStatus;
  whatsapp_unlocked_at: string | null;
  created_at: string;
  listing_title: string;
  listing_location: string;
  listing_photo_url: string | null;
  lender_name: string;
  lender_phone: string | null;
  lender_is_verified: number;
  renter_name: string;
};

type EvidenceRow = {
  id: string;
  booking_id: string;
  uploaded_by: string;
  photo_url: string;
  type: EvidencePhotoType;
  note: string | null;
  created_at: string;
};

type DepositTransactionRow = {
  id: string;
  booking_id: string;
  amount_held: number;
  amount_claimed: number;
  amount_refunded: number;
  status: DepositTransaction["status"];
  released_at: string | null;
  created_at: string;
};

const bookingsRoute = new Hono<{ Bindings: BookingBindings }>();

bookingsRoute.onError((error, c) => {
  console.error(error);
  return c.json(failure("Booking belum bisa diproses. Coba lagi beberapa saat lagi."), 500);
});

const createBookingSchema = z.object({
  deliveryMethod: z.enum(["delivery", "pickup"]),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal selesai tidak valid"),
  listingId: z.string().trim().min(1, "Listing wajib dipilih"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal mulai tidak valid"),
});

const updateBookingStatusSchema = z.object({
  action: z.enum(["accept", "reject"]),
});

const lifecycleActionSchema = z.object({
  action: z.enum(["mark_ready", "confirm_received", "request_return", "confirm_return_good"]),
});

const evidenceTypeSchema = z.enum(evidencePhotoTypes);
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxEvidencePhotoSize = 5 * 1024 * 1024;

async function requireUserId(c: { env: BookingBindings; req: { raw: Request } }): Promise<AuthResult> {
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

function parseDateOnly(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function rentalDays(startDate: string, endDate: string) {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);

  if (!start || !end) {
    return null;
  }

  const diff = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;

  return diff > 0 ? diff : null;
}

function toBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    listingId: row.listing_id,
    renterId: row.renter_id,
    lenderId: row.lender_id,
    startDate: row.start_date,
    endDate: row.end_date,
    rentalPrice: row.rental_price,
    depositAmount: row.deposit_amount,
    deliveryFee: row.delivery_fee,
    lateFee: row.late_fee,
    deliveryMethod: row.delivery_method,
    status: row.status,
    whatsappUnlockedAt: row.whatsapp_unlocked_at,
    createdAt: row.created_at,
  };
}

function toConditionEvidence(row: EvidenceRow): ConditionEvidence {
  return {
    id: row.id,
    bookingId: row.booking_id,
    uploadedBy: row.uploaded_by,
    photoUrl: row.photo_url,
    type: row.type,
    note: row.note,
    createdAt: row.created_at,
  };
}

function toDepositTransaction(row: DepositTransactionRow): DepositTransaction {
  return {
    id: row.id,
    bookingId: row.booking_id,
    amountHeld: row.amount_held,
    amountClaimed: row.amount_claimed,
    amountRefunded: row.amount_refunded,
    status: row.status,
    releasedAt: row.released_at,
    createdAt: row.created_at,
  };
}

function toBookingSummary(row: BookingRow) {
  return {
    booking: toBooking(row),
    listing: {
      id: row.listing_id,
      location: row.listing_location,
      photoUrl: row.listing_photo_url,
      title: row.listing_title,
    },
    owner: {
      id: row.lender_id,
      isVerified: Boolean(row.lender_is_verified),
      name: row.lender_name,
      phone: row.lender_phone,
    },
    renter: {
      id: row.renter_id,
      name: row.renter_name,
    },
    statusLabel: bookingStatusLabels[row.status],
  };
}

const bookingDetailSelect = `SELECT
  b.*,
  l.title AS listing_title,
  l.location AS listing_location,
  p.url AS listing_photo_url,
  lender.name AS lender_name,
  lender.phone AS lender_phone,
  lender.is_verified AS lender_is_verified,
  renter.name AS renter_name
 FROM bookings b
 JOIN listings l ON l.id = b.listing_id
 JOIN users lender ON lender.id = b.lender_id
 JOIN users renter ON renter.id = b.renter_id
 LEFT JOIN listing_photos p ON p.listing_id = l.id AND p.is_primary = 1`;

async function getBookingEvidence(db: D1Database, id: string) {
  const rows = await db
    .prepare(
      `SELECT id, booking_id, uploaded_by, photo_url, type, note, created_at
       FROM condition_evidence
       WHERE booking_id = ?
       ORDER BY created_at ASC`,
    )
    .bind(id)
    .all<EvidenceRow>();

  return rows.results.map((row) => toConditionEvidence(row));
}

async function getDepositTransaction(db: D1Database, id: string) {
  const row = await db
    .prepare(
      `SELECT id, booking_id, amount_held, amount_claimed, amount_refunded, status, released_at, created_at
       FROM deposit_transactions
       WHERE booking_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
    )
    .bind(id)
    .first<DepositTransactionRow>();

  return row ? toDepositTransaction(row) : null;
}

async function getBookingDetail(db: D1Database, id: string) {
  const row = await db
    .prepare(
      `${bookingDetailSelect}
       WHERE b.id = ?
      LIMIT 1`,
    )
    .bind(id)
    .first<BookingRow>();

  if (!row) {
    return null;
  }

  return {
    ...toBookingSummary(row),
    deposit: await getDepositTransaction(db, row.id),
    evidence: await getBookingEvidence(db, row.id),
  };
}

async function listBookingDetails(db: D1Database, userId: string, role: "lender" | "renter") {
  const ownerColumn = role === "lender" ? "b.lender_id" : "b.renter_id";
  const rows = await db
    .prepare(
      `${bookingDetailSelect}
       WHERE ${ownerColumn} = ?
       ORDER BY b.created_at DESC`,
    )
    .bind(userId)
    .all<BookingRow>();

  return rows.results.map((row) => toBookingSummary(row));
}

function extensionFor(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

function latestEvidenceByType(evidence: ConditionEvidence[], type: EvidencePhotoType) {
  return evidence.filter((item) => item.type === type).at(-1) ?? null;
}

bookingsRoute.post("/", async (c) => {
  const auth = await requireUserId(c);

  if (!auth.success) {
    return c.json(failure(auth.error), auth.status);
  }

  const body = createBookingSchema.safeParse(await c.req.json().catch(() => null));

  if (!body.success) {
    return c.json(failure(body.error.issues[0]?.message ?? "Data booking tidak valid"), 400);
  }

  const days = rentalDays(body.data.startDate, body.data.endDate);

  if (!days) {
    return c.json(failure("Tanggal selesai harus sama atau setelah tanggal mulai"), 400);
  }

  const today = new Date().toISOString().slice(0, 10);

  if (body.data.startDate < today) {
    return c.json(failure("Tanggal mulai tidak boleh di masa lalu"), 400);
  }

  const listing = await c.env.DB.prepare(
    `SELECT
       l.id,
       l.owner_id,
       l.title,
       l.price_per_day,
       l.deposit_amount,
       l.location,
       l.status,
       p.url AS primary_photo_url,
       u.name AS owner_name,
       u.is_verified AS owner_is_verified
     FROM listings l
     JOIN users u ON u.id = l.owner_id
     LEFT JOIN listing_photos p ON p.listing_id = l.id AND p.is_primary = 1
     WHERE l.id = ?
     LIMIT 1`,
  )
    .bind(body.data.listingId)
    .first<ListingRow>();

  if (!listing) {
    return c.json(failure("Listing tidak ditemukan"), 404);
  }

  if (listing.status !== "active") {
    return c.json(failure("Listing belum aktif untuk dibooking"), 409);
  }

  if (listing.owner_id === auth.userId) {
    return c.json(failure("Kamu tidak bisa booking listing milik sendiri"), 409);
  }

  const blocked = await c.env.DB.prepare(
    `SELECT id
     FROM listing_availability
     WHERE listing_id = ?
       AND start_date <= ?
       AND end_date >= ?
     LIMIT 1`,
  )
    .bind(listing.id, body.data.endDate, body.data.startDate)
    .first<{ id: string }>();

  if (blocked) {
    return c.json(failure("Tanggal ini sedang diblokir pemilik"), 409);
  }

  const overlapping = await c.env.DB.prepare(
    `SELECT id
     FROM bookings
     WHERE listing_id = ?
       AND status IN (${activeBookingStatusesSql})
       AND start_date <= ?
       AND end_date >= ?
     LIMIT 1`,
  )
    .bind(listing.id, body.data.endDate, body.data.startDate)
    .first<{ id: string }>();

  if (overlapping) {
    return c.json(failure("Tanggal ini sudah memiliki booking aktif"), 409);
  }

  const id = crypto.randomUUID();
  const rentalPrice = listing.price_per_day * days;
  const createdAt = new Date().toISOString();

  await c.env.DB.prepare(
    `INSERT INTO bookings
     (id, listing_id, renter_id, lender_id, start_date, end_date, rental_price, deposit_amount, delivery_fee, late_fee, delivery_method, status, whatsapp_unlocked_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, 'pending_owner', NULL, ?)`,
  )
    .bind(
      id,
      listing.id,
      auth.userId,
      listing.owner_id,
      body.data.startDate,
      body.data.endDate,
      rentalPrice,
      listing.deposit_amount,
      body.data.deliveryMethod,
      createdAt,
    )
    .run();

  await c.env.DB.prepare(
    `UPDATE conversations
     SET booking_id = ?, updated_at = ?
     WHERE listing_id = ? AND renter_id = ? AND owner_id = ? AND booking_id IS NULL`,
  )
    .bind(id, createdAt, listing.id, auth.userId, listing.owner_id)
    .run();

  const detail = await getBookingDetail(c.env.DB, id);

  return c.json(success(detail), 201);
});

bookingsRoute.get("/", async (c) => {
  const auth = await requireUserId(c);

  if (!auth.success) {
    return c.json(failure(auth.error), auth.status);
  }

  const roleParam = new URL(c.req.url).searchParams.get("role");
  const role = roleParam === "lender" ? "lender" : "renter";
  const bookings = await listBookingDetails(c.env.DB, auth.userId, role);

  return c.json(success({ bookings }));
});

bookingsRoute.get("/:id", async (c) => {
  const auth = await requireUserId(c);

  if (!auth.success) {
    return c.json(failure(auth.error), auth.status);
  }

  const detail = await getBookingDetail(c.env.DB, c.req.param("id"));

  if (!detail) {
    return c.json(failure("Booking tidak ditemukan"), 404);
  }

  if (detail.booking.renterId !== auth.userId && detail.booking.lenderId !== auth.userId) {
    return c.json(failure("Kamu tidak punya akses ke booking ini"), 403);
  }

  return c.json(success(detail));
});

bookingsRoute.post("/:id/simulate-payment", async (c) => {
  const auth = await requireUserId(c);

  if (!auth.success) {
    return c.json(failure(auth.error), auth.status);
  }

  const detail = await getBookingDetail(c.env.DB, c.req.param("id"));

  if (!detail) {
    return c.json(failure("Booking tidak ditemukan"), 404);
  }

  if (detail.booking.renterId !== auth.userId) {
    return c.json(failure("Hanya penyewa yang bisa menyelesaikan pembayaran ini"), 403);
  }

  if (detail.booking.status !== "awaiting_payment") {
    return c.json(failure("Pembayaran hanya bisa dilakukan setelah pemilik menerima pemesanan"), 409);
  }

  const paidAt = new Date().toISOString();
  const rentalPaymentAmount =
    detail.booking.rentalPrice + detail.booking.deliveryFee + detail.booking.lateFee;

  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT OR IGNORE INTO payments
       (id, booking_id, midtrans_order_id, amount, type, status, paid_at)
       VALUES (?, ?, ?, ?, 'rental', 'paid', ?)`,
    ).bind(
      crypto.randomUUID(),
      detail.booking.id,
      `sim-rental-${detail.booking.id}`,
      rentalPaymentAmount,
      paidAt,
    ),
    c.env.DB.prepare(
      `INSERT OR IGNORE INTO payments
       (id, booking_id, midtrans_order_id, amount, type, status, paid_at)
       VALUES (?, ?, ?, ?, 'deposit', 'paid', ?)`,
    ).bind(
      crypto.randomUUID(),
      detail.booking.id,
      `sim-deposit-${detail.booking.id}`,
      detail.booking.depositAmount,
      paidAt,
    ),
    c.env.DB.prepare(
      `INSERT INTO deposit_transactions
       (id, booking_id, amount_held, amount_claimed, amount_refunded, status, released_at, created_at)
       VALUES (?, ?, ?, 0, 0, 'held', NULL, ?)`,
    ).bind(crypto.randomUUID(), detail.booking.id, detail.booking.depositAmount, paidAt),
    c.env.DB.prepare(
      `UPDATE bookings
       SET status = 'confirmed', whatsapp_unlocked_at = ?
       WHERE id = ? AND status = 'awaiting_payment'`,
    ).bind(paidAt, detail.booking.id),
  ]);

  const updated = await getBookingDetail(c.env.DB, detail.booking.id);

  return c.json(success(updated));
});

bookingsRoute.post("/:id/evidence", async (c) => {
  const auth = await requireUserId(c);

  if (!auth.success) {
    return c.json(failure(auth.error), auth.status);
  }

  const detail = await getBookingDetail(c.env.DB, c.req.param("id"));

  if (!detail) {
    return c.json(failure("Booking tidak ditemukan"), 404);
  }

  if (detail.booking.renterId !== auth.userId && detail.booking.lenderId !== auth.userId) {
    return c.json(failure("Kamu tidak punya akses ke booking ini"), 403);
  }

  const form = await c.req.formData().catch(() => null);

  if (!form) {
    return c.json(failure("Foto bukti tidak valid"), 400);
  }

  const type = evidenceTypeSchema.safeParse(form.get("type"));
  const file = form.get("photo");

  if (!type.success) {
    return c.json(failure("Jenis bukti kondisi tidak valid"), 400);
  }

  if (!(file instanceof File) || file.size === 0) {
    return c.json(failure("Pilih satu foto bukti kondisi"), 400);
  }

  if (!allowedImageTypes.has(file.type)) {
    return c.json(failure("Format foto harus JPG, PNG, atau WebP"), 400);
  }

  if (file.size > maxEvidencePhotoSize) {
    return c.json(failure("Ukuran foto maksimal 5MB"), 400);
  }

  const owner = evidenceOwnerFor(type.data);

  if (owner === "lender" && detail.booking.lenderId !== auth.userId) {
    return c.json(failure("Bukti tahap ini harus diunggah pemilik barang"), 403);
  }

  if (owner === "renter" && detail.booking.renterId !== auth.userId) {
    return c.json(failure("Bukti tahap ini harus diunggah penyewa"), 403);
  }

  if (!allowedEvidenceStatuses[type.data].includes(detail.booking.status)) {
    return c.json(failure("Foto bukti ini belum sesuai dengan tahap transaksi saat ini"), 409);
  }

  const now = new Date().toISOString();
  const key = `booking-evidence/${detail.booking.id}/${type.data}/${crypto.randomUUID()}.${extensionFor(
    file.type,
  )}`;
  const origin = new URL(c.req.url).origin;
  const photoUrl = `${origin}/assets/${key}`;

  await c.env.ASSETS.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
    customMetadata: {
      bookingId: detail.booking.id,
      evidenceType: type.data,
      uploadedBy: auth.userId,
      originalName: file.name,
    },
  });

  await c.env.DB.prepare(
    `INSERT INTO condition_evidence
     (id, booking_id, uploaded_by, photo_url, type, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      crypto.randomUUID(),
      detail.booking.id,
      auth.userId,
      photoUrl,
      type.data,
      form.get("note")?.toString() ?? null,
      now,
    )
    .run();

  const updated = await getBookingDetail(c.env.DB, detail.booking.id);

  return c.json(success(updated), 201);
});

bookingsRoute.patch("/:id/lifecycle", async (c) => {
  const auth = await requireUserId(c);

  if (!auth.success) {
    return c.json(failure(auth.error), auth.status);
  }

  const body = lifecycleActionSchema.safeParse(await c.req.json().catch(() => null));

  if (!body.success) {
    return c.json(failure("Aksi transaksi tidak valid"), 400);
  }

  const detail = await getBookingDetail(c.env.DB, c.req.param("id"));

  if (!detail) {
    return c.json(failure("Booking tidak ditemukan"), 404);
  }

  if (detail.booking.renterId !== auth.userId && detail.booking.lenderId !== auth.userId) {
    return c.json(failure("Kamu tidak punya akses ke booking ini"), 403);
  }

  const transition = lifecycleTransitions[body.data.action];

  if (transition.role === "lender" && detail.booking.lenderId !== auth.userId) {
    return c.json(failure("Aksi ini hanya bisa dilakukan pemilik barang"), 403);
  }

  if (transition.role === "renter" && detail.booking.renterId !== auth.userId) {
    return c.json(failure("Aksi ini hanya bisa dilakukan penyewa"), 403);
  }

  if (detail.booking.status !== transition.from) {
    return c.json(failure("Status transaksi belum sesuai untuk aksi ini"), 409);
  }

  if (!latestEvidenceByType(detail.evidence, transition.evidenceType)) {
    return c.json(failure("Upload foto bukti kondisi dulu sebelum melanjutkan status"), 409);
  }

  const now = new Date().toISOString();
  const statements = [
    c.env.DB.prepare("UPDATE bookings SET status = ? WHERE id = ? AND status = ?").bind(
      transition.to,
      detail.booking.id,
      transition.from,
    ),
  ];

  if (body.data.action === "confirm_return_good") {
    statements.push(
      c.env.DB.prepare(
        `UPDATE deposit_transactions
         SET status = 'refunded', amount_refunded = amount_held, released_at = ?
         WHERE booking_id = ? AND status = 'held'`,
      ).bind(now, detail.booking.id),
    );
  }

  await c.env.DB.batch(statements);

  const updated = await getBookingDetail(c.env.DB, detail.booking.id);

  return c.json(success(updated));
});

bookingsRoute.patch("/:id/status", async (c) => {
  const auth = await requireUserId(c);

  if (!auth.success) {
    return c.json(failure(auth.error), auth.status);
  }

  const body = updateBookingStatusSchema.safeParse(await c.req.json().catch(() => null));

  if (!body.success) {
    return c.json(failure(body.error.issues[0]?.message ?? "Aksi booking tidak valid"), 400);
  }

  const detail = await getBookingDetail(c.env.DB, c.req.param("id"));

  if (!detail) {
    return c.json(failure("Booking tidak ditemukan"), 404);
  }

  if (detail.booking.lenderId !== auth.userId) {
    return c.json(failure("Hanya pemilik barang yang bisa memproses request ini"), 403);
  }

  if (detail.booking.status !== "pending_owner") {
    return c.json(failure("Request ini sudah diproses"), 409);
  }

  const nextStatus = body.data.action === "accept" ? "awaiting_payment" : "cancelled";

  await c.env.DB.prepare("UPDATE bookings SET status = ? WHERE id = ?")
    .bind(nextStatus, detail.booking.id)
    .run();

  const updated = await getBookingDetail(c.env.DB, detail.booking.id);

  return c.json(success(updated));
});

export { bookingsRoute };
