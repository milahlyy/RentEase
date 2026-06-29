"use client";

import type { ListingAvailability } from "@rentease/shared";
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  DashboardErrorState,
  DashboardLockedState,
  DashboardPageSkeleton,
  useDashboardAuth,
} from "../../../../../../components/dashboard-auth";
import { EmptyState } from "../../../../../../components/feedback";
import { PageContainer, PageHeader, PageShell } from "../../../../../../components/page-layout";
import { MobileBottomNav, SiteHeader } from "../../../../../../components/site-header";
import { apiRequest } from "../../../../../../lib/api";
import { getStoredToken } from "../../../../../../lib/auth-client";

type AvailabilityResponse = {
  listing: {
    id: string;
    title: string;
  };
  availability: ListingAvailability[];
};

type CreateAvailabilityResponse = {
  availability: ListingAvailability;
};

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function AvailabilitySkeleton() {
  return (
    <PageShell>
      <SiteHeader />
      <PageContainer className="py-8">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-primary-soft" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          <div className="h-80 animate-pulse rounded-xl border border-[var(--color-border)] bg-surface-raised shadow-soft" />
          <div className="h-80 animate-pulse rounded-xl border border-[var(--color-border)] bg-surface-raised shadow-soft" />
        </div>
      </PageContainer>
      <MobileBottomNav />
    </PageShell>
  );
}

export default function ListingAvailabilityPage() {
  const auth = useDashboardAuth();
  const params = useParams<{ id: string }>();
  const [availability, setAvailability] = useState<ListingAvailability[]>([]);
  const [endDate, setEndDate] = useState(todayDate());
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [listingTitle, setListingTitle] = useState("");
  const [reason, setReason] = useState("");
  const [startDate, setStartDate] = useState(todayDate());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadAvailability() {
      const token = getStoredToken();

      if (!token) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      const response = await apiRequest<AvailabilityResponse>(
        `/listings/${params.id}/availability`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.success) {
        setAvailability(response.data.availability);
        setListingTitle(response.data.listing.title);
      } else {
        setError(response.error);
      }

      setIsLoading(false);
    }

    if (params.id) void loadAvailability();
  }, [params.id]);

  async function createBlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const token = getStoredToken();

    if (!token) {
      setError("Sesi login tidak ditemukan. Silakan masuk ulang.");
      return;
    }

    if (endDate < startDate) {
      setError("Tanggal selesai harus sama atau setelah tanggal mulai.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const response = await apiRequest<CreateAvailabilityResponse>(
      `/listings/${params.id}/availability`,
      {
        body: JSON.stringify({
          endDate,
          reason: reason.trim() || null,
          startDate,
        }),
        headers: { Authorization: `Bearer ${token}` },
        method: "POST",
      },
    );

    if (response.success) {
      setAvailability((current) =>
        [...current, response.data.availability].sort((a, b) =>
          a.startDate.localeCompare(b.startDate),
        ),
      );
      setReason("");
    } else {
      setError(response.error);
    }

    setIsSubmitting(false);
  }

  async function deleteBlock(blockId: string) {
    const token = getStoredToken();

    if (!token) {
      setError("Sesi login tidak ditemukan. Silakan masuk ulang.");
      return;
    }

    setDeletingId(blockId);
    setError(null);

    const response = await apiRequest<{ id: string }>(
      `/listings/${params.id}/availability/${blockId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        method: "DELETE",
      },
    );

    if (response.success) {
      setAvailability((current) => current.filter((item) => item.id !== response.data.id));
    } else {
      setError(response.error);
    }

    setDeletingId(null);
  }

  if (auth.isLoading || isLoading) return <AvailabilitySkeleton />;
  if (!auth.hasToken) return <DashboardLockedState />;
  if (auth.error || !auth.user) {
    return <DashboardErrorState message={auth.error ?? "Coba lagi beberapa saat lagi."} />;
  }

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        backHref="/dashboard/lender/listings"
        backLabel="Barang Sewaan"
        eyebrow="Pemilik"
        title="Atur Ketersediaan"
        description={
          listingTitle
            ? `Blokir tanggal saat ${listingTitle} tidak bisa disewa.`
            : "Blokir tanggal saat barang tidak bisa disewa."
        }
      />

      <PageContainer className="grid gap-6 pb-12 lg:grid-cols-[380px_minmax(0,1fr)]">
        <form
          className="rounded-xl border border-[var(--color-border)] bg-surface-raised p-6 shadow-soft"
          onSubmit={createBlock}
        >
          <h2 className="text-lg font-semibold text-slate-900">Tambah blok tanggal</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Pakai ini untuk liburan, maintenance, atau booking offline.
          </p>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-800">Tanggal mulai</span>
              <input
                className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light"
                min={todayDate()}
                required
                type="date"
                value={startDate}
                onChange={(event) => {
                  const nextStart = event.target.value;
                  setStartDate(nextStart);
                  if (endDate < nextStart) setEndDate(nextStart);
                }}
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-800">Tanggal selesai</span>
              <input
                className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light"
                min={startDate}
                required
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-800">Alasan</span>
              <input
                className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light"
                maxLength={120}
                placeholder="Dipakai pribadi, maintenance, booking offline..."
                type="text"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </label>
          </div>

          {error && (
            <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white shadow-soft-sm transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {isSubmitting ? "Menyimpan..." : "Tambah blok tanggal"}
          </button>
        </form>

        <section className="rounded-xl border border-[var(--color-border)] bg-surface-raised p-6 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Tanggal tidak tersedia</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Tanggal ini akan ditolak saat penyewa mengajukan pemesanan.
              </p>
            </div>
            <span className="rounded-full border border-teal-200 bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
              {availability.length} blok
            </span>
          </div>

          {availability.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                description="Belum ada tanggal yang diblokir. Barang masih terlihat tersedia selama belum ada booking aktif."
                icon={CalendarDays}
                title="Belum ada blok tanggal"
              />
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {availability.map((block) => (
                <article
                  className="flex flex-col gap-3 rounded-lg border border-[var(--color-border)] bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
                  key={block.id}
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {block.startDate} sampai {block.endDate}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {block.reason ?? "Tidak ada alasan khusus"}
                    </p>
                  </div>
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={deletingId === block.id}
                    type="button"
                    onClick={() => void deleteBlock(block.id)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    {deletingId === block.id ? "Menghapus..." : "Hapus"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </PageContainer>
      <MobileBottomNav />
    </PageShell>
  );
}
