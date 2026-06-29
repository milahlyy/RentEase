"use client";

import { getCategoryLabel, type Listing, type ListingStatus } from "@rentease/shared";
import { ArrowRight, BadgeCheck, CalendarDays, Eye, PackageOpen, Plus, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  DashboardErrorState,
  DashboardLockedState,
  DashboardPageSkeleton,
  useDashboardAuth,
} from "../../../../components/dashboard-auth";
import { EmptyState, StatusBadge } from "../../../../components/feedback";
import { PageContainer, PageHeader, PageShell } from "../../../../components/page-layout";
import { MobileBottomNav, SiteHeader } from "../../../../components/site-header";
import { apiRequest } from "../../../../lib/api";
import { getStoredToken } from "../../../../lib/auth-client";
import { formatPrice } from "../../../../lib/format";

type MyListingsResponse = {
  listings: Listing[];
};

type UpdateListingStatusResponse = {
  id: string;
  status: ListingStatus;
};

type ListingStatusFilter = "all" | ListingStatus;

const statusMeta: Record<ListingStatus, { label: string; tone: "neutral" | "primary" | "warning" }> = {
  active: { label: "Aktif", tone: "primary" },
  draft: { label: "Draf", tone: "neutral" },
  inactive: { label: "Nonaktif", tone: "neutral" },
  rented: { label: "Sedang disewa", tone: "warning" },
};

function ListingManagementSkeleton() {
  return (
    <PageShell>
      <SiteHeader />
      <PageContainer className="py-8">
        <div className="h-10 w-56 animate-pulse rounded-lg bg-primary-soft" />
        <div className="mt-6 grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              className="h-40 animate-pulse rounded-xl border border-[var(--color-border)] bg-surface-raised shadow-soft-sm"
              key={index}
            />
          ))}
        </div>
      </PageContainer>
      <MobileBottomNav />
    </PageShell>
  );
}

function ListingRow({
  listing,
  onStatusChange,
  updatingId,
}: {
  listing: Listing;
  onStatusChange: (listing: Listing, status: "active" | "inactive") => void;
  updatingId: string | null;
}) {
  const meta = statusMeta[listing.status];
  const nextStatus = listing.status === "active" ? "inactive" : "active";
  const canToggle = listing.status !== "rented";

  return (
    <article className="rounded-xl border border-[var(--color-border)] bg-surface-raised p-4 shadow-soft-sm">
      <div className="grid gap-4 md:grid-cols-[140px_1fr_auto] md:items-center">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-surface-sunken shadow-inset-soft md:h-[140px]">
          {listing.primaryPhotoUrl ? (
            <Image
              alt={listing.title}
              className="object-cover"
              fill
              sizes="140px"
              src={listing.primaryPhotoUrl}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-primary-text">
              <PackageOpen className="h-8 w-8" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
            <span className="rounded-full border border-teal-200 bg-primary-light px-3 py-1 text-xs font-medium text-primary-text">
              {getCategoryLabel(listing.category)}
            </span>
          </div>
          <h2 className="line-clamp-2 text-lg font-bold text-slate-900">{listing.title}</h2>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
            {listing.description}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
            <span className="font-bold text-primary">{formatPrice(listing.pricePerDay)} / hari</span>
            <span>Deposit {formatPrice(listing.depositAmount)}</span>
            {listing.reviewCount > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                {listing.rating.toFixed(1)} ({listing.reviewCount})
              </span>
            ) : (
              <span>Belum ada ulasan</span>
            )}
            {listing.owner.isVerified && (
              <span className="inline-flex items-center gap-1">
                <BadgeCheck className="h-4 w-4 text-green-500" aria-hidden="true" />
                Identitas pemilik terverifikasi
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 md:w-44">
          <Link
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] bg-surface px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-soft-sm transition-shadow hover:shadow-soft"
            href={`/listing/${listing.id}`}
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            Lihat detail
          </Link>
          <Link
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] bg-surface px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-soft-sm transition-shadow hover:shadow-soft"
            href={`/dashboard/lender/listings/${listing.id}/availability`}
          >
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            Atur ketersediaan
          </Link>
          <button
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-soft-sm transition-colors hover:bg-primary-hover active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
            disabled={!canToggle || updatingId === listing.id}
            type="button"
            onClick={() => onStatusChange(listing, nextStatus)}
          >
            {updatingId === listing.id
              ? "Menyimpan..."
              : listing.status === "active"
                ? "Nonaktifkan"
                : "Terbitkan"}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function LenderListingsPage() {
  const auth = useDashboardAuth();
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ListingStatusFilter>("all");
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const listingCounts = useMemo(
    () => ({
      active: listings.filter((listing) => listing.status === "active").length,
      all: listings.length,
      draft: listings.filter((listing) => listing.status === "draft").length,
      inactive: listings.filter((listing) => listing.status === "inactive").length,
      rented: listings.filter((listing) => listing.status === "rented").length,
    }),
    [listings],
  );
  const filteredListings = useMemo(
    () =>
      statusFilter === "all"
        ? listings
        : listings.filter((listing) => listing.status === statusFilter),
    [listings, statusFilter],
  );

  useEffect(() => {
    async function loadListings() {
      if (!auth.user) return;

      const token = getStoredToken();

      if (!token) return;

      setIsLoadingListings(true);
      setError(null);

      const response = await apiRequest<MyListingsResponse>("/listings/mine", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.success) {
        setListings(response.data.listings);
      } else {
        setError(response.error);
      }

      setIsLoadingListings(false);
    }

    void loadListings();
  }, [auth.user]);

  async function updateStatus(listing: Listing, status: "active" | "inactive") {
    const token = getStoredToken();

    if (!token) return;

    setUpdatingId(listing.id);
    setError(null);

    const response = await apiRequest<UpdateListingStatusResponse>(
      `/listings/${listing.id}/status`,
      {
        body: JSON.stringify({ status }),
        headers: { Authorization: `Bearer ${token}` },
        method: "PATCH",
      },
    );

    if (response.success) {
      setListings((current) =>
        current.map((item) =>
          item.id === response.data.id ? { ...item, status: response.data.status } : item,
        ),
      );
    } else {
      setError(response.error);
    }

    setUpdatingId(null);
  }

  if (auth.isLoading) return <DashboardPageSkeleton />;
  if (!auth.hasToken) return <DashboardLockedState />;
  if (auth.error || !auth.user) {
    return <DashboardErrorState message={auth.error ?? "Coba lagi beberapa saat lagi."} />;
  }
  if (isLoadingListings) return <ListingManagementSkeleton />;

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        actions={
          <Link
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white shadow-soft-sm transition-colors hover:bg-primary-hover active:scale-95"
            href="/dashboard/lender/listings/new"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Tambah barang
          </Link>
        }
        backHref="/dashboard?mode=lender"
        backLabel="Aktivitas"
        eyebrow="Pemilik"
        title="Barang Sewaan"
        description="Kelola barang yang kamu sewakan, status terbit, dan detail yang terlihat di Jelajahi."
      />

      <PageContainer className="space-y-4 pb-12">
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {listings.length > 0 && (
          <div className="flex flex-wrap gap-2 rounded-xl border border-[var(--color-border)] bg-surface-raised p-3 shadow-soft-sm">
            {[
              { label: "Semua", value: "all", count: listingCounts.all },
              { label: "Aktif", value: "active", count: listingCounts.active },
              { label: "Draf", value: "draft", count: listingCounts.draft },
              { label: "Nonaktif", value: "inactive", count: listingCounts.inactive },
              { label: "Disewa", value: "rented", count: listingCounts.rented },
            ].map((item) => (
              <button
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  statusFilter === item.value
                    ? "bg-primary text-white shadow-soft-sm"
                    : "bg-surface text-slate-600 hover:bg-primary-soft hover:text-primary-text"
                }`}
                key={item.value}
                type="button"
                onClick={() => setStatusFilter(item.value as ListingStatusFilter)}
              >
                {item.label} ({item.count})
              </button>
            ))}
          </div>
        )}

        {listings.length > 0 ? (
          filteredListings.length > 0 ? (
            filteredListings.map((listing) => (
              <ListingRow
                key={listing.id}
                listing={listing}
                updatingId={updatingId}
                onStatusChange={updateStatus}
              />
            ))
          ) : (
            <EmptyState
              description="Tidak ada barang dengan status ini. Pilih status lain atau tambah barang baru."
              icon={PackageOpen}
              title="Tidak ada barang di filter ini"
            >
              <button
                className="mt-6 rounded-lg border border-[var(--color-border)] bg-surface px-5 py-3 text-sm font-semibold text-slate-700 shadow-soft-sm transition-shadow hover:shadow-soft"
                type="button"
                onClick={() => setStatusFilter("all")}
              >
                Lihat semua barang
              </button>
            </EmptyState>
          )
        ) : (
          <EmptyState
            actionHref="/dashboard/lender/listings/new"
            actionLabel="Tambah barang pertama"
            description="Barang yang kamu buat akan masuk sebagai draf dulu. Setelah dicek, kamu bisa terbitkan supaya tampil di Jelajahi."
            icon={PackageOpen}
            title="Belum ada barang sewaan"
          />
        )}

        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover"
          href="/dashboard?mode=lender"
        >
          Kembali ke aktivitas
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </PageContainer>
      <MobileBottomNav />
    </PageShell>
  );
}
