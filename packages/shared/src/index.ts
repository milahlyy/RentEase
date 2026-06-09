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

export type Category = (typeof categories)[number]["value"];
export type ListingStatus = (typeof listingStatuses)[number];
export type KycStatus = (typeof kycStatuses)[number];
export type UserRole = (typeof userRoles)[number];

export type User = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
  avatarUrl: string | null;
  isVerified: boolean;
  kycStatus: KycStatus;
  createdAt: string;
};
