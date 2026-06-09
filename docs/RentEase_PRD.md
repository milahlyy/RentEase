# Product Requirements Document
# RentEase — P2P Rental Marketplace Web App

**Version:** 1.0 (MVP)
**Date:** June 2026
**Team:** Muhammad Rafqy, Sekar, Alya, Muhammad Rizal, Tresia
**Status:** Draft

---

## 1. Overview

### 1.1 Problem Statement
Masyarakat urban Indonesia menghadapi tiga masalah nyata:
1. Beban finansial barang "fase pendek" (stroller, baby gear) yang hanya dipakai sementara
2. Aset hobi & elektronik (kamera, drone) yang menganggur dan menyusut nilainya
3. Modal awal tinggi untuk mencoba hobi baru sehingga menghambat eksplorasi

Saat ini penyewaan barang antar individu terjadi secara informal (grup WhatsApp, Instagram) dengan nol keamanan transaksi, nol verifikasi identitas, dan nol perlindungan barang.

### 1.2 Solution
RentEase adalah marketplace web berbasis P2P yang memungkinkan pengguna menyewakan dan menyewa barang dalam satu platform terintegrasi — dengan sistem escrow, verifikasi KTP, booking calendar, dan rating yang membangun kepercayaan.

### 1.3 Goals (MVP)
- Pengguna bisa mendaftar, verifikasi identitas, dan memilih peran (penyewa/pemilik)
- Pemilik bisa upload listing barang dengan harga dan jadwal ketersediaan
- Penyewa bisa cari, filter, lihat detail, dan booking barang
- Transaksi terfasilitasi dengan sistem pembayaran dan escrow
- Kedua pihak bisa saling beri rating setelah transaksi selesai

### 1.4 Non-Goals (di luar scope MVP)
- Aplikasi mobile native (iOS/Android)
- Fitur live chat real-time antar pengguna
- Micro-insurance add-on (Phase 2)
- Featured/sponsored listings (Phase 2)
- Ekspansi luar Jabodetabek (Phase 2)

---

## 2. User Personas

### Persona A — Renter (Penyewa)
**Rendy, 22 tahun, mahasiswa Sistem Informasi**
- Butuh kamera DSLR untuk tugas dokumentasi, tapi tidak mau beli
- Familiar dengan marketplace digital, terbiasa transaksi online
- Pain point: takut ditipu, tidak ada jaminan kondisi barang

### Persona B — Lender (Pemilik Barang)
**Siti, 30 tahun, ibu muda di Jakarta**
- Punya stroller premium yang sudah tidak terpakai sejak anak masuk SD
- Ingin dapat passive income tapi tidak mau repot
- Pain point: takut barang rusak, tidak tahu cara menetapkan harga

### Persona C — Dual Role
**Andi, 27 tahun, freelancer fotografer**
- Punya beberapa lensa yang disewakan, tapi juga kadang butuh drone untuk proyek
- Ingin satu akun yang bisa handle keduanya

---

## 3. User Stories & Acceptance Criteria

### 3.1 Autentikasi & Profil

**US-01: Registrasi akun**
> Sebagai pengguna baru, saya ingin mendaftar dengan email/Google agar bisa mengakses platform.

Acceptance Criteria:
- Form registrasi: nama lengkap, email, password, nomor telepon
- Support sign-up via Google OAuth
- Verifikasi email via OTP sebelum akun aktif
- Redirect ke onboarding setelah registrasi berhasil

**US-02: Login**
> Sebagai pengguna terdaftar, saya ingin login agar bisa mengakses dashboard saya.

Acceptance Criteria:
- Login via email + password atau Google OAuth
- Session persists 7 hari (remember me)
- Error state yang jelas untuk kredensial salah
- Forgot password via email reset link

**US-03: Verifikasi KYC**
> Sebagai pengguna, saya ingin upload KTP agar transaksi saya lebih dipercaya.

Acceptance Criteria:
- Upload foto KTP (JPG/PNG, max 5MB)
- Upload foto selfie memegang KTP
- Status verifikasi: pending / verified / rejected
- Badge "Verified" muncul di profil setelah approved
- Transaksi tetap bisa dilakukan tanpa KYC, tapi dengan batasan (misal max Rp 200.000/transaksi)

**US-04: Dual-role switching**
> Sebagai pengguna, saya ingin bisa berpindah antara mode Penyewa dan Pemilik dari dashboard yang sama.

Acceptance Criteria:
- Toggle switch di navbar/header untuk ganti mode
- Dashboard view berubah sesuai mode aktif
- Tidak perlu logout/login ulang

---

### 3.2 Listing Barang (Pemilik)

**US-05: Upload listing barang**
> Sebagai pemilik, saya ingin mendaftarkan barang saya agar bisa disewa orang lain.

Acceptance Criteria:
- Form: nama barang, kategori (dropdown), deskripsi, kondisi barang (1-10), harga sewa/hari, nilai deposit
- Upload minimum 3 foto, maksimum 10 foto
- Kategori tersedia: Elektronik, Perlengkapan Bayi, Outdoor & Camping, Alat Musik, Rumah Tangga, Lainnya
- Listing berstatus "Draft" sampai dipublish manual oleh pemilik

**US-06: Atur ketersediaan barang**
> Sebagai pemilik, saya ingin memblokir tanggal tertentu agar barang tidak bisa dibooking saat saya tidak mau sewakan.

Acceptance Criteria:
- Calendar interface untuk pilih tanggal blocked
- Barang otomatis tidak muncul di hasil pencarian pada tanggal yang diblokir
- Bisa unblock tanggal yang sudah diblokir

**US-07: Manage listing**
> Sebagai pemilik, saya ingin melihat semua listing saya dan bisa edit atau nonaktifkan.

Acceptance Criteria:
- Daftar semua listing dengan status: aktif / nonaktif / disewa
- Bisa edit semua field kecuali kategori saat barang sedang disewa
- Toggle aktif/nonaktif untuk pause listing sementara
- Soft delete (barang tidak tampil di publik tapi data tersimpan)

---

### 3.3 Pencarian & Discovery (Penyewa)

**US-08: Cari barang**
> Sebagai penyewa, saya ingin mencari barang berdasarkan kata kunci agar cepat menemukan yang saya butuhkan.

Acceptance Criteria:
- Search bar di homepage dan halaman explore
- Hasil muncul real-time saat mengetik (debounced 300ms)
- Pencarian berdasarkan nama barang dan deskripsi

**US-09: Filter & sort hasil pencarian**
> Sebagai penyewa, saya ingin memfilter hasil pencarian agar lebih relevan.

Acceptance Criteria:
- Filter: kategori, rentang harga/hari, lokasi kecamatan/kota, kondisi barang minimum
- Sort: harga terendah, harga tertinggi, rating tertinggi, terbaru
- Filter bisa dikombinasikan
- Jumlah hasil pencarian tampil di atas list

**US-10: Lihat detail barang**
> Sebagai penyewa, saya ingin melihat detail lengkap barang sebelum memutuskan sewa.

Acceptance Criteria:
- Carousel foto barang
- Nama, deskripsi, kondisi, harga/hari, nilai deposit
- Profil singkat pemilik + badge verified + rating pemilik
- Kalender ketersediaan (tanggal yang sudah dibooking/diblokir ditandai)
- Kalkulasi otomatis total harga berdasarkan durasi yang dipilih
- Tombol "Sewa Sekarang" dan "Hubungi Pemilik" (via WhatsApp deeplink)

---

### 3.4 Booking & Transaksi

**US-11: Buat booking**
> Sebagai penyewa, saya ingin melakukan booking barang untuk tanggal yang saya inginkan.

Acceptance Criteria:
- Pilih tanggal mulai dan selesai via date picker (hanya tanggal yang available)
- Pilih metode pengiriman: dikirim (isi alamat) atau ambil sendiri
- Review summary: barang, durasi, harga sewa, deposit, ongkir, total
- Lanjut ke pembayaran

**US-12: Pembayaran**
> Sebagai penyewa, saya ingin membayar secara digital agar transaksi terdokumentasi.

Acceptance Criteria:
- Integrasi Midtrans payment gateway
- Metode: transfer bank (VA), GoPay, OVO, QRIS
- Dana ditahan di escrow platform sampai barang diterima penyewa
- Konfirmasi pembayaran via email + notifikasi in-app
- Booking otomatis batal jika tidak dibayar dalam 2 jam

**US-13: Konfirmasi & serah terima**
> Sebagai pemilik, saya ingin menerima/menolak permintaan booking dan konfirmasi serah terima.

Acceptance Criteria:
- Pemilik dapat notifikasi email + in-app saat ada booking baru
- Batas waktu respon pemilik: 24 jam (otomatis ditolak jika tidak merespon)
- Pemilik konfirmasi "barang sudah dikirim" → status berubah ke "Dalam Perjalanan"
- Penyewa konfirmasi "barang sudah diterima" → dana dilepas dari escrow ke pemilik (dipotong komisi platform)

**US-14: Pengembalian barang**
> Sebagai pemilik, saya ingin mengkonfirmasi barang kembali agar transaksi selesai dengan benar.

Acceptance Criteria:
- Sistem kirim reminder ke penyewa H-2 dan H-1 sebelum batas pengembalian
- Penyewa upload foto kondisi barang sebelum dikembalikan
- Pemilik konfirmasi kondisi barang: baik / ada kerusakan
- Jika baik: deposit dikembalikan ke penyewa, transaksi selesai
- Jika ada kerusakan: pemilik bisa klaim sebagian/seluruh deposit, masuk ke dispute flow

---

### 3.5 Rating & Review

**US-15: Beri rating setelah transaksi**
> Sebagai penyewa/pemilik, saya ingin memberi rating setelah transaksi agar pengguna lain bisa percaya.

Acceptance Criteria:
- Rating muncul setelah transaksi berstatus "Selesai"
- Skala 1-5 bintang + komentar teks (opsional, max 300 karakter)
- Kedua pihak bisa beri rating satu sama lain
- Rating tampil di profil pengguna dan halaman detail listing
- Rating tidak bisa diedit setelah disubmit

---

### 3.6 Dashboard & Riwayat

**US-16: Dashboard penyewa**
> Sebagai penyewa, saya ingin melihat semua aktivitas sewa saya dalam satu tampilan.

Acceptance Criteria:
- Active orders: barang yang sedang disewa + status real-time
- Upcoming: booking yang sudah dibayar, menunggu dikirim
- Riwayat: semua transaksi selesai + tombol "Sewa Lagi"
- Filter riwayat: bulan, tahun, status

**US-17: Dashboard pemilik**
> Sebagai pemilik, saya ingin melihat semua aktivitas lending saya.

Acceptance Criteria:
- Pending requests: booking yang menunggu konfirmasi
- Active rentals: barang yang sedang disewa
- Earnings summary: total pendapatan bulan ini vs bulan lalu
- Riwayat transaksi semua listing

---

## 4. Functional Requirements Summary

| ID | Fitur | Priority | Phase |
|----|-------|----------|-------|
| F-01 | Registrasi & Login (email + Google OAuth) | High | MVP |
| F-02 | Dual-Role Dashboard | High | MVP |
| F-03 | Verifikasi KYC (upload KTP) | High | MVP |
| F-04 | Smart Search & Filter | High | MVP |
| F-05 | Product Detail Page | High | MVP |
| F-06 | Booking Calendar | High | MVP |
| F-07 | Inventory Management (upload listing) | High | MVP |
| F-08 | Order Management (terima/tolak booking) | High | MVP |
| F-09 | Payment Gateway (Midtrans) | High | MVP |
| F-10 | Delivery & Logistics (manual + COD) | Medium | MVP |
| F-11 | Transaction History | Medium | MVP |
| F-12 | Rating & Review | Medium | MVP |
| F-13 | Push/Email Notifications | Medium | MVP |
| F-14 | Dispute Handling (basic) | Medium | MVP |
| F-15 | Availability Blocking | Medium | MVP |
| F-16 | Micro-insurance add-on | Low | Phase 2 |
| F-17 | Featured Listings | Low | Phase 2 |
| F-18 | Promo & Referral Code | Low | Phase 2 |
| F-19 | Admin Dashboard | Low | Phase 2 |

---

## 5. Non-Functional Requirements

### 5.1 Performance
- First Contentful Paint (FCP) < 1.5 detik di jaringan 4G
- Time to Interactive (TTI) < 3 detik
- Halaman listing support pagination (20 item/halaman) atau infinite scroll
- Image listing di-compress dan di-serve via CDN

### 5.2 Security
- Semua API endpoint diproteksi dengan JWT authentication
- File upload KTP hanya accessible oleh user yang bersangkutan + admin
- Payment callback dari Midtrans divalidasi via signature key
- Rate limiting pada endpoint auth (max 5 attempt/menit)
- HTTPS wajib (handled oleh CF Workers/Pages)

### 5.3 Compatibility
- Support browser: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Responsive design: mobile (360px+), tablet (768px+), desktop (1280px+)
- Progressive enhancement: core functionality tetap jalan tanpa JavaScript

### 5.4 Reliability
- Target uptime 99.5% (handled oleh Cloudflare infrastructure)
- Graceful error handling: semua error API tampil pesan user-friendly
- Transaksi payment bersifat idempotent (tidak bisa double-charge)

---

## 6. Tech Stack Recommendation

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **State Management:** Zustand (lightweight, cocok untuk MVP)
- **Form handling:** React Hook Form + Zod validation
- **Date picker:** react-day-picker

### Backend
- **Runtime:** Cloudflare Workers (edge, free tier generous)
- **Framework:** Hono.js (lightweight, CF Workers native)
- **Database:** Cloudflare D1 (SQLite di edge, free tier)
- **File Storage:** Cloudflare R2 (object storage, S3-compatible, free tier 10GB)
- **Auth:** Better Auth atau custom JWT + Cloudflare KV untuk session
- **Email:** Resend (free tier 3000 email/bulan)

### Payment
- **Gateway:** Midtrans Sandbox → Production
- **Escrow logic:** Custom di Workers (hold dana, release setelah konfirmasi)

### Deployment
- **Frontend:** Cloudflare Pages (CI/CD dari GitHub, gratis)
- **Backend:** Cloudflare Workers (gratis 100k request/hari)
- **Domain:** Custom domain via Cloudflare DNS

### Dev Tools
- **Monorepo:** Turborepo (manage frontend + backend dalam satu repo)
- **ORM:** Drizzle ORM (ringan, TypeScript-first, cocok untuk D1)
- **API Client:** tRPC atau REST biasa dengan fetch

---

## 7. Database Schema (High-Level)

```
users
  id, email, name, phone, role, avatar_url, is_verified, created_at

kyc_documents
  id, user_id, ktp_url, selfie_url, status (pending/verified/rejected), reviewed_at

listings
  id, owner_id, title, category, description, condition (1-10),
  price_per_day, deposit_amount, location, status (draft/active/inactive), created_at

listing_photos
  id, listing_id, url, order, is_primary

listing_availability
  id, listing_id, blocked_date

bookings
  id, listing_id, renter_id, lender_id, start_date, end_date,
  total_price, deposit, delivery_method, status, created_at

payments
  id, booking_id, midtrans_order_id, amount, status, paid_at

reviews
  id, booking_id, reviewer_id, reviewee_id, rating (1-5), comment, created_at

disputes
  id, booking_id, raised_by, reason, status, resolved_at
```

---

## 8. Page Structure & Routes

```
/ (Homepage)
  - Hero + search bar
  - Kategori shortcuts
  - Featured listings (terbaru)

/explore
  - Search results + filters

/listing/[id]
  - Detail produk + booking form

/auth/login
/auth/register
/auth/verify

/dashboard
  /dashboard/renter
    /orders (active, upcoming, history)
  /dashboard/lender
    /listings (manage)
    /requests (pending bookings)
    /earnings

/profile/[id] (public profile)
/profile/settings

/booking/[id]
  - Booking summary + payment
  - Status tracking

/kyc
  - Upload KTP flow
```

---

## 9. MVP Milestones

| Sprint | Durasi | Deliverable |
|--------|--------|-------------|
| Sprint 1 | Minggu 1–2 | Setup project, auth (register/login/Google OAuth), profil dasar |
| Sprint 2 | Minggu 3–4 | Listing CRUD, upload foto ke R2, search & filter |
| Sprint 3 | Minggu 5–6 | Booking flow, kalender ketersediaan, Midtrans integration |
| Sprint 4 | Minggu 7–8 | Dashboard renter & lender, order management, konfirmasi serah terima |
| Sprint 5 | Minggu 9–10 | Rating & review, KYC upload, notifikasi email, dispute basic |
| Sprint 6 | Minggu 11–12 | Polish UI, bug fixing, performance, deploy production |

---

## 10. Open Questions

1. Apakah admin dashboard dibutuhkan untuk MVP atau bisa manual dulu?
2. Midtrans production account sudah ada atau masih pakai sandbox untuk demo?
3. Escrow: apakah dana benar-benar ditahan (butuh rekening bisnis) atau simulasi dulu untuk MVP?
4. Verifikasi KYC: manual review oleh admin atau otomatis (pakai third-party API)?
5. Nomor WhatsApp pemilik apakah ditampilkan publik atau hanya setelah booking confirmed?
