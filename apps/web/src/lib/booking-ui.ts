import type { Booking, BookingStatus } from "@rentease/shared";

export type BookingSummary = {
  booking: Booking;
  listing: {
    id: string;
    location: string;
    photoUrl: string | null;
    title: string;
  };
  owner: {
    id: string;
    isVerified: boolean;
    name: string;
  };
  renter: {
    id: string;
    name: string;
  };
  statusLabel: string;
};

export type BookingsResponse = {
  bookings: BookingSummary[];
};

export function bookingTotal(booking: Booking) {
  return booking.rentalPrice + booking.depositAmount + booking.deliveryFee + booking.lateFee;
}

export function bookingStatusTone(status: BookingStatus) {
  const tones: Record<
    BookingStatus,
    "danger" | "neutral" | "primary" | "success" | "warning"
  > = {
    active: "primary",
    awaiting_payment: "warning",
    cancelled: "neutral",
    completed: "success",
    confirmed: "success",
    disputed: "danger",
    in_transit: "primary",
    pending_owner: "warning",
    ready_for_pickup: "primary",
    return_pending: "warning",
  };

  return tones[status];
}

export function deliveryMethodLabel(method: Booking["deliveryMethod"]) {
  return method === "pickup" ? "Ambil sendiri" : "Dikirim pemilik";
}
