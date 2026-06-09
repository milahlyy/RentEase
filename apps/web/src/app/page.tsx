import { categories } from "@rentease/shared";
import {
  Baby,
  BadgeCheck,
  Camera,
  ClipboardList,
  Grid3X3,
  Home as HomeIcon,
  MapPin,
  Music,
  Search,
  Star,
  Tent,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const categoryIcons = {
  electronics: Camera,
  "baby-gear": Baby,
  "outdoor-camping": Tent,
  music: Music,
  household: HomeIcon,
  other: Grid3X3,
};

const listings = [
  {
    id: "canon-eos-80d",
    title: "Canon EOS 80D dengan lensa kit 18-135mm",
    category: "Elektronik",
    owner: "Andi Pratama",
    verified: true,
    location: "Jakarta Selatan",
    rating: 4.8,
    reviews: 23,
    price: "Rp 150.000 / hari",
    image:
      "https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "stroller-cabin",
    title: "Stroller cabin premium ringan untuk traveling",
    category: "Perlengkapan Bayi",
    owner: "Siti Rahma",
    verified: true,
    location: "Tangerang",
    rating: 4.9,
    reviews: 31,
    price: "Rp 85.000 / hari",
    image:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "tenda-camping",
    title: "Tenda camping 4 orang waterproof",
    category: "Outdoor",
    owner: "Rendy Saputra",
    verified: false,
    location: "Depok",
    rating: 4.7,
    reviews: 14,
    price: "Rp 60.000 / hari",
    image:
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "keyboard-midi",
    title: "Keyboard MIDI 61 keys untuk produksi musik",
    category: "Alat Musik",
    owner: "Alya Putri",
    verified: true,
    location: "Bekasi",
    rating: 0,
    reviews: 0,
    price: "Rp 75.000 / hari",
    image:
      "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=900&q=80",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--color-bg-subtle)] pb-20 md:pb-0">
      <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link className="text-xl font-bold text-primary" href="/">
            RentEase
          </Link>
          <form className="mx-auto hidden w-full max-w-xl items-center gap-2 rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 transition-shadow focus-within:shadow-md md:flex">
            <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <input
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              placeholder="Cari kamera, stroller, alat camping..."
              type="search"
            />
          </form>
          <nav className="ml-auto hidden items-center gap-2 md:flex">
            <Link
              className="rounded-md px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
              href="/auth/login"
            >
              Masuk
            </Link>
            <Link
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover active:scale-95"
              href="/auth/register"
            >
              Daftar
            </Link>
          </nav>
        </div>
      </header>

      <section className="bg-white py-12 md:py-16">
        <div className="container mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-medium uppercase text-primary">Marketplace rental P2P</p>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-bold leading-tight text-slate-900">
            Sewa apa saja, dari siapa saja.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
            Temukan barang fase pendek dan aset hobi dari pemilik tepercaya di sekitarmu.
          </p>
          <form className="mx-auto mt-8 flex max-w-3xl flex-col gap-3 rounded-lg border border-[var(--color-border)] bg-slate-50 p-2 sm:flex-row">
            <label className="flex flex-1 items-center gap-3 rounded-md bg-white px-4 py-3 text-slate-500">
              <Search className="h-5 w-5" aria-hidden="true" />
              <input
                className="w-full bg-transparent text-base outline-none placeholder:text-slate-400"
                placeholder="Mau sewa apa hari ini?"
                type="search"
              />
            </label>
            <button
              className="rounded-md bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-hover active:scale-95"
              type="submit"
            >
              Cari Barang
            </button>
          </form>
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => {
            const Icon = categoryIcons[category.value];

            return (
              <Link
                className="rounded-lg border border-[var(--color-border)] bg-white p-4 text-center transition-shadow duration-150 hover:shadow-md"
                href="/"
                key={category.value}
              >
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary-light text-primary-text">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="mt-3 block text-sm font-semibold text-slate-800">
                  {category.label}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Baru Ditambahkan</h2>
            <p className="mt-1 text-sm text-slate-500">
              Barang terbaru yang siap disewa di sekitar Jabodetabek.
            </p>
          </div>
        </div>
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {listings.map((listing) => (
            <Link
              className="w-[78vw] shrink-0 snap-start rounded-lg border border-[var(--color-border)] bg-white p-3 transition-shadow duration-150 hover:shadow-md sm:w-auto"
              href="/"
              key={listing.id}
            >
              <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
                <Image
                  alt={listing.title}
                  className="h-full w-full object-cover"
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 78vw"
                  src={listing.image}
                />
                <span className="absolute left-3 top-3 rounded-md border border-blue-200 bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                  {listing.category}
                </span>
              </div>
              <div className="p-3">
                <h3 className="line-clamp-2 text-sm font-semibold leading-6 text-slate-900">
                  {listing.title}
                </h3>
                <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                  {listing.rating > 0 ? (
                    <>
                      <Star
                        className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                        aria-hidden="true"
                      />
                      <span>
                        {listing.rating} · ({listing.reviews} ulasan)
                      </span>
                    </>
                  ) : (
                    <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      Baru
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-600">
                    {listing.owner.charAt(0)}
                  </span>
                  <span className="truncate">
                    {listing.owner}
                    {listing.verified && (
                      <BadgeCheck
                        className="ml-1 inline-block h-4 w-4 text-green-500"
                        aria-label="Terverifikasi"
                      />
                    )}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{listing.location}</span>
                </div>
                <p className="mt-4 text-lg font-bold text-primary">{listing.price}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-[var(--color-border)] bg-white py-6">
        <div className="container mx-auto max-w-7xl px-4 text-sm text-slate-500 sm:px-6 lg:px-8">
          RentEase © 2026
        </div>
      </footer>

      <nav className="pb-safe fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border)] bg-white md:hidden">
        <div className="grid grid-cols-4 px-2 py-2">
          {[
            { label: "Beranda", href: "/", icon: HomeIcon, active: true },
            { label: "Jelajahi", href: "/", icon: Search, active: false },
            { label: "Pesanan", href: "/", icon: ClipboardList, active: false },
            { label: "Profil", href: "/auth/login", icon: User, active: false },
          ].map((item) => (
            <Link
              className={`flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium ${
                item.active ? "bg-primary-light text-primary" : "text-slate-500"
              }`}
              href={item.href}
              key={item.label}
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </main>
  );
}
