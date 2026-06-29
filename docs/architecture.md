# RentEase Architecture

## Product Direction

RentEase is a web-first P2P rental marketplace for urban Indonesia. The MVP should support two user modes in one account: renter and lender.

## Runtime Boundaries

- `apps/web` owns user-facing screens, routing, forms, client state, and frontend validation.
- `apps/api` owns authentication endpoints, listing APIs, booking workflows, payment callbacks, and notification triggers.
- `packages/shared` owns shared enums, constants, and request/response types.
- `packages/db` owns Drizzle schema and database access primitives.

## Core Domains

- Identity: registration, login, Google OAuth, email OTP, KYC status
- Listings: item data, category, photos, price, deposit, availability blocking by single date or date range, listing status
- Discovery: search, filters, sorting, pagination
- Booking: dates, renter/lender relationship, delivery method, status tracking, handover and return confirmation
- Payment: platform payment simulation for coursework/local demo, future Midtrans order/callback flow for production, deposit hold, partial refund, late fee capture
- Evidence: required condition photos before handover, on renter receipt, before return, and after owner receives the item back
- Trust: reviews, ratings, verification badges, completed transaction count, response indicators, basic dispute handling
- Admin Operations: manual KYC review, payment/deposit monitoring, dispute review, and report handling

## Transaction Lifecycle

The MVP transaction flow must keep money, item custody, and user-visible status aligned:

1. Renter requests a booking for available dates.
2. Owner accepts or rejects within 24 hours.
3. Renter pays rental fee and deposit through platform payment simulation in the coursework demo. A future production build can replace this with Midtrans after callback/idempotency policy is ready.
4. Owner uploads pre-handover condition photos and confirms delivery or pickup readiness.
5. Renter uploads receipt condition photos and confirms item received.
6. Rental fee is marked as paid in the demo flow; deposit remains held by the platform simulation.
7. Renter uploads pre-return photos before returning.
8. Owner uploads post-return photos and confirms item condition.
9. If item is fine, deposit is refunded. If damaged or late, owner creates a deposit claim.
10. Renter accepts claim for partial/full deposit release or escalates to dispute/admin review.

WhatsApp contact should only be unlocked after owner acceptance and successful payment so pre-transaction negotiation stays inside the platform.

## Shared Status Ownership

`packages/shared` should own domain statuses for booking, payment, deposit, evidence, extension, and dispute. UI badge mapping and API validation must consume the same status constants instead of defining string literals locally.

## Deployment Target

- Frontend: Cloudflare Pages
- API: Cloudflare Workers
- Database: Cloudflare D1
- Assets: Cloudflare R2
