# Environment Setup

## Local Apps

- Web app: `http://localhost:3000`
- API worker: `http://localhost:8787`

## Required Services

- Cloudflare account for Pages, Workers, D1, and R2
- Google OAuth credentials
- Midtrans sandbox credentials only if real payment sandbox is explicitly tested later
- Resend API key

## Local Development Notes

- Keep secrets in `.env` or `.dev.vars`.
- Do not commit production credentials.
- Run D1 migrations and `bun seed` before using listing/auth API locally; API routes assume tables already exist and no longer create or seed schema at request time.
- Step 3 owner listing pages use protected listing APIs, so local D1 must include the latest migrations before opening `/dashboard/lender/listings`.
- Step 3.5 migrations add transaction-readiness tables and PRD-aligned fields for deposit transactions, condition evidence, deposit claims, extension requests, and disputes. These are schema-only until booking/payment endpoints are implemented.
- Seed data includes completed demo bookings and reviews so marketplace cards show a realistic mix of ratings and `Baru` badges.
- Listing photo upload uses the Worker R2 binding `ASSETS`. In local dev, run the API through Wrangler so `/uploads/listing-photos` can write to R2/local R2 and `/assets/*` can serve uploaded images back to the web app.
- Upload endpoints use basic in-memory rate limiting for MVP demos. Production should move this to Cloudflare WAF/Turnstile or a durable rate-limit store.
- Avatar and listing photos are served as public assets. KYC files and future dispute evidence should use private object access with signed/admin-only retrieval before production.
- Coursework/local demo uses platform payment simulation, not real Midtrans checkout. The UI should make this clear with demo copy.
- A future real Midtrans callback must be idempotent by `midtrans_order_id`, validate signature keys, and never transition a booking twice.
- Use manual KYC review for the MVP unless a third-party verification provider is selected later.
- Treat deposit hold, partial refund, and escrow release as simulation in local/demo environments unless a production Midtrans/legal payout setup is explicitly available.
- Keep admin review tools available in non-production so KYC, deposit claims, and disputes can be tested end-to-end.
