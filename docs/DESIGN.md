# DESIGN.md — RentEase Design System

> **How to use this file:** Paste the relevant section into your AI agent prompt before generating any UI. The more specific the section, the less the AI needs to guess.

---

## 1. Brand Identity

**Vibe:** Trustworthy marketplace, not a startup gimmick. Think Airbnb meets Tokopedia — clean, spacious, confident. Every design decision should answer: *"does this look like a platform I'd trust with my stroller?"*

**Core tension to resolve:** P2P lending = inherent anxiety (will the borrower return my camera?). The UI's job is to reduce that anxiety through clarity, not decoration. No dark patterns, no confusion about what a button does, no status ambiguity.

**Personality words:** Reliable. Approachable. Modern Indonesian. Clear.

---

## 2. Color Palette

### Primary Tokens (define in `tailwind.config.ts` + `globals.css`)

```css
:root {
  /* Primary — Action & Trust */
  --color-primary:        #2563EB; /* Blue 600 — CTAs, active states, links */
  --color-primary-hover:  #1D4ED8; /* Blue 700 — hover state */
  --color-primary-light:  #DBEAFE; /* Blue 100 — badge backgrounds, highlights */
  --color-primary-text:   #1E40AF; /* Blue 800 — text on primary-light bg */

  /* Success — Verified & Completed */
  --color-success:        #16A34A; /* Green 600 — KYC badge, "Selesai" status */
  --color-success-light:  #DCFCE7; /* Green 100 */
  --color-success-text:   #166534; /* Green 800 — text on success-light */

  /* Warning — Pending & Active */
  --color-warning:        #D97706; /* Amber 600 — "Pending", "Menunggu" */
  --color-warning-light:  #FEF3C7; /* Amber 100 */
  --color-warning-text:   #92400E; /* Amber 800 */

  /* Danger — Destructive & Error */
  --color-danger:         #DC2626; /* Red 600 — delete, dispute, error */
  --color-danger-light:   #FEE2E2; /* Red 100 */
  --color-danger-text:    #991B1B; /* Red 800 */

  /* Neutral */
  --color-bg:             #FFFFFF;
  --color-bg-subtle:      #F8FAFC; /* Slate 50 — page background */
  --color-bg-muted:       #F1F5F9; /* Slate 100 — secondary buttons, cards */
  --color-text-primary:   #0F172A; /* Slate 900 */
  --color-text-secondary: #475569; /* Slate 600 */
  --color-text-muted:     #94A3B8; /* Slate 400 — placeholders, captions */
  --color-border:         #E2E8F0; /* Slate 200 — default border */
  --color-border-strong:  #CBD5E1; /* Slate 300 — hover/focus border */
}
```

### Status → Color Mapping (use this consistently everywhere)

| Status | Badge bg | Badge text | Dot color |
|--------|----------|------------|-----------|
| Draft | `bg-slate-100` | `text-slate-600` | — |
| Menunggu Konfirmasi | `bg-amber-100` | `text-amber-800` | `bg-amber-500` |
| Dikonfirmasi | `bg-blue-100` | `text-blue-800` | `bg-blue-500` |
| Dalam Perjalanan | `bg-blue-100` | `text-blue-800` | `bg-blue-500` (pulse) |
| Sedang Disewa | `bg-violet-100` | `text-violet-800` | `bg-violet-500` |
| Selesai | `bg-green-100` | `text-green-800` | — |
| Dibatalkan | `bg-slate-100` | `text-slate-500` | — |
| Dispute | `bg-red-100` | `text-red-800` | `bg-red-500` |
| KYC: Pending | `bg-amber-100` | `text-amber-800` | — |
| KYC: Verified | `bg-green-100` | `text-green-800` | — |
| KYC: Rejected | `bg-red-100` | `text-red-800` | — |

---

## 3. Typography

**Font:** `Plus Jakarta Sans` — import via `next/font/google`. Fallback: `Inter`, then `system-ui`.

```ts
// app/layout.tsx
import { Plus_Jakarta_Sans } from 'next/font/google'
const font = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
})
```

### Type Scale

```
Display (hero only): text-4xl / font-bold / tracking-tight / leading-tight
H1 (page title):     text-3xl / font-bold / tracking-tight
H2 (section title):  text-xl  / font-semibold
H3 (card title):     text-base / font-semibold
Body:                text-base / font-normal / leading-relaxed
Body small:          text-sm  / font-normal
Caption / Label:     text-xs  / font-medium / tracking-wide / uppercase (labels only)
Price:               text-lg  / font-bold / text-primary (always blue)
```

### Text Rules
- **Harga** selalu pakai `font-bold text-primary` (biru) — ini anchor visual di setiap listing card
- **Nama barang** di card: `line-clamp-2` — jangan biarkan overflow
- **Empty state copy:** action-oriented, bukan "Tidak ada data" → pakai "Belum ada listing. Mulai sewakan barangmu →"
- **Error messages:** spesifik, bukan generic — "Email sudah terdaftar" bukan "Terjadi kesalahan"
- Semua label form: `text-sm font-medium text-slate-700`, bukan warna primary

---

## 4. Spacing & Layout

### Container

```html
<div class="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
```

### Page-level spacing
- Section gap: `py-12` (mobile) / `py-16` (desktop)
- Card grid gap: `gap-4` (mobile) / `gap-6` (desktop)
- Form field gap: `space-y-4`
- Label → Input gap: `mt-1.5`

### Grid Patterns

```
Listing cards (explore page): grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
Dashboard stats:              grid-cols-2 lg:grid-cols-4
Feature highlights:           grid-cols-1 md:grid-cols-3
```

---

## 5. Component Specifications

### 5.1 Listing Card

```
┌─────────────────────────┐
│  [IMAGE 1:1 ratio]      │  ← aspect-square object-cover, rounded-xl
│  [Badge: kategori]      │  ← absolute top-3 left-3
├─────────────────────────┤
│  Nama Barang (2 baris)  │  ← text-sm font-semibold line-clamp-2
│  ★ 4.8 · (23 ulasan)   │  ← text-xs text-muted-foreground
│  [Avatar] Nama Pemilik  │  ← text-xs + BadgeCheck jika verified
│  Rp 150.000 / hari      │  ← text-primary font-bold
└─────────────────────────┘
```

Rules:
- Selalu tampilkan: gambar, nama, harga/hari, rating
- Jika rating = 0 atau belum ada: tampilkan "Baru" badge, bukan "★ 0"
- Hover state: `hover:shadow-md transition-shadow duration-200` — subtle, bukan dramatic
- Seluruh card adalah satu `<Link>` — tidak ada tombol terpisah di dalam card

### 5.2 Status Badge

```tsx
// Gunakan pola ini — jangan buat badge baru dari scratch
<Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
  Selesai
</Badge>
```

Rules:
- Selalu `variant="outline"` — jangan solid (terlalu berat secara visual)
- Ukuran: default (text-xs) untuk semua kasus. Jangan perbesar.
- Ikon opsional di depan (Lucide, 12px): `<CheckCircle2 className="w-3 h-3 mr-1" />`

### 5.3 Verified Badge (KYC)

```tsx
// Di sebelah nama user — WAJIB konsisten di semua halaman
{user.isVerified && (
  <BadgeCheck className="w-4 h-4 text-green-500 inline-block ml-1" />
)}
```

Rules:
- Jangan teks "Verified" — icon saja sudah cukup, hover tooltip bisa ditambahkan
- Selalu `text-green-500`, tidak pernah warna lain
- Ukuran: `w-4 h-4` inline dengan teks nama, jangan lebih besar

### 5.4 Form Fields

```tsx
// Struktur standar semua form field
<div className="space-y-1.5">
  <Label htmlFor="field-id">Nama Barang</Label>
  <Input
    id="field-id"
    placeholder="contoh: Kamera Canon EOS M50"
    className={cn(errors.title && "border-red-500 focus-visible:ring-red-500")}
  />
  {errors.title && (
    <p className="text-xs text-red-600">{errors.title.message}</p>
  )}
</div>
```

Rules:
- Label selalu di atas input — jangan placeholder-only (accessibility)
- Error state: `border-red-500` + error message di bawah (bukan toast)
- Required fields: tambahkan `*` merah setelah label, bukan teks "(wajib)"
- Disabled state: `opacity-60 cursor-not-allowed` — jangan sembunyikan

### 5.5 Empty States

```
     [Ilustrasi / Lucide icon besar, text-slate-300, w-16 h-16]
     
     Belum ada listing aktif
     [text-slate-500, text-sm]
     
     [Button: "Buat Listing Baru →"]
```

Rules:
- Setiap halaman yang bisa kosong WAJIB punya empty state
- Gambar/icon: `text-slate-300` (bukan abu tua — terlalu berat)
- Headline: 1 kalimat, spesifik ke konteks halaman itu
- CTA: selalu ada, mengarahkan user ke action berikutnya

### 5.6 Loading States

Gunakan **Skeleton** dari shadcn/ui — bukan spinner untuk content blocks.
- Listing card: skeleton dengan proporsi sama persis dengan card asli
- Dashboard stats: skeleton rectangular `h-20 rounded-lg`
- Halaman detail: skeleton untuk semua section secara bersamaan (bukan loading per-section)

Spinner (`Loader2 animate-spin`) hanya untuk:
- Submit button saat form sedang dikirim
- Inline action (konfirmasi booking, upload foto)

### 5.7 Navigation

**Desktop (sticky top navbar):**
```
[Logo RentEase]   [Search Bar (flex-1, max-w-xl)]   [Jadi Pemilik | Masuk | Daftar]
```
- Sticky: `sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b`
- Search bar aktif: expand sedikit dengan shadow

**Mobile (bottom navigation):**
```
[🏠 Beranda] [🔍 Jelajahi] [📋 Pesanan] [👤 Profil]
```
- `fixed bottom-0 left-0 right-0 bg-white border-t z-50`
- Active tab: `text-primary` + `bg-primary-light` pill indicator di atas icon
- Safe area: tambahkan `pb-safe` untuk notch handling

### 5.8 Page Headers

```tsx
// Pattern standar untuk semua halaman dashboard
<div className="mb-8">
  <h1 className="text-2xl font-bold text-slate-900">Listing Saya</h1>
  <p className="text-slate-500 mt-1">Kelola semua barang yang kamu sewakan</p>
</div>
```

---

## 6. Shadcn UI Component Allowlist

Hanya gunakan komponen berikut. Jangan install UI library tambahan.

| Komponen | Digunakan untuk |
|----------|-----------------|
| `Button` | Semua tombol. Variant: `default`, `secondary`, `outline`, `ghost`, `destructive` |
| `Card` | Listing card, stat card, booking summary |
| `Input`, `Textarea`, `Label` | Semua form field |
| `Select` | Dropdown kategori, filter sort |
| `Dialog` | Konfirmasi aksi penting, modal upload KTP |
| `Badge` | Status transaksi, KYC status, kategori barang |
| `Calendar` + `Popover` | Date picker booking — selalu kombinasi ini |
| `Tabs` | Switch Penyewa/Pemilik di dashboard |
| `Avatar` | Foto profil user |
| `Skeleton` | Loading state semua content block |
| `Toast` (Sonner) | Feedback aksi sukses/gagal — bukan alert |
| `Separator` | Divider halaman detail |
| `Breadcrumb` | Navigasi halaman detail listing |

**Jangan pakai:** AlertDialog untuk konfirmasi ringan (pakai Dialog biasa), Sheet untuk form panjang (pakai halaman baru).

---

## 7. Page-Specific Rules

### Homepage (`/`)
- Hero: Search bar sebagai focal point utama — bukan banner promo besar
- Hero copy: "Sewa apa saja, dari siapa saja." — jangan ubah ini kecuali ada alasan kuat
- Di bawah hero: 6 kategori shortcut sebagai icon grid
- Listing section: "Baru Ditambahkan" — 8 card, pakai horizontal scroll di mobile (bukan grid 2-col)
- Tidak ada carousel/slider otomatis — terlalu banyak motion tanpa trigger user

### Explore Page (`/explore`)
- Filter panel: sticky di desktop (sidebar kiri), bottom sheet di mobile
- "X hasil ditemukan" selalu tampil di atas grid, update real-time
- Tidak ada pagination angka — pakai "Muat lebih banyak" button di bawah (lebih natural untuk browsing)
- Sort default: "Terbaru" bukan "Terpopuler" (karena MVP belum ada enough data)

### Listing Detail (`/listing/[id]`)
- Layout: 2 kolom di desktop — foto (kiri, 60%) + booking form (kanan, 40%, sticky)
- Foto: carousel dengan thumbnail strip di bawah
- Booking form sticky: `sticky top-24` (di bawah navbar)
- "Sewa Sekarang" button: full-width, `text-lg`, selalu visible
- "Hubungi Pemilik" (WhatsApp): `variant="outline"` di bawah CTA utama — jangan sama menonjolnya

### Auth Pages (`/auth/*`)
- Layout: centered card, max-w-md, dengan logo di atas
- Jangan full-screen split layout — terlalu complex untuk MVP
- Google OAuth button: selalu di ATAS form email/password (bukan di bawah)
- "Atau daftar dengan email" separator setelah Google button

### Dashboard
- Gunakan `Tabs` untuk switch Penyewa ↔ Pemilik
- Stat cards di atas: 2-col grid di mobile, 4-col di desktop
- Tabel transaksi: mobile-friendly dengan card-per-row, bukan tabel horizontal scroll

---

## 8. Motion & Interaction

**Prinsip:** Motion harus ada alasan — bukan dekorasi.

| Interaction | Animasi |
|-------------|---------|
| Page transition | Tidak ada — Next.js default, jangan tambahkan |
| Hover card | `hover:shadow-md transition-shadow duration-150` |
| Button press | `active:scale-95 transition-transform duration-75` |
| Toast masuk | Slide up dari bawah (Sonner default) |
| Modal/Dialog | Fade + scale (shadcn default) |
| Skeleton → Content | Fade in `animate-in fade-in duration-300` |
| Tab switch | shadcn Tabs default (instant, jangan animasi) |

**Jangan tambahkan:** scroll-triggered reveal, stagger animations, parallax, auto-playing carousels.

---

## 9. Iconography

Gunakan **Lucide React** — sudah bundled dengan shadcn/ui.

| Context | Icon |
|---------|------|
| KYC Verified | `BadgeCheck` (green) |
| Rating bintang | `Star` (filled: `fill-amber-400 text-amber-400`) |
| Lokasi | `MapPin` |
| Kalender | `Calendar` |
| Harga/uang | `Banknote` |
| Kategori Elektronik | `Camera` |
| Kategori Bayi | `Baby` |
| Kategori Outdoor | `Tent` |
| Kategori Musik | `Music` |
| Kategori Rumah | `Home` |
| Status "dikirim" | `Truck` |
| Status "selesai" | `CheckCircle2` |
| Status "dispute" | `AlertTriangle` |
| Upload foto | `ImagePlus` |
| Edit listing | `Pencil` |
| Hapus | `Trash2` |

Rules:
- Ukuran default: `w-4 h-4` inline dengan teks, `w-5 h-5` untuk navigasi, `w-8 h-8` untuk empty state
- Jangan mix Lucide dengan icon library lain
- Icon-only button: wajib punya `aria-label`

---

## 10. Do's & Don'ts

### ✅ Do
- Gunakan whitespace lega — padding minimum `p-6` untuk card content
- Konsisten: satu pola untuk satu hal (satu cara tulis harga, satu pola badge)
- Mobile-first: design untuk 360px dulu, baru expand
- Teks CTA aktif: "Sewa Sekarang", "Buat Listing", "Konfirmasi" — bukan "Submit" atau "OK"
- Tampilkan loading state untuk setiap async action

### ❌ Don't
- Jangan pakai lebih dari 2 warna CTA di satu halaman (primary + secondary, titik)
- Jangan sembunyikan informasi penting di balik hover/tooltip — mobile tidak punya hover
- Jangan gunakan tabel horizontal scroll untuk data utama — convert ke card list
- Jangan animasi yang tidak di-trigger user (auto-play, loop)
- Jangan placeholder teks sebagai pengganti label — keduanya wajib ada
- Jangan `text-xs` untuk informasi penting (error, harga, status)

