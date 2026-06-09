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
export const userRoles = ["renter", "lender", "dual"] as const;

export type Category = (typeof categories)[number]["value"];
export type ListingStatus = (typeof listingStatuses)[number];
export type KycStatus = (typeof kycStatuses)[number];
export type UserRole = (typeof userRoles)[number];
