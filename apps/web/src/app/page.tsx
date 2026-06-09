"use client";

import { categories, type Listing } from "@rentease/shared";
import {
  Baby,
  Camera,
  ClipboardList,
  Grid3X3,
  Home as HomeIcon,
  Music,
  Search,
  Tent,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ListingCard, ListingCardSkeleton } from "../components/listing-card";
import { apiRequest } from "../lib/api";

type ListingsResponse = {
  listings: Listing[];
  total: number;
  page: number;
};

const categoryIcons = {
  electronics: Camera,
  "baby-gear": Baby,
  "outdoor-camping": Tent,
  music: Music,
  household: HomeIcon,
  other: Grid3X3,
};

export default function HomePage() {
  const router = useRouter();
  const [navSearch, setNavSearch] = useState("");
  const [heroSearch, setHeroSearch] = useState("");
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadListings() {
      setIsLoading(true);
      const response = await apiRequest<ListingsResponse>("/listings?limit=4");

      if (response.success) {
        setListings(response.data.listings);
      }

      setIsLoading(false);
    }

    void loadListings();
  }, []);

  function submitSearch(event: FormEvent<HTMLFormElement>, value: string) {
    event.preventDefault();
    const params = new URLSearchParams();

    if (value.trim()) {
      params.set("q", value.trim());
    }

    router.push(params.toString() ? `/explore?${params.toString()}` : "/explore");
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg-subtle)] pb-20 md:pb-0">
      <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link className="text-xl font-bold text-primary" href="/">
            RentEase
          </Link>
          <form
            className="mx-auto hidden w-full max-w-xl items-center gap-2 rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 transition-shadow focus-within:shadow-md md:flex"
            onSubmit={(event) => submitSearch(event, navSearch)}
          >
            <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <input
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              placeholder="Cari kamera, stroller, alat camping..."
              type="search"
              value={navSearch}
              onChange={(event) => setNavSearch(event.target.value)}
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
          <form
            className="mx-auto mt-8 flex max-w-3xl flex-col gap-3 rounded-lg border border-[var(--color-border)] bg-slate-50 p-2 sm:flex-row"
            onSubmit={(event) => submitSearch(event, heroSearch)}
          >
            <label className="flex flex-1 items-center gap-3 rounded-md bg-white px-4 py-3 text-slate-500">
              <Search className="h-5 w-5" aria-hidden="true" />
              <input
                className="w-full bg-transparent text-base outline-none placeholder:text-slate-400"
                placeholder="Mau sewa apa hari ini?"
                type="search"
                value={heroSearch}
                onChange={(event) => setHeroSearch(event.target.value)}
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
                href={`/explore?category=${category.value}`}
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
          <Link className="hidden text-sm font-semibold text-primary md:block" href="/explore">
            Lihat semua
          </Link>
        </div>
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <ListingCardSkeleton className="w-[78vw] shrink-0 snap-start sm:w-auto" key={index} />
              ))
            : listings.map((listing) => (
                <ListingCard
                  className="w-[78vw] shrink-0 snap-start sm:w-auto"
                  listing={listing}
                  key={listing.id}
                />
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
            { label: "Jelajahi", href: "/explore", icon: Search, active: false },
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
