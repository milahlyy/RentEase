"use client";

import { categories, type Listing } from "@rentease/shared";
import {
  Baby,
  Camera,
  Grid3X3,
  Home as HomeIcon,
  Music,
  Search,
  Tent,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ListingCard, ListingCardSkeleton } from "../components/listing-card";
import { PageContainer } from "../components/page-layout";
import { MobileBottomNav, SiteHeader } from "../components/site-header";
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
      <SiteHeader />


      <section className="py-7 md:py-8">
        <PageContainer className="text-center">
          <h1 className="mx-auto max-w-3xl text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
            Sewa apa saja, dari siapa saja.
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
            Temukan barang dari pemilik tepercaya di sekitarmu.
          </p>
          <form
            className="mx-auto mt-6 flex max-w-3xl flex-col gap-3 rounded-lg border border-[var(--color-border)] bg-surface p-3 shadow-soft-sm sm:flex-row"
            onSubmit={(event) => submitSearch(event, heroSearch)}
          >
            <label className="flex flex-1 items-center gap-3 rounded-md border border-[var(--color-border)] bg-surface px-4 py-3 text-slate-500 shadow-inset-soft">
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
              className="rounded-md bg-primary px-6 py-3 font-semibold text-white shadow-soft-sm transition-colors hover:bg-primary-hover active:scale-95"
              type="submit"
            >
              Cari Barang
            </button>
          </form>
        </PageContainer>
      </section>

      <PageContainer className="pb-4">
        <div className="-mx-4 flex gap-2 overflow-x-auto border-y border-[var(--color-border)] bg-surface px-4 py-3 sm:mx-auto sm:w-fit sm:max-w-full sm:flex-wrap sm:justify-center sm:overflow-visible sm:rounded-lg sm:border sm:px-3">
          {categories.map((category) => {
            const Icon = categoryIcons[category.value];

            return (
              <Link
                className="inline-flex shrink-0 items-center gap-2 rounded-md border border-[var(--color-border)] bg-surface px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-[var(--color-border-strong)] hover:text-primary"
                href={`/explore?category=${category.value}`}
                key={category.value}
              >
                <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                {category.label}
              </Link>
            );
          })}
        </div>
      </PageContainer>

      <PageContainer className="pb-12 pt-5">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Baru Ditambahkan</h2>
            <p className="mt-1 text-sm text-slate-500">
              Barang terbaru yang siap disewa di sekitar Jabodetabek.
            </p>
          </div>
          <Link className="text-sm font-semibold text-primary" href="/explore">
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
      </PageContainer>

      <footer className="border-t border-[var(--color-border)] bg-surface py-6">
        <PageContainer className="text-sm text-slate-500">
          RentEase 2026
        </PageContainer>
      </footer>

      <MobileBottomNav />
    </main>
  );
}
