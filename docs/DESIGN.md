# DESIGN.md - RentEase Design System

> PRD dan business model tetap menjadi source of truth untuk behavior produk. File ini mendefinisikan bahasa visual dan interaction untuk UI RentEase.

---

## 1. Brand Identity

**Visual direction:** Clean Marketplace Trust.

RentEase harus terasa seperti marketplace rental P2P yang nyata, padat, profesional, dan mudah dipercaya. Foto barang menjadi visual utama. Teal/mint tetap menjadi warna brand, tetapi dipakai secara terkendali untuk CTA, active state, dan indikator trust, bukan sebagai background besar.

**Core tension:** P2P rental membuat user bertanya: pemiliknya asli? barangnya sesuai? deposit aman? status booking jelas? Desain harus menjawab itu lewat navigasi yang mudah, status eksplisit, foto barang yang nyata, dan CTA yang tidak ambigu.

**Personality words:** Trusted. Practical. Direct. Clear. Modern Indonesian. Marketplace-ready.

**Do not drift into:** glassmorphism, heavy neumorphism, low-contrast pastel UI, decorative blobs/orbs, toy app, gradient-heavy sections, overly rounded cards, atau vague transaction status.

---

## 2. Color Palette

### Primary Tokens

```css
:root {
  --color-primary:        #0F766E;
  --color-primary-hover:  #115E59;
  --color-primary-light:  #CCFBF1;
  --color-primary-soft:   #F0FDFA;
  --color-primary-text:   #134E4A;

  --color-success:        #16A34A;
  --color-success-light:  #DCFCE7;
  --color-success-text:   #166534;

  --color-warning:        #D97706;
  --color-warning-light:  #FEF3C7;
  --color-warning-text:   #92400E;

  --color-danger:         #DC2626;
  --color-danger-light:   #FEE2E2;
  --color-danger-text:    #991B1B;

  --color-bg:             #F8FAFC;
  --color-bg-subtle:      #F8FAFC;
  --color-bg-muted:       #F1F5F9;
  --color-surface:        #FFFFFF;
  --color-surface-raised: #FFFFFF;
  --color-surface-sunken: #F1F5F9;

  --color-text-primary:   #10231F;
  --color-text-secondary: #475569;
  --color-text-muted:     #64748B;
  --color-border:         #E2E8F0;
  --color-border-strong:  #CBD5E1;

  --shadow-soft:          0 10px 24px rgba(15, 23, 42, 0.08);
  --shadow-soft-sm:       0 2px 8px rgba(15, 23, 42, 0.06);
  --shadow-soft-hover:    0 12px 28px rgba(15, 23, 42, 0.12);
  --shadow-inset:         inset 0 1px 2px rgba(15, 23, 42, 0.06);
}
```

### Color Rules

- Primary CTA uses deep teal with white text.
- Mint is for small highlights, active nav, and trust accents, not full-page decoration.
- Warning, danger, and success keep amber/red/green semantics for verifikasi identitas, deposit, dispute, and booking status.
- Use listing photos as the main visual anchor so pages feel like a real marketplace.
- Do not put category badges or large pills on top of listing photos.
- Price always uses `font-bold text-primary`.

### Status Color Mapping

| Status | Badge bg | Badge text | Dot color |
|--------|----------|------------|-----------|
| Draft | `bg-slate-100` | `text-slate-600` | - |
| Menunggu Konfirmasi | `bg-amber-100` | `text-amber-800` | `bg-amber-500` |
| Dikonfirmasi | `bg-teal-100` | `text-teal-800` | `bg-teal-500` |
| Siap Diambil | `bg-teal-100` | `text-teal-800` | `bg-teal-500` |
| Sedang Disewa | `bg-cyan-100` | `text-cyan-800` | `bg-cyan-500` |
| Menunggu Pengembalian | `bg-amber-100` | `text-amber-800` | `bg-amber-500` |
| Selesai | `bg-green-100` | `text-green-800` | - |
| Deposit Ditahan | `bg-amber-100` | `text-amber-800` | `bg-amber-500` |
| Klaim Deposit | `bg-red-100` | `text-red-800` | `bg-red-500` |
| Deposit Dikembalikan | `bg-green-100` | `text-green-800` | - |
| Dibatalkan | `bg-slate-100` | `text-slate-500` | - |
| Dispute | `bg-red-100` | `text-red-800` | `bg-red-500` |
| Verifikasi Identitas: Pending | `bg-amber-100` | `text-amber-800` | - |
| Verifikasi Identitas: Verified | `bg-green-100` | `text-green-800` | - |
| Verifikasi Identitas: Rejected | `bg-red-100` | `text-red-800` | - |

---

## 3. Typography

**Font:** `Plus Jakarta Sans` via `next/font/google`. Fallback: `Inter`, then `system-ui`.

```
Display:     text-4xl / font-bold / leading-tight
H1:          text-3xl / font-bold
H2:          text-xl / font-semibold
H3:          text-base / font-semibold
Body:        text-base / leading-relaxed
Body small:  text-sm
Caption:     text-xs / font-medium
Price:       text-lg / font-bold / text-primary
```

Rules:

- Do not scale font size with viewport width.
- Listing names use `line-clamp-2`.
- Important status, price, error, and deposit text must stay readable.
- Empty state copy should explain the condition and next action.

---

## 4. Shape, Depth, And Layout

### Radius

- Cards, listing images, buttons, inputs, selects, and filter controls: `rounded-md` to `rounded-lg`.
- Major panels and auth cards may use `rounded-xl` only when the layout needs a larger frame.
- Badges, tiny status chips, and avatars may use `rounded-full`.
- Avoid `rounded-2xl`, `rounded-3xl`, oversized pill cards, and soft blob-like surfaces; they make the product feel like an AI mockup rather than a marketplace.

### Depth

- Use solid surfaces with subtle shadows. Do not use glass blur.
- Header is always solid `bg-surface` with border and small shadow.
- `shadow-soft` is for major panels only.
- `shadow-soft-sm` is for cards, nav, buttons, and compact controls.
- `shadow-inset-soft` is allowed for inputs and search fields only.
- Do not stack shadows to create plastic/neumorphic depth.

### Layout

- Container: `container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8`
- Navbar always uses the same `max-w-7xl` container. Page content may be narrower only inside the content area, not by changing navbar width.
- Back links and breadcrumbs live in the page header area, never inside the global navbar.
- Use shared layout primitives for marketplace pages: `SiteHeader`, `PageShell`, `PageContainer`, `PageHeader`, and `BackLink`.
- Homepage should show search, compact categories, and first listing section quickly above the fold.
- Card grid gap: `gap-4` mobile, `gap-6` desktop where space allows.
- Fixed-format UI must keep stable dimensions and avoid layout shift.

---

## 5. Components

### Navigation

Desktop guest:
```
[RentEase] [Search optional] [Beranda] [Jelajahi] [Masuk] [Daftar]
```

Desktop logged-in:
```
[RentEase] [Search optional] [Beranda] [Jelajahi] [Aktivitas] [Pesan] [Avatar/name] [Keluar]
```

Rules:

- Header reads auth state from `rentease_token` and `/auth/me`.
- Invalid/expired token returns the nav to guest state.
- Header must not be translucent, blurred, or page-specific in width.
- Header does not accept page-specific back-link slots; use page headers for back navigation.
- Mobile bottom nav remains: Beranda, Jelajahi, Aktivitas, Pesan, Profil.
- Avatar/name is the single desktop entry to profile settings and identity verification. Avoid separate Profil and avatar links in the same header.

### Listing Card

- Always show image, name, price/day, and rating or `Baru`.
- Entire card is a single `<Link>`.
- Image is `aspect-square object-cover` and must stay visually clean.
- Category must not overlay the photo. It may appear as small metadata under the image or be omitted when browsing context is clear.
- Price appears directly under the title and is more prominent than owner metadata.
- Owner/verifikasi appears as compact metadata, not a large block.
- Rating star remains amber.
- Verified identity badge uses Lucide `BadgeCheck`, `w-4 h-4`, `text-green-500`, no text.

### Forms

- Label always above input.
- Placeholder does not replace label.
- Inline error appears below the field.
- Required fields use a red `*`.
- Disabled state uses `opacity-60 cursor-not-allowed`.

### Empty And Loading States

- Empty state uses a solid surface panel with a Lucide icon and clear CTA.
- Loading content blocks use skeletons that match final proportions.
- Spinner is only for submit buttons and inline actions.

---

## 6. Page Rules

### Homepage

- Search-first, not a marketing landing page.
- Hero copy remains: "Sewa apa saja, dari siapa saja."
- Categories sit close to search as compact chips/nav, not large card blocks.
- "Baru Ditambahkan" should be visible quickly and use real listing photos.

### Explore

- Desktop filter panel is solid, sticky, and rounded.
- Mobile filter opens as bottom sheet.
- Search and filters update URL params.
- "X barang ditemukan" stays visible above grid.

### Listing Detail

- Photo gallery is the primary visual anchor.
- Category lives in metadata, never as a badge over the photo.
- Listing detail may follow a grounded Carousell-like marketplace structure: large gallery, title/price/details, owner trust panel, booking CTA, description, availability, and similar listings.
- Booking panel is sticky on desktop, flat, and practical.
- WhatsApp remains locked until booking accepted and payment succeeds.
- Deposit, owner trust, and status copy must be explicit.

### Aktivitas

- User-facing copy should say `Aktivitas`, not `Dashboard`. The internal `/dashboard` route may remain.
- Aktivitas uses one shell for renter and lender modes with a segmented `Penyewa` / `Pemilik` control.
- Stat cards are compact, solid-surface, and API-ready; avoid decorative analytics cards.
- Empty states must explain the missing workflow and provide a concrete next action.
- Child activity pages may be thin until their workflow is implemented, but they must not 404 or show scaffold terms like `placeholder`, `step berikutnya`, or `mock`.
- Lender listing management should use practical list rows/cards with status badges, visible price/deposit, real photos, and direct publish/unpublish actions.
- Create item forms must use a multi-photo uploader, not a visible URL field. Forms save as draf first and explain when an item becomes visible in Jelajahi.

### Auth, Profile, And Verifikasi Identitas

- Auth pages stay centered and focused.
- After login/register, redirect to homepage and let the header show account access.
- Profile and verifikasi identitas pages use the same site header as marketplace pages.
- User-facing copy should say "Verifikasi Identitas"; internal code may keep `kycStatus` and `/kyc`.
- Identity verification upload is demo-only until R2/admin review exists.

---

## 7. Motion And Iconography

- Use Lucide React only.
- Button press may use `active:scale-95`.
- Card hover may deepen shadow slightly.
- No autoplay carousel, parallax, scroll reveal, decorative blobs, gradient orbs, or glass effects.
- Icon sizes: inline `w-4 h-4`, nav `w-5 h-5`, empty state `w-10 h-10` to `w-16 h-16`.

