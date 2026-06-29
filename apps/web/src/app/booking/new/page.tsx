"use client";

import type { Booking, DeliveryMethod, Listing, ListingAvailability } from "@rentease/shared";
import { CalendarDays, Clock3, MapPin, PackageOpen, ShieldCheck, Truck, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useCurrentUser } from "../../../components/auth-provider";
import { EmptyState } from "../../../components/feedback";
import { PageContainer, PageHeader, PageShell } from "../../../components/page-layout";
import { MobileBottomNav, SiteHeader } from "../../../components/site-header";
import { apiRequest } from "../../../lib/api";
import { getStoredToken } from "../../../lib/auth-client";
import { formatPrice } from "../../../lib/format";

type ListingDetailResponse = {
  listing: Listing;
  unavailableRanges: ListingAvailability[];
};

type PemesananDetailResponse = {
  booking: Booking;
};

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(date: string, days: number) {
  const next = new Date(`${date}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

function rentalDays(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  const diff = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
  return diff > 0 ? diff : 0;
}

function overlappingRange(
  ranges: ListingAvailability[],
  startDate: string,
  endDate: string,
): ListingAvailability | null {
  return ranges.find((range) => range.startDate <= endDate && range.endDate >= startDate) ?? null;
}

function PemesananSkeleton() {
  return (
    <PageShell>
      <SiteHeader />
      <PageContainer className="py-8">
        <div className="h-10 w-52 animate-pulse rounded-lg bg-primary-soft" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="h-96 animate-pulse rounded-xl border border-[var(--color-border)] bg-surface-raised shadow-soft" />
          <div className="h-80 animate-pulse rounded-xl border border-[var(--color-border)] bg-surface-raised shadow-soft" />
        </div>
      </PageContainer>
      <MobileBottomNav />
    </PageShell>
  );
}

function PemesananNewContent() {
  const auth = useCurrentUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get("listingId");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("pickup");
  const [endDate, setEndDate] = useState(addDays(todayDate(), 1));
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [listing, setListing] = useState<Listing | null>(null);
  const [startDate, setStartDate] = useState(todayDate());
  const [unavailableRanges, setUnavailableRanges] = useState<ListingAvailability[]>([]);

  useEffect(() => {
    async function loadListing() {
      if (!listingId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      const response = await apiRequest<ListingDetailResponse>(`/listings/${listingId}`);

      if (response.success) {
        setListing(response.data.listing);
        setUnavailableRanges(response.data.unavailableRanges);
      } else {
        setError(response.error);
      }

      setIsLoading(false);
    }

    void loadListing();
  }, [listingId]);

  const summary = useMemo(() => {
    if (!listing) {
      return { days: 0, rentalPrice: 0, total: 0 };
    }

    const days = rentalDays(startDate, endDate);
    const rentalPrice = listing.pricePerDay * days;
    const total = rentalPrice + listing.depositAmount;

    return { days, rentalPrice, total };
  }, [endDate, listing, startDate]);
  const blockedRange = useMemo(
    () => overlappingRange(unavailableRanges, startDate, endDate),
    [endDate, startDate, unavailableRanges],
  );

  async function submitPemesanan() {
    if (!listing) return;

    const token = getStoredToken();

    if (!token) {
      setError("Sesi login tidak ditemukan. Silakan masuk ulang.");
      return;
    }

    if (summary.days <= 0) {
      setError("Tanggal selesai harus sama atau setelah tanggal mulai.");
      return;
    }

    if (blockedRange) {
      setError("Tanggal yang dipilih bentrok dengan jadwal yang sudah tidak tersedia.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const response = await apiRequest<PemesananDetailResponse>("/bookings", {
      body: JSON.stringify({
        deliveryMethod,
        endDate,
        listingId: listing.id,
        startDate,
      }),
      headers: { Authorization: `Bearer ${token}` },
      method: "POST",
    });

    if (response.success) {
      router.push(`/booking/${response.data.booking.id}`);
      return;
    }

    setError(response.error);
    setIsSubmitting(false);
  }

  if (auth.isLoading || isLoading) return <PemesananSkeleton />;

  if (!auth.hasToken) {
    return (
      <PageShell>
        <SiteHeader />
        <PageContainer className="flex min-h-[calc(100vh-180px)] max-w-3xl items-center justify-center py-12">
          <EmptyState
            description="Masuk dulu supaya pemesanan, deposit, dan status transaksi bisa tercatat di akun kamu."
            icon={UserRound}
            title="Masuk untuk ajukan pemesanan"
          >
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white" href="/auth/login">
                Masuk
              </Link>
              <Link className="rounded-lg border border-[var(--color-border)] bg-surface px-5 py-3 text-sm font-semibold text-slate-700" href="/auth/register">
                Daftar
              </Link>
            </div>
          </EmptyState>
        </PageContainer>
        <MobileBottomNav />
      </PageShell>
    );
  }

  if (!listingId || !listing) {
    return (
      <PageShell>
        <SiteHeader />
        <PageContainer className="flex min-h-[calc(100vh-180px)] max-w-3xl items-center justify-center py-12">
          <EmptyState
            actionHref="/explore"
            actionLabel="Cari barang"
            description={error ?? "Pilih barang dari halaman Jelajahi sebelum membuat pemesanan."}
            icon={PackageOpen}
            title="Barang belum dipilih"
          />
        </PageContainer>
        <MobileBottomNav />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        backHref={`/listing/${listing.id}`}
        backLabel="Detail Barang"
        eyebrow="Pemesanan"
        title="Ajukan Pemesanan"
        description="Pilih tanggal dan metode serah terima. Pemilik perlu menerima permintaan sebelum kamu lanjut ke pembayaran."
      />

      <PageContainer className="grid gap-6 pb-12 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-xl border border-[var(--color-border)] bg-surface-raised p-6 shadow-soft">
          <div className="flex gap-4">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-surface-sunken">
              {listing.primaryPhotoUrl ? (
                <Image alt={listing.title} className="object-cover" fill sizes="96px" src={listing.primaryPhotoUrl} />
              ) : (
                <div className="flex h-full items-center justify-center text-primary">
                  <PackageOpen className="h-8 w-8" aria-hidden="true" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="line-clamp-2 text-xl font-bold text-slate-900">{listing.title}</h2>
              <p className="mt-2 inline-flex items-center gap-1 text-sm text-slate-500">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {listing.location}
              </p>
              <p className="mt-2 font-bold text-primary">{formatPrice(listing.pricePerDay)} / hari</p>
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="start-date">
                Tanggal mulai <span className="text-red-600">*</span>
              </label>
              <input
                className="w-full rounded-lg border border-[var(--color-border)] bg-surface px-3 py-2.5 text-sm outline-none shadow-inset-soft focus:border-primary"
                id="start-date"
                min={todayDate()}
                type="date"
                value={startDate}
                onChange={(event) => {
                  const nextStart = event.target.value;
                  setStartDate(nextStart);
                  if (endDate < nextStart) setEndDate(nextStart);
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="end-date">
                Tanggal selesai <span className="text-red-600">*</span>
              </label>
              <input
                className="w-full rounded-lg border border-[var(--color-border)] bg-surface px-3 py-2.5 text-sm outline-none shadow-inset-soft focus:border-primary"
                id="end-date"
                min={startDate}
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="text-sm font-medium text-slate-700" htmlFor="delivery-method">
              Metode serah terima <span className="text-red-600">*</span>
            </label>
            <select
              className="mt-1.5 w-full rounded-lg border border-[var(--color-border)] bg-surface px-3 py-2.5 text-sm outline-none shadow-inset-soft focus:border-primary"
              id="delivery-method"
              value={deliveryMethod}
              onChange={(event) => setDeliveryMethod(event.target.value as DeliveryMethod)}
            >
              <option value="pickup">Ambil sendiri</option>
              <option value="delivery">Dikirim pemilik</option>
            </select>
          </div>

          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
            <p className="font-semibold">Pemesanan ini belum masuk pembayaran.</p>
            <p className="mt-1">
              Setelah pemilik menerima permintaan, kamu bisa lanjut ke pembayaran dan deposit.
            </p>
          </div>

          <div className="mt-4 rounded-lg border border-[var(--color-border)] bg-surface p-4 text-sm leading-6 text-slate-600">
            <p className="font-semibold text-slate-900">Tanggal tidak tersedia</p>
            {unavailableRanges.length > 0 ? (
              <ul className="mt-2 space-y-1">
                {unavailableRanges.slice(0, 4).map((range) => (
                  <li key={range.id}>
                    {range.startDate} sampai {range.endDate}
                    {range.reason ? ` - ${range.reason}` : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2">Belum ada tanggal yang diblokir untuk barang ini.</p>
            )}
          </div>
        </section>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-xl border border-[var(--color-border)] bg-surface-raised p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-slate-900">Ringkasan pemesanan</h2>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-slate-600">
                  <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
                  Durasi
                </span>
                <span className="font-semibold text-slate-900">{summary.days} hari</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Harga sewa</span>
                <span className="font-semibold text-slate-900">{formatPrice(summary.rentalPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Deposit ditahan</span>
                <span className="font-semibold text-slate-900">{formatPrice(listing.depositAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="inline-flex items-center gap-2 text-slate-600">
                  <Truck className="h-4 w-4 text-primary" aria-hidden="true" />
                  Ongkir
                </span>
                <span className="font-semibold text-slate-900">Belum dihitung</span>
              </div>
            </div>

            <div className="mt-5 border-t border-[var(--color-border)] pt-5">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-900">Total awal</span>
                <span className="text-xl font-bold text-primary">{formatPrice(summary.total)}</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Total final menunggu pembayaran dan biaya pengiriman jika dipilih.
              </p>
            </div>

            {error && (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            {blockedRange && (
              <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Tanggal ini tidak tersedia karena bentrok dengan {blockedRange.startDate} sampai{" "}
                {blockedRange.endDate}.
              </p>
            )}

            <button
              className="mt-5 flex w-full items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white shadow-soft-sm transition-colors hover:bg-primary-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting || summary.days <= 0 || Boolean(blockedRange)}
              type="button"
              onClick={submitPemesanan}
            >
              {isSubmitting ? "Mengirim permintaan..." : "Ajukan pemesanan"}
            </button>

            <p className="mt-4 inline-flex items-start gap-2 text-xs leading-5 text-slate-500">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              WhatsApp tetap terkunci sampai pemesanan diterima dan pembayaran berhasil.
            </p>
            <p className="mt-2 inline-flex items-start gap-2 text-xs leading-5 text-slate-500">
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              Pemilik perlu menerima permintaan sebelum pembayaran.
            </p>
          </section>
        </aside>
      </PageContainer>
      <MobileBottomNav />
    </PageShell>
  );
}

export default function PemesananNewPage() {
  return (
    <Suspense fallback={<PemesananSkeleton />}>
      <PemesananNewContent />
    </Suspense>
  );
}


