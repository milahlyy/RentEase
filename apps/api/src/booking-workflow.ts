import type { BookingStatus, EvidencePhotoType } from "@rentease/shared";

export const activeBookingStatuses: BookingStatus[] = [
  "pending_owner",
  "awaiting_payment",
  "confirmed",
  "ready_for_pickup",
  "in_transit",
  "active",
  "return_pending",
  "disputed",
];

export const activeBookingStatusesSql = activeBookingStatuses.map((status) => `'${status}'`).join(", ");

export type BookingLifecycleAction =
  | "mark_ready"
  | "confirm_received"
  | "request_return"
  | "confirm_return_good";

export type WorkflowRole = "lender" | "renter";

export type BookingLifecycleTransition = {
  evidenceType: EvidencePhotoType;
  from: BookingStatus;
  role: WorkflowRole;
  to: BookingStatus;
};

export const lifecycleTransitions: Record<BookingLifecycleAction, BookingLifecycleTransition> = {
  confirm_received: {
    evidenceType: "received_by_renter",
    from: "ready_for_pickup",
    role: "renter",
    to: "active",
  },
  confirm_return_good: {
    evidenceType: "post_return_owner",
    from: "return_pending",
    role: "lender",
    to: "completed",
  },
  mark_ready: {
    evidenceType: "pre_handover_owner",
    from: "confirmed",
    role: "lender",
    to: "ready_for_pickup",
  },
  request_return: {
    evidenceType: "pre_return_renter",
    from: "active",
    role: "renter",
    to: "return_pending",
  },
};

export const allowedEvidenceStatuses: Record<EvidencePhotoType, BookingStatus[]> = {
  post_return_owner: ["return_pending", "completed"],
  pre_handover_owner: ["confirmed", "ready_for_pickup"],
  pre_return_renter: ["active", "return_pending"],
  received_by_renter: ["ready_for_pickup", "active"],
};

export function evidenceOwnerFor(type: EvidencePhotoType): WorkflowRole {
  return type === "pre_handover_owner" || type === "post_return_owner" ? "lender" : "renter";
}
