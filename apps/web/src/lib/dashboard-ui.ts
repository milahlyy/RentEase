import type { LucideIcon } from "lucide-react";

export type DashboardMode = "renter" | "lender";

export type DashboardStat = {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
};

export type DashboardLink = {
  description: string;
  href: string;
  label: string;
  icon: LucideIcon;
};

export function parseDashboardMode(value: string | null): DashboardMode {
  return value === "lender" ? "lender" : "renter";
}
