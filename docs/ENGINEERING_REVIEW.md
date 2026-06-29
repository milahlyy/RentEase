# RentEase Engineering Review

**Date:** 2026-06-28  
**Reviewer stance:** senior SWE review across product fit, architecture, API, frontend, design system, data model, and delivery readiness.  
**Scope reviewed:** `AGENTS.md`, `docs/*`, `apps/web`, `apps/api`, `packages/shared`, `packages/db`, workspace scripts/config.

---

## Executive Summary

RentEase is moving in the right direction. The product foundation is coherent: trust-first marketplace, web-first MVP, clear PRD/business alignment, and a frontend that now has real discovery, auth, profile, identity verification, listing detail, and dashboard shell flows.

The strongest parts today are:
- Product direction is clear and grounded in rental trust concerns.
- Frontend UX is no longer a generic landing page; it behaves like an actual marketplace shell.
- Shared constants/types have started to reduce status/category drift.
- The dashboard shell establishes the correct information architecture before booking/payment.

The biggest risks are:
- Auth/session security and API hardening are still MVP-grade, not production-grade.
- Transaction-critical schema is still incomplete for the PRD deposit/evidence/dispute lifecycle.
- API still bypasses `packages/db` query primitives and uses raw SQL directly.
- Tooling/CI is not reliable from root because Turbo/local install/cache behavior is currently unstable.
- Some frontend state/data fetching patterns are duplicated and will become expensive as pages grow.

Verdict: **good MVP scaffold, not yet transaction-ready.** The next engineering work should focus on stabilizing foundations before adding payment/dispute complexity.

---

## Current Product State

Implemented or partially implemented:
- Homepage with search and category shortcuts.
- Explore page with search, filters, sorting, load-more behavior.
- Listing card and listing detail page.
- Email/password auth with local token storage.
- Profile settings and identity verification UI mock.
- Dashboard shell with renter/lender segmented view and placeholder child routes.
- Hono API for auth and listings.
- Drizzle schema/migrations for users, KYC documents, listings, listing photos, availability, bookings, payments, reviews, disputes.

Still not implemented:
- Real booking request flow.
- Availability-aware booking/calendar behavior.
- Listing management UI and create listing form.
- Payment simulation/Midtrans.
- Deposit hold/refund/claim/dispute data flow.
- Evidence photo upload flow.
- Admin review tools.
- Email OTP, Google OAuth, forgot password.

---

## Findings By Priority

### P0/P1 - Fix Before Building Payment/Booking Deeply

1. **Root tooling is not reliable enough for team/CI work.**
   - Root scripts use `turbo` from `package.json`, but prior root `bun lint` / `bun typecheck` runs failed because the local Turbo binary/cache/log path was not usable.
   - Package-level checks work, but root orchestration is the command contributors will naturally run.
   - Recommendation: fix workspace install/linking and Turbo cache behavior before relying on CI-like validation.

2. **Auth is MVP-only and should not be considered production secure.**
   - JWT is stored in `localStorage`, which is vulnerable to token theft if XSS appears.
   - Custom JWT verification does not validate JWT header algorithm semantics beyond recomputing signature.
   - Rate limiting is an in-memory `Map` in `apps/api/src/auth.ts`, which will not be reliable across Cloudflare isolate instances.
   - No session revocation, refresh rotation, email verification, forgot password, or OAuth implementation yet.
   - Recommendation: before payment/deposit, move toward httpOnly cookie/session or a well-vetted auth library, and use Durable Object/KV/R2-compatible rate limiting if kept custom.

3. **Transaction schema is still incomplete relative to PRD/business plan.**
   - Existing schema has `bookings`, `payments`, `reviews`, `disputes`, but PRD also requires deposit transactions, condition evidence, deposit claims, extension requests, and richer lifecycle fields.
   - This matters because deposit partial claims, evidence photos, extensions, late fees, and dispute review are core differentiators.
   - Recommendation: before Step 4 booking, add the missing transaction tables/status ownership in `packages/db` and `packages/shared`.

4. **Listing ratings likely regressed to all `Baru`.**
   - Listing API now derives rating from `reviews`, but seed data does not seed reviews.
   - Previously seeded listing-specific ratings were hardcoded in API; now cards may show zero reviews for every listing.
   - Recommendation: either seed realistic review rows or explicitly treat ratings as absent until review workflow exists.

5. **API still bypasses the intended DB boundary.**
   - `apps/api/src/listings.ts` and `apps/api/src/auth.ts` call `c.env.DB.prepare(...)` directly.
   - AGENTS/architecture says `packages/db` should own schema/query primitives.
   - Recommendation: create query helpers in `packages/db` or an API-side repository layer that maps Drizzle schema to D1 access consistently.

### P2 - Important Before Scale

6. **Frontend auth fetching is duplicated.**
   - `SiteHeader`, profile, KYC, dashboard, and dashboard placeholders each fetch `/auth/me`.
   - This causes repeated network calls, auth flicker, and duplicated invalid-token handling.
   - Recommendation: create a shared `useCurrentUser` hook or `AuthProvider` with cache/invalidation, and let `SiteHeader` consume that state.

7. **Explore page has race/stale-state risk.**
   - Search/filter requests are debounced but not cancellable.
   - Multiple inflight requests can resolve out of order.
   - Load-more appends by `page > 1`; changing filters while a previous page request resolves could append stale results.
   - Recommendation: use `AbortController` or request sequence IDs, and separate "query state" from "loaded pages".

8. **Local DB migration compatibility needs care.**
   - Initial migration/schema were changed after local D1 state already existed.
   - Existing local databases may have old columns like `blocked_date`, `total_price`, `deposit`.
   - Recommendation: document reset steps for local D1 or add a proper follow-up migration for already-created dev DBs.

9. **KYC/identity verification is currently UI-only.**
   - This is okay for the current step, but KYC documents in schema require non-null URLs while UI upload is mock-only.
   - Recommendation: next identity iteration should add a minimal API contract for status/document submission, even if file storage remains mocked.

10. **Dashboard placeholders are healthy, but they create route expectations.**
   - `/dashboard/lender/listings` exists as placeholder, but Step 3 will need `/dashboard/lender/listings/new`.
   - Recommendation: in Step 3, preserve current placeholder copy but replace it with real owner listing data and a create CTA.

### P3 - Polish / Maintainability

11. **Some design text still exposes implementation state.**
   - Copy like "data asli akan masuk setelah workflow terkait dibuat" is useful for MVP demo but should disappear in production.
   - Recommendation: keep demo copy while presenting, but track it as a launch cleanup item.

12. **Google buttons are inert.**
   - Login/register show Google buttons, but no handler or disabled state.
   - Recommendation: either implement Google OAuth or visually mark these as "Segera" / disabled until implemented.

13. **Formatting/tooling versions are inconsistent.**
   - `package.json` asks Turbo `^2.0.12`, lockfile currently resolves Turbo `2.9.16`.
   - This may be fine semver-wise, but the root command failure makes it worth cleaning.

---

## Architecture Review

### What Is Good

- Monorepo boundaries are understandable: `apps/web`, `apps/api`, `packages/shared`, `packages/db`.
- Shared category/status constants are a strong step toward domain consistency.
- PRD, architecture, business model, and design docs now reinforce the same trust-first direction.
- Dashboard-first sequencing is correct; it prevents booking/payment pages from becoming orphan flows.

### Main Architecture Gap

The architecture document says DB primitives should live in `packages/db`, but implementation still keeps most query behavior inside API route files. This is okay for a scaffold, but it will become painful once booking/payment/dispute rules need consistency.

Recommended next architecture move:
- Add query modules for auth/listings in or near `packages/db`.
- Keep route handlers thin: validate request, call domain/query function, return response.
- Keep status transitions centralized before building booking.

---

## API Review

### Strengths

- Response shape is consistent: `{ success, data }` or `{ success, error }`.
- Input validation uses Zod for auth and listing creation.
- Listing search/filter/sort are already useful for MVP discovery.
- Protected `POST /listings` checks bearer token and defaults listing to draft.

### Risks

- No global error normalization around DB failures.
- Auth errors are user-friendly, but API internals will still throw raw D1 errors if migration/DB state is wrong.
- Search/filter are raw SQL strings with manual bindings. Bindings are used, which is good, but query construction will get complex as availability and location filters are added.
- Rating behavior is unclear: current query joins reviews by `reviewee_id = owner`, so card rating behaves like owner rating, not listing-specific item rating.

Recommended next API work:
- Add small error middleware or route wrapper for consistent 500 responses.
- Decide whether listing cards show owner rating, listing rating, or both.
- Add endpoint-level tests for auth/listings before booking.

---

## Database / Domain Model Review

### Strengths

- Core tables for users, KYC, listings, listing photos, availability, bookings, payments, reviews, disputes exist.
- Shared constants cover many future domain statuses.
- Availability now supports date range and reason.

### Gaps

- Missing PRD tables: `deposit_transactions`, `condition_evidence`, `deposit_claims`, `extension_requests`.
- Payments has `type`, but no deposit transaction table to model held/refunded/claimed state separately.
- Reviews exist but seed data does not create review records.
- KYC documents require URLs but current UI is mock upload only.

Recommended before booking:
- Add full transaction evidence/deposit tables before wiring status pages.
- Seed one or two realistic completed transactions later to exercise dashboard/reviews.

---

## Frontend Review

### Strengths

- App now has real navigable surfaces: homepage, explore, listing detail, auth, profile, identity verification, dashboard.
- `SiteHeader`, `PageShell`, `PageContainer`, and `PageHeader` improved consistency significantly.
- Listing card is reusable and follows design constraints.
- Dashboard shell creates a good UX path for both renter and lender modes.
- Locked/loading/error states are much more consistent than before.

### Risks

- Most pages are client components, even pages that could partially SSR or server-render shell content.
- Auth state is fetched separately in multiple components.
- Explore state management is doing a lot in one component and will become fragile with availability/location/condition filters.
- Dashboard dummy stats are okay, but should be replaced through a clear API boundary soon.

Recommended frontend refactor:
- Create shared auth hook/provider.
- Create reusable `EmptyState`, `StatCard`, `StatusBadge`, and maybe `AuthGate` components.
- Split explore filter/search data logic from UI presentation.

---

## Design / UX Review

### What Works

- The redesign direction is much more grounded than the earlier glassy/neumorphic look.
- Header/layout consistency improved.
- Moderate radius and solid cards are better for a marketplace.
- User-facing "Verifikasi Identitas" is much clearer than "KYC".
- WhatsApp locked copy and deposit copy align with trust policy.

### What Still Needs Work

- Some surfaces still feel "demo dashboard" because of placeholder copy and zero-value stat cards.
- Large mint-filled blocks are reduced but still frequent in profile/detail info wells.
- Homepage is usable, but "Baru Ditambahkan" depends heavily on seeded photo quality and ratings.
- Auth pages have Google buttons that look active but do nothing.

Recommended design next step:
- Build one polished real workflow page next, preferably lender listings/create listing, so design can be judged on real data entry and management density.

---

## Testing / Tooling Review

Checks run during review:
- `bunx next lint --no-cache` in `apps/web`: passed.
- `bunx tsc --noEmit --incremental false` in `apps/web`: passed.
- `bun run typecheck` in `apps/api`: passed.
- `bun run typecheck` in `packages/db`: passed.
- `bun run typecheck` in `packages/shared`: passed.
- `git diff --check`: passed.

Known tooling issue:
- Root `bun lint` / `bun typecheck` previously failed due Turbo/local binary/cache permission behavior.
- This should be fixed before treating the repo as CI-ready.

Missing tests:
- No API unit/integration tests.
- No frontend component tests.
- No Playwright smoke tests.
- No migration/seed validation test.

Recommended minimum test suite:
- API tests for auth login/register/me and listing query filters.
- Playwright smoke tests for homepage, explore, listing detail, login, dashboard locked/logged-in states.
- DB seed smoke test to ensure listings/photos/reviews display as expected.

---

## Recommended Next Engineering Plan

### Immediate Cleanup Before Step 3

1. Fix root Turbo/tooling so `bun lint` and `bun typecheck` work reliably.
2. Add seeded review data or intentionally remove rating expectations until review workflow exists.
3. Centralize current-user fetching into a shared auth hook/provider.
4. Add an `EmptyState` and `StatusBadge` component to reduce UI duplication.

### Step 3 - Lender Listings + Create Listing

Build:
- `/dashboard/lender/listings`
- `/dashboard/lender/listings/new`

Recommended shape:
- Use existing `POST /listings`.
- Keep photo upload as URL/placeholder only.
- Store category canonical value.
- Show owner listings from a new protected API endpoint instead of filtering all public listings.
- Add draft/active UI but do not implement full publish workflow unless scoped.

### Before Step 4 Booking

Do not start booking until these are clarified:
- Full booking/deposit/evidence schema.
- Availability overlap rules.
- Booking status transition map.
- Payment simulation vs Midtrans sandbox boundary.
- Whether WhatsApp unlock is a timestamp on booking only or derived from booking/payment status.

---

## Overall Scorecard

| Area | Rating | Notes |
|---|---:|---|
| Product direction | 8/10 | Clear trust-first marketplace direction. |
| Frontend UX | 7/10 | Good shell and navigation; real workflows still thin. |
| Visual design | 7/10 | Much more grounded; still needs real workflow polish. |
| API design | 5/10 | Useful MVP endpoints, but too much raw route-level SQL. |
| Data model | 5/10 | Core scaffold exists; transaction lifecycle incomplete. |
| Auth/security | 4/10 | Fine for demo; not ready for money/deposit flow. |
| Tooling/CI | 4/10 | Package checks pass, root orchestration unreliable. |
| Maintainability | 6/10 | Improving, but auth/data fetching duplication should be addressed soon. |

Final assessment: **continue step-by-step, but keep pausing for foundation cleanup before money/status-heavy features.** RentEase is now a credible MVP scaffold; the next risk is moving too fast into booking/payment before the transaction model is strong enough.
