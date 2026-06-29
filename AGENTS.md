# AGENTS.md

Panduan kerja untuk AI coding agents di repo RentEase. Baca file ini sebelum mengubah kode.

## Project Context

RentEase adalah web app marketplace rental P2P untuk Indonesia. MVP berfokus pada rental barang antar pengguna dengan listing, search/filter, booking calendar, KYC, payment flow Midtrans, escrow-style transaction flow, rating, dan dashboard untuk mode penyewa/pemilik.

Prioritas produk: trust, clarity, dan transaksi yang mudah dipahami. Jangan membuat UI atau flow yang membuat status booking, pembayaran, KYC, atau kepemilikan barang menjadi ambigu.

## Repo Structure

- `apps/web`: Next.js 14 App Router frontend.
- `apps/api`: Hono API untuk Cloudflare Workers.
- `packages/shared`: shared constants, enums, dan TypeScript types.
- `packages/db`: Drizzle schema dan database helpers untuk Cloudflare D1.
- `docs`: product, architecture, environment, dan design notes.

## Source Of Truth

- Product requirements: `docs/RentEase_PRD.md`
- Business model and go-to-market: `docs/business_model.md`
- Architecture notes: `docs/architecture.md`
- Design system: `docs/DESIGN.md`
- Environment notes: `docs/environment.md`

Jika PRD dan implementasi berbeda, ikuti PRD untuk behavior produk dan catat asumsi di perubahan. Jika design detail berbeda dengan komponen yang sudah ada, pertahankan konsistensi UI yang sudah berjalan kecuali instruksi user meminta perubahan.

## Commands

Use Bun workspaces.

```bash
bun install
bun dev
bun lint
bun typecheck
bun build
```

Jika dependency belum ter-install, jangan mengubah `packageManager` atau pindah package manager tanpa instruksi user.

## Coding Rules

- Gunakan TypeScript strict.
- Pertahankan boundary modul:
  - UI, routing, form, dan client state di `apps/web`.
  - API endpoints, auth callbacks, booking/payment workflow, dan integration callbacks di `apps/api`.
  - Shared enum/type di `packages/shared`.
  - Database schema/query primitives di `packages/db`.
- Jangan hardcode secret, API key, Midtrans key, Google OAuth secret, atau Cloudflare credential.
- Tambahkan env baru ke `.env.example` saat memperkenalkan konfigurasi baru.
- Untuk data structured, gunakan schema/type yang eksplisit. Hindari stringly-typed status baru jika bisa ditambahkan ke shared constants.
- Jaga perubahan tetap scoped ke request user. Jangan refactor besar tanpa kebutuhan langsung.

## Design Rules

Ikuti `docs/DESIGN.md` untuk semua UI. Ringkasan aturan wajib:

- Vibe: grounded trust marketplace, clean, practical, approachable.
- UI harus mengurangi kecemasan P2P rental lewat status yang jelas, copy spesifik, dan CTA yang tidak membingungkan.
- Gunakan Plus Jakarta Sans via `next/font/google` untuk frontend.
- Primary action color: deep teal dari design tokens.
- Harga selalu `font-bold text-primary`.
- Listing card wajib menampilkan gambar, nama, harga/hari, dan rating atau badge `Baru`.
- Status badge harus konsisten dengan mapping warna di `docs/DESIGN.md`.
- Verified KYC badge gunakan Lucide `BadgeCheck`, `w-4 h-4`, `text-green-500`, tanpa teks "Verified".
- Semua form field wajib punya label di atas input, placeholder tetap boleh ada.
- Error form tampil inline di bawah field, bukan hanya toast.
- Empty state wajib ada untuk halaman yang bisa kosong.
- Loading content block gunakan Skeleton, spinner hanya untuk submit/inline actions.
- Gunakan Lucide React untuk icon. Jangan campur icon library lain.
- Hindari auto-playing carousel, parallax, scroll reveal, dan animasi dekoratif.

## Frontend Expectations

- Mobile-first dari 360px, lalu expand ke tablet/desktop.
- Gunakan Tailwind CSS dan shadcn/ui style patterns.
- Komponen shadcn yang diizinkan sesuai `docs/DESIGN.md`: Button, Card, Input, Textarea, Label, Select, Dialog, Badge, Calendar, Popover, Tabs, Avatar, Skeleton, Toast/Sonner, Separator, Breadcrumb.
- Jangan menambahkan UI library lain tanpa alasan kuat.
- Page-specific rules dari `docs/DESIGN.md` harus diikuti untuk homepage, explore, listing detail, auth pages, dan dashboard.

## Backend Expectations

- API berjalan di Cloudflare Workers dengan Hono.
- Database target Cloudflare D1 via Drizzle ORM.
- File upload target Cloudflare R2.
- Payment gateway target Midtrans. Callback payment harus dirancang idempotent dan memvalidasi signature key.
- Auth endpoint harus mempertimbangkan rate limiting dan JWT/session security.
- KYC files hanya boleh diakses user terkait dan admin.

## Domain Statuses

Pertahankan status domain yang mudah dibaca user:

- KYC: `pending`, `verified`, `rejected`
- Listing: `draft`, `active`, `inactive`, `rented`
- Booking/payment/review/dispute status harus ditambahkan secara eksplisit ketika workflow-nya dibuat, lalu dipakai konsisten di UI badge dan API responses.

## Git And Collaboration

- Jangan revert perubahan yang tidak dibuat agent kecuali user meminta.
- Jika menemukan file untracked atau modified dari user, perlakukan sebagai milik user dan jangan hapus.
- Sebelum commit, jalankan minimal:

```bash
git status --short
git diff --check
```

- Jika dependency sudah tersedia, jalankan juga `bun lint` dan `bun typecheck` untuk perubahan code.
- Commit hanya jika user meminta commit atau task eksplisit membutuhkan commit.

## Notes For Current Scaffold

Repo saat ini adalah scaffold awal. Dependency mungkin belum ter-install dan `bun.lock` mungkin belum ada sampai `bun install` berhasil dijalankan.
