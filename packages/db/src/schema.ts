import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import {
  bookingStatuses,
  categoryValues,
  depositClaimStatuses,
  depositStatuses,
  deliveryMethods,
  disputeStatuses,
  evidencePhotoTypes,
  extensionStatuses,
  kycStatuses,
  listingStatuses,
  paymentStatuses,
  paymentTypes,
  userRoles,
} from "@rentease/shared";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  role: text("role", { enum: userRoles }).notNull().default("renter"),
  avatarUrl: text("avatar_url"),
  isVerified: integer("is_verified", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
});

export const kycDocuments = sqliteTable("kyc_documents", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  ktpUrl: text("ktp_url").notNull(),
  selfieUrl: text("selfie_url").notNull(),
  status: text("status", { enum: kycStatuses }).notNull().default("pending"),
  reviewedAt: text("reviewed_at"),
});

export const listings = sqliteTable("listings", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  category: text("category", { enum: categoryValues }).notNull(),
  description: text("description").notNull(),
  condition: integer("condition").notNull(),
  pricePerDay: integer("price_per_day").notNull(),
  depositAmount: integer("deposit_amount").notNull(),
  location: text("location").notNull(),
  status: text("status", { enum: listingStatuses }).notNull().default("draft"),
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
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  reason: text("reason"),
});

export const bookings = sqliteTable("bookings", {
  id: text("id").primaryKey(),
  listingId: text("listing_id").notNull().references(() => listings.id),
  renterId: text("renter_id").notNull().references(() => users.id),
  lenderId: text("lender_id").notNull().references(() => users.id),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  rentalPrice: integer("rental_price").notNull(),
  depositAmount: integer("deposit_amount").notNull(),
  deliveryFee: integer("delivery_fee").notNull().default(0),
  lateFee: integer("late_fee").notNull().default(0),
  deliveryMethod: text("delivery_method", { enum: deliveryMethods }).notNull(),
  status: text("status", { enum: bookingStatuses }).notNull().default("pending_owner"),
  whatsappUnlockedAt: text("whatsapp_unlocked_at"),
  createdAt: text("created_at").notNull(),
});

export const payments = sqliteTable("payments", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id").notNull().references(() => bookings.id),
  midtransOrderId: text("midtrans_order_id").notNull().unique(),
  amount: integer("amount").notNull(),
  type: text("type", { enum: paymentTypes }).notNull(),
  status: text("status", { enum: paymentStatuses }).notNull().default("pending"),
  paidAt: text("paid_at"),
});

export const depositTransactions = sqliteTable("deposit_transactions", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id").notNull().references(() => bookings.id),
  amountHeld: integer("amount_held").notNull(),
  amountClaimed: integer("amount_claimed").notNull().default(0),
  amountRefunded: integer("amount_refunded").notNull().default(0),
  status: text("status", { enum: depositStatuses }).notNull().default("not_paid"),
  releasedAt: text("released_at"),
  createdAt: text("created_at").notNull(),
});

export const conditionEvidence = sqliteTable("condition_evidence", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id").notNull().references(() => bookings.id),
  uploadedBy: text("uploaded_by").notNull().references(() => users.id),
  photoUrl: text("photo_url").notNull(),
  type: text("type", { enum: evidencePhotoTypes }).notNull(),
  note: text("note"),
  createdAt: text("created_at").notNull(),
});

export const conversations = sqliteTable("conversations", {
  id: text("id").primaryKey(),
  listingId: text("listing_id").notNull().references(() => listings.id),
  bookingId: text("booking_id").references(() => bookings.id),
  renterId: text("renter_id").notNull().references(() => users.id),
  ownerId: text("owner_id").notNull().references(() => users.id),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").notNull().references(() => conversations.id),
  senderId: text("sender_id").notNull().references(() => users.id),
  body: text("body").notNull(),
  readAt: text("read_at"),
  createdAt: text("created_at").notNull(),
});

export const depositClaims = sqliteTable("deposit_claims", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id").notNull().references(() => bookings.id),
  claimedBy: text("claimed_by").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  reason: text("reason").notNull(),
  status: text("status", { enum: depositClaimStatuses }).notNull().default("draft"),
  renterRespondedAt: text("renter_responded_at"),
  resolvedAt: text("resolved_at"),
  createdAt: text("created_at").notNull(),
});

export const extensionRequests = sqliteTable("extension_requests", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id").notNull().references(() => bookings.id),
  requestedBy: text("requested_by").notNull().references(() => users.id),
  requestedEndDate: text("requested_end_date").notNull(),
  additionalPrice: integer("additional_price").notNull(),
  status: text("status", { enum: extensionStatuses }).notNull().default("requested"),
  approvedAt: text("approved_at"),
  paidAt: text("paid_at"),
  createdAt: text("created_at").notNull(),
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
  depositClaimId: text("deposit_claim_id").references(() => depositClaims.id),
  raisedBy: text("raised_by").notNull().references(() => users.id),
  reason: text("reason").notNull(),
  status: text("status", { enum: disputeStatuses }).notNull().default("open"),
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
export type ListingAvailabilitySelect = InferSelectModel<typeof listingAvailability>;
export type ListingAvailabilityInsert = InferInsertModel<typeof listingAvailability>;
export type BookingSelect = InferSelectModel<typeof bookings>;
export type BookingInsert = InferInsertModel<typeof bookings>;
export type PaymentSelect = InferSelectModel<typeof payments>;
export type PaymentInsert = InferInsertModel<typeof payments>;
export type DepositTransactionSelect = InferSelectModel<typeof depositTransactions>;
export type DepositTransactionInsert = InferInsertModel<typeof depositTransactions>;
export type ConditionEvidenceSelect = InferSelectModel<typeof conditionEvidence>;
export type ConditionEvidenceInsert = InferInsertModel<typeof conditionEvidence>;
export type ConversationSelect = InferSelectModel<typeof conversations>;
export type ConversationInsert = InferInsertModel<typeof conversations>;
export type MessageSelect = InferSelectModel<typeof messages>;
export type MessageInsert = InferInsertModel<typeof messages>;
export type DepositClaimSelect = InferSelectModel<typeof depositClaims>;
export type DepositClaimInsert = InferInsertModel<typeof depositClaims>;
export type ExtensionRequestSelect = InferSelectModel<typeof extensionRequests>;
export type ExtensionRequestInsert = InferInsertModel<typeof extensionRequests>;
export type ReviewSelect = InferSelectModel<typeof reviews>;
export type ReviewInsert = InferInsertModel<typeof reviews>;
export type DisputeSelect = InferSelectModel<typeof disputes>;
export type DisputeInsert = InferInsertModel<typeof disputes>;
