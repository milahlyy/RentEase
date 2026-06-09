import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  role: text("role", { enum: ["renter", "lender", "both"] }).notNull().default("renter"),
  avatarUrl: text("avatar_url"),
  isVerified: integer("is_verified", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
});

export const kycDocuments = sqliteTable("kyc_documents", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  ktpUrl: text("ktp_url").notNull(),
  selfieUrl: text("selfie_url").notNull(),
  status: text("status", { enum: ["pending", "verified", "rejected"] }).notNull().default("pending"),
  reviewedAt: text("reviewed_at"),
});

export const listings = sqliteTable("listings", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  condition: integer("condition").notNull(),
  pricePerDay: integer("price_per_day").notNull(),
  depositAmount: integer("deposit_amount").notNull(),
  location: text("location").notNull(),
  status: text("status", { enum: ["draft", "active", "inactive", "rented"] }).notNull().default("draft"),
  createdAt: text("created_at").notNull(),
});

export const listingPhotos = sqliteTable("listing_photos", {
  id: text("id").primaryKey(),
  listingId: text("listing_id").notNull().references(() => listings.id),
  url: text("url").notNull(),
  order: integer("order").notNull(),
  isPrimary: integer("is_primary", { mode: "boolean" }).notNull().default(false),
});

export const listingAvailability = sqliteTable("listing_availability", {
  id: text("id").primaryKey(),
  listingId: text("listing_id").notNull().references(() => listings.id),
  blockedDate: text("blocked_date").notNull(),
});

export const bookings = sqliteTable("bookings", {
  id: text("id").primaryKey(),
  listingId: text("listing_id").notNull().references(() => listings.id),
  renterId: text("renter_id").notNull().references(() => users.id),
  lenderId: text("lender_id").notNull().references(() => users.id),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  totalPrice: integer("total_price").notNull(),
  deposit: integer("deposit").notNull(),
  deliveryMethod: text("delivery_method", { enum: ["delivery", "pickup"] }).notNull(),
  status: text("status").notNull(),
  createdAt: text("created_at").notNull(),
});

export const payments = sqliteTable("payments", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id").notNull().references(() => bookings.id),
  midtransOrderId: text("midtrans_order_id").notNull().unique(),
  amount: integer("amount").notNull(),
  status: text("status").notNull(),
  paidAt: text("paid_at"),
});

export const reviews = sqliteTable("reviews", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id").notNull().references(() => bookings.id),
  reviewerId: text("reviewer_id").notNull().references(() => users.id),
  revieweeId: text("reviewee_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: text("created_at").notNull(),
});

export const disputes = sqliteTable("disputes", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id").notNull().references(() => bookings.id),
  raisedBy: text("raised_by").notNull().references(() => users.id),
  reason: text("reason").notNull(),
  status: text("status").notNull(),
  resolvedAt: text("resolved_at"),
});

export type UserSelect = InferSelectModel<typeof users>;
export type UserInsert = InferInsertModel<typeof users>;
export type KycDocumentSelect = InferSelectModel<typeof kycDocuments>;
export type KycDocumentInsert = InferInsertModel<typeof kycDocuments>;
export type ListingSelect = InferSelectModel<typeof listings>;
export type ListingInsert = InferInsertModel<typeof listings>;
export type ListingPhotoSelect = InferSelectModel<typeof listingPhotos>;
export type ListingPhotoInsert = InferInsertModel<typeof listingPhotos>;
