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
- Listings: item data, category, photos, price, deposit, availability, listing status
- Discovery: search, filters, sorting, pagination
- Booking: dates, renter/lender relationship, delivery method, status tracking
- Payment: Midtrans order, payment status, escrow release simulation or production flow
- Trust: reviews, ratings, verification badges, basic dispute handling

## Deployment Target

- Frontend: Cloudflare Pages
- API: Cloudflare Workers
- Database: Cloudflare D1
- Assets: Cloudflare R2
