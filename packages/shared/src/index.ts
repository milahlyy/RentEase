export const categoryValues = [
  "electronics",
  "baby-gear",
  "outdoor-camping",
  "music",
  "household",
  "other",
] as const;

export const categories = [
  { value: "electronics", label: "Elektronik" },
  { value: "baby-gear", label: "Perlengkapan Bayi" },
  { value: "outdoor-camping", label: "Outdoor & Camping" },
  { value: "music", label: "Alat Musik" },
  { value: "household", label: "Rumah Tangga" },
  { value: "other", label: "Lainnya" },
] as const;

export const listingStatuses = ["draft", "active", "inactive", "rented"] as const;
export const kycStatuses = ["pending", "verified", "rejected"] as const;
export const userRoles = ["renter", "lender", "both"] as const;
export const deliveryMethods = ["delivery", "pickup"] as const;
export const bookingStatuses = [
  "pending_owner",
  "awaiting_payment",
  "confirmed",
  "ready_for_pickup",
  "in_transit",
  "active",
  "return_pending",
  "completed",
  "cancelled",
  "disputed",
] as const;
export const paymentStatuses = [
  "pending",
  "paid",
  "expired",
  "failed",
  "refunded",
  "partially_refunded",
] as const;
export const paymentTypes = ["rental", "deposit", "extension"] as const;
export const depositStatuses = [
  "not_paid",
  "held",
  "pending_refund",
  "claimed",
  "partially_claimed",
  "refunded",
  "disputed",
] as const;
export const evidencePhotoTypes = [
  "pre_handover_owner",
  "received_by_renter",
  "pre_return_renter",
  "post_return_owner",
] as const;
export const depositClaimStatuses = [
  "draft",
  "submitted",
  "approved",
  "partially_approved",
  "rejected",
  "paid",
  "disputed",
] as const;
export const extensionStatuses = ["requested", "approved", "rejected", "expired", "paid"] as const;
export const disputeStatuses = [
  "open",
  "under_review",
  "resolved_owner",
  "resolved_renter",
  "resolved_split",
  "cancelled",
] as const;

export type Category = (typeof categoryValues)[number];
export type ListingStatus = (typeof listingStatuses)[number];
export type KycStatus = (typeof kycStatuses)[number];
export type UserRole = (typeof userRoles)[number];
export type DeliveryMethod = (typeof deliveryMethods)[number];
export type BookingStatus = (typeof bookingStatuses)[number];
export type PaymentStatus = (typeof paymentStatuses)[number];
export type PaymentType = (typeof paymentTypes)[number];
export type DepositStatus = (typeof depositStatuses)[number];
export type EvidencePhotoType = (typeof evidencePhotoTypes)[number];
export type DepositClaimStatus = (typeof depositClaimStatuses)[number];
export type ExtensionStatus = (typeof extensionStatuses)[number];
export type DisputeStatus = (typeof disputeStatuses)[number];

export const categoryLabels = categories.reduce(
  (labels, category) => {
    labels[category.value] = category.label;
    return labels;
  },
  {} as Record<Category, string>,
);

export const legacyCategoryLabels = categories.reduce(
  (labels, category) => {
    labels[category.label] = category.value;
    return labels;
  },
  {} as Record<string, Category>,
);

export function isCategory(value: string): value is Category {
  return value in categoryLabels;
}

export function toCategoryValue(value: string): Category | null {
  if (isCategory(value)) {
    return value;
  }

  return legacyCategoryLabels[value] ?? null;
}

export function getCategoryLabel(value: Category | string): string {
  const categoryValue = toCategoryValue(value);

  return categoryValue ? categoryLabels[categoryValue] : value;
}

export const bookingStatusLabels: Record<BookingStatus, string> = {
  active: "Sedang disewa",
  awaiting_payment: "Menunggu pembayaran",
  cancelled: "Dibatalkan",
  completed: "Selesai",
  confirmed: "Dikonfirmasi",
  disputed: "Dispute",
  in_transit: "Dalam perjalanan",
  pending_owner: "Menunggu pemilik",
  ready_for_pickup: "Siap diambil",
  return_pending: "Menunggu pengembalian",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  expired: "Kedaluwarsa",
  failed: "Gagal",
  paid: "Terbayar",
  partially_refunded: "Refund sebagian",
  pending: "Menunggu pembayaran",
  refunded: "Refund",
};

export const depositStatusLabels: Record<DepositStatus, string> = {
  claimed: "Diklaim",
  disputed: "Dispute",
  held: "Ditahan platform",
  not_paid: "Belum dibayar",
  partially_claimed: "Diklaim sebagian",
  pending_refund: "Menunggu refund",
  refunded: "Dikembalikan",
};

export const evidencePhotoTypeLabels: Record<EvidencePhotoType, string> = {
  post_return_owner: "Foto setelah kembali",
  pre_handover_owner: "Foto sebelum serah terima",
  pre_return_renter: "Foto sebelum dikembalikan",
  received_by_renter: "Foto saat diterima penyewa",
};

export const depositClaimStatusLabels: Record<DepositClaimStatus, string> = {
  approved: "Disetujui",
  disputed: "Dispute",
  draft: "Draft",
  paid: "Dibayarkan",
  partially_approved: "Disetujui sebagian",
  rejected: "Ditolak",
  submitted: "Menunggu respons penyewa",
};

export const extensionStatusLabels: Record<ExtensionStatus, string> = {
  approved: "Disetujui",
  expired: "Kedaluwarsa",
  paid: "Terbayar",
  rejected: "Ditolak",
  requested: "Menunggu persetujuan",
};

export const disputeStatusLabels: Record<DisputeStatus, string> = {
  cancelled: "Dibatalkan",
  open: "Terbuka",
  resolved_owner: "Selesai untuk pemilik",
  resolved_renter: "Selesai untuk penyewa",
  resolved_split: "Selesai sebagian",
  under_review: "Sedang direview",
};

export type User = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
  avatarUrl: string | null;
  isVerified: boolean;
  isAdmin: boolean;
  kycStatus: KycStatus;
  createdAt: string;
};

export type ListingOwner = {
  id: string;
  name: string;
  isVerified: boolean;
  rating: number;
};

export type ListingPhoto = {
  id: string;
  url: string;
  order: number;
  isPrimary: boolean;
};

export type ListingAvailability = {
  id: string;
  listingId: string;
  startDate: string;
  endDate: string;
  reason: string | null;
};

export type Listing = {
  id: string;
  ownerId: string;
  title: string;
  category: Category;
  description: string;
  condition: number;
  pricePerDay: number;
  depositAmount: number;
  location: string;
  status: ListingStatus;
  createdAt: string;
  rating: number;
  reviewCount: number;
  primaryPhotoUrl: string | null;
  photos?: ListingPhoto[];
  owner: ListingOwner;
};

export type Booking = {
  id: string;
  listingId: string;
  renterId: string;
  lenderId: string;
  startDate: string;
  endDate: string;
  rentalPrice: number;
  depositAmount: number;
  deliveryFee: number;
  lateFee: number;
  deliveryMethod: DeliveryMethod;
  status: BookingStatus;
  whatsappUnlockedAt: string | null;
  createdAt: string;
};

export type Payment = {
  id: string;
  bookingId: string;
  midtransOrderId: string;
  amount: number;
  type: PaymentType;
  status: PaymentStatus;
  paidAt: string | null;
};

export type DepositTransaction = {
  id: string;
  bookingId: string;
  amountHeld: number;
  amountClaimed: number;
  amountRefunded: number;
  status: DepositStatus;
  releasedAt: string | null;
  createdAt: string;
};

export type ConditionEvidence = {
  id: string;
  bookingId: string;
  uploadedBy: string;
  type: EvidencePhotoType;
  photoUrl: string;
  note: string | null;
  createdAt: string;
};

export type Conversation = {
  id: string;
  listingId: string;
  bookingId: string | null;
  renterId: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export type ListingReview = {
  id: string;
  bookingId: string;
  reviewerId: string;
  reviewerName: string;
  revieweeId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
};

export type DepositClaim = {
  id: string;
  bookingId: string;
  claimedBy: string;
  amount: number;
  reason: string;
  status: DepositClaimStatus;
  renterRespondedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
};

export type ExtensionRequest = {
  id: string;
  bookingId: string;
  requestedBy: string;
  requestedEndDate: string;
  additionalPrice: number;
  status: ExtensionStatus;
  approvedAt: string | null;
  paidAt: string | null;
  createdAt: string;
};

export type Dispute = {
  id: string;
  bookingId: string;
  depositClaimId: string | null;
  raisedBy: string;
  reason: string;
  status: DisputeStatus;
  resolvedAt: string | null;
};
