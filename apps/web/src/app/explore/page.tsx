"use client";

import { categories, type Listing } from "@rentease/shared";
import { SlidersHorizontal, Search, PackageOpen, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { apiRequest } from "../../lib/api";
import { ListingCard, ListingCardSkeleton } from "../../components/listing-card";
import { PageContainer, PageHeader } from "../../components/page-layout";
import { MobileBottomNav, SiteHeader } from "../../components/site-header";

type ListingsResponse = {
  listings: Listing[];
  total: number;
  page: number;
};

function buildQuery({
  category,
  limit,
  maxPrice,
  minPrice,
  page,
  q,
  sort,
}: {
  category: string;
  limit: number;
  maxPrice: string;
  minPrice: string;
  page: number;
  q: string;
  sort: string;
}) {
  const params = new URLSearchParams();

  if (q.trim()) params.set("q", q.trim());
  if (category) params.set("category", category);
  if (minPrice) params.set("min_price", minPrice);
  if (maxPrice) params.set("max_price", maxPrice);
  if (sort && sort !== "latest") params.set("sort", sort);
  if (page > 1) params.set("page", String(page));
  params.set("limit", String(limit));

  return params;
}

function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.get("min_price") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") ?? "");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "latest");
  const [page, setPage] = useState(Number(searchParams.get("page") ?? "1") || 1);
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const requestIdRef = useRef(0);
  const limit = 20;

  const query = useMemo(
    () => buildQuery({ category, limit, maxPrice, minPrice, page, q, sort }),
    [category, maxPrice, minPrice, page, q, sort],
  );

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    const timeout = window.setTimeout(async () => {
      const queryString = query.toString();
      router.replace(queryString ? `/explore?${queryString}` : "/explore", { scroll: false });
      setIsLoading(true);

      const response = await apiRequest<ListingsResponse>(`/listings?${queryString}`);

      if (requestIdRef.current !== requestId) {
        return;
      }

      if (response.success) {
        setTotal(response.data.total);
        setListings((current) =>
          response.data.page > 1 ? [...current, ...response.data.listings] : response.data.listings,
        );
      } else {
        setTotal(0);
        setListings([]);
      }

      setIsLoading(false);
    }, 300);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [query, router]);

  function resetFilters() {
    setQ("");
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setSort("latest");
    setPage(1);
  }

  function resetPageAnd(action: () => void) {
    setPage(1);
    action();
  }

  const filters = (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor="sort">
          Urutkan
        </label>
        <select
          className="mt-1.5 w-full rounded-lg border border-[var(--color-border)] bg-surface px-3 py-2.5 text-sm outline-none shadow-inset-soft focus:border-primary"
          id="sort"
          value={sort}
          onChange={(event) => resetPageAnd(() => setSort(event.target.value))}
        >
          <option value="latest">Terbaru</option>
          <option value="price_asc">Harga terendah</option>
          <option value="price_desc">Harga tertinggi</option>
          <option value="rating_desc">Rating tertinggi</option>
        </select>
      </div>

      <div>
        <p className="text-sm font-medium text-slate-700">Kategori</p>
        <div className="mt-3 space-y-2">
          {categories.map((item) => (
            <label className="flex items-center gap-2 text-sm text-slate-600" key={item.value}>
              <input
                checked={category === item.value}
                className="h-4 w-4 rounded border-[var(--color-border-strong)] text-primary"
                type="checkbox"
                onChange={() =>
                  resetPageAnd(() => setCategory(category === item.value ? "" : item.value))
                }
              />
              {item.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-slate-700">Rentang harga / hari</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <input
            className="w-full rounded-lg border border-[var(--color-border)] bg-surface px-3 py-2.5 text-sm outline-none shadow-inset-soft placeholder:text-slate-400 focus:border-primary"
            inputMode="numeric"
            placeholder="Min"
            value={minPrice}
            onChange={(event) => resetPageAnd(() => setMinPrice(event.target.value))}
          />
          <input
            className="w-full rounded-lg border border-[var(--color-border)] bg-surface px-3 py-2.5 text-sm outline-none shadow-inset-soft placeholder:text-slate-400 focus:border-primary"
            inputMode="numeric"
            placeholder="Max"
            value={maxPrice}
            onChange={(event) => resetPageAnd(() => setMaxPrice(event.target.value))}
          />
        </div>
      </div>

      <button
        className="w-full rounded-lg border border-[var(--color-border)] bg-surface-raised px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-soft-sm transition-shadow hover:shadow-soft active:scale-95"
        type="button"
        onClick={resetFilters}
      >
        Reset filter
      </button>
    </div>
  );

  return (
    <main className="min-h-screen bg-[var(--color-bg-subtle)] pb-20">
      <SiteHeader
        showSearch
        searchPlaceholder="Cari kamera, stroller, drone..."
        searchValue={q}
        onSearchChange={(value) => resetPageAnd(() => setQ(value))}
      />

      <PageHeader
        title="Jelajahi Barang"
        description={`${total} barang ditemukan`}
        actions={
          <button
            className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-surface px-3 py-2 text-sm font-semibold text-slate-700 shadow-soft-sm lg:hidden"
            type="button"
            onClick={() => setIsFilterOpen(true)}
          >
            <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
            Filter
          </button>
        }
      />

      <PageContainer className="pb-4 lg:hidden">
        <label className="flex w-full items-center gap-2 rounded-md border border-[var(--color-border)] bg-surface px-4 py-3 shadow-inset-soft">
          <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
          <input
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            placeholder="Cari kamera, stroller, drone..."
            type="search"
            value={q}
            onChange={(event) => resetPageAnd(() => setQ(event.target.value))}
          />
        </label>
      </PageContainer>

      <PageContainer className="grid gap-6 pb-12 lg:grid-cols-[280px_1fr]">
        <aside className="sticky top-24 hidden self-start rounded-lg border border-[var(--color-border)] bg-surface p-5 shadow-soft-sm lg:block">
          {filters}
        </aside>

        <section>
          {isLoading && page === 1 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <ListingCardSkeleton key={index} />
              ))}
            </div>
          ) : listings.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {listings.map((listing) => (
                  <ListingCard listing={listing} key={listing.id} />
                ))}
              </div>
              {listings.length < total && (
                <div className="mt-8 flex justify-center">
                  <button
                    className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white shadow-soft-sm transition-colors hover:bg-primary-hover active:scale-95 disabled:opacity-60"
                    disabled={isLoading}
                    type="button"
                    onClick={() => setPage((current) => current + 1)}
                  >
                    {isLoading ? "Memuat..." : "Muat lebih banyak"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-lg border border-[var(--color-border)] bg-surface p-8 text-center shadow-soft-sm">
              <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-surface-sunken text-primary-text">
                <PackageOpen className="h-10 w-10" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-xl font-semibold text-slate-900">
                Tidak ada barang yang cocok
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Coba ubah kata kunci, kategori, atau rentang harga.
              </p>
              <button
                className="mt-5 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-soft-sm transition-colors hover:bg-primary-hover active:scale-95"
                type="button"
                onClick={resetFilters}
              >
                Reset filter
              </button>
            </div>
          )}
        </section>
      </PageContainer>

      {isFilterOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-950/40 lg:hidden">
          <div className="absolute bottom-0 left-0 right-0 rounded-t-lg bg-surface p-6 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Filter</h2>
              <button
                className="rounded-md bg-surface-sunken p-2 text-slate-500"
                type="button"
                aria-label="Tutup filter"
                onClick={() => setIsFilterOpen(false)}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            {filters}
          </div>
        </div>
      )}
      <MobileBottomNav />
    </main>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-500">Memuat...</div>}>
      <ExploreContent />
    </Suspense>
  );
}
