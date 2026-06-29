# RentEase

RentEase is a P2P rental marketplace web app for Indonesia. The MVP focuses on trusted item rentals with listings, search, booking, KYC, escrow-style payments, ratings, and renter/lender dashboards.

## Stack

- Monorepo: Turborepo + Bun workspaces
- Web: Next.js 14 App Router, Tailwind CSS
- API: Hono on Cloudflare Workers
- Database: Cloudflare D1 with Drizzle ORM
- Storage: Cloudflare R2
- Payments: Midtrans
- Email: Resend

## Repository Structure

```text
apps/
  web/        Next.js frontend
  api/        Hono API for Cloudflare Workers
packages/
  db/         Drizzle schema and database helpers
  shared/     Shared constants and TypeScript types
docs/         Product, business, design, environment, and architecture notes
```

## Getting Started

```bash
bun install
bun dev
```

Copy `.env.example` to `.env` and fill in the values for local development.

## MVP Scope

The current repository is only the initial scaffold. Implementation should follow the PRD milestones:

1. Auth, onboarding, and base profile
2. Listing CRUD, photo upload, search, and filters
3. Booking calendar and Midtrans integration
4. Renter/lender dashboards and order management
5. Rating, KYC upload, notifications, and basic disputes
6. Polish, performance, and production deployment

Business assumptions, revenue model, go-to-market, and operational rules are tracked in `docs/business_model.md`.
