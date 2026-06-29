"use client";

import { bookingStatusLabels } from "@rentease/shared";
import { CalendarDays, CheckCircle2, FileText, PackageOpen, UserRound, XCircle } from "lucide-react";
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
import {
  bookingStatusTone,
  bookingTotal,
  deliveryMethodLabel,
  type BookingsResponse,
  type BookingSummary,
} from "../../../../lib/booking-ui";
import { formatPrice } from "../../../../lib/format";

type StatusActionResponse = BookingSummary;

function RequestsSkeleton() {
  return (
    <PageShell>
      <SiteHeader />
      <PageContainer className="py-8">
        <div className="h-10 w-56 animate-pulse rounded-lg bg-primary-soft" />
        <div className="mt-6 grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              className="h-48 animate-pulse rounded-xl border border-[var(--color-border)] bg-surface-raised shadow-soft-sm"
              key={index}
            />
          ))}
        </div>
      </PageContainer>
      <MobileBottomNav />
    </PageShell>
  );
}

function RequestCard({
  item,
  onProcess,
  processingAction,
}: {
  item: BookingSummary;
  onProcess: (id: string, action: "accept" | "reject") => void;
  processingAction: "accept" | "reject" | null;
}) {
  const total = bookingTotal(item.booking);
  const canProcess = item.booking.status === "pending_owner";

  return (
    <article className="rounded-xl border border-[var(--color-border)] bg-surface-raised p-4 shadow-soft-sm sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[112px_minmax(0,1fr)_260px] lg:items-start">
        <Link
          className="relative block aspect-square w-full overflow-hidden rounded-lg bg-surface-sunken lg:w-28"
          href={`/booking/${item.booking.id}`}
        >
          {item.listing.photoUrl ? (
            <Image
              alt={item.listing.title}
              className="object-cover"
              fill
              sizes="(min-width: 1024px) 112px, 100vw"
              src={item.listing.photoUrl}
            />
          ) : (
            <span className="flex h-full items-center justify-center text-primary">
              <PackageOpen className="h-8 w-8" aria-hidden="true" />
            </span>
          )}
        </Link>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={bookingStatusTone(item.booking.status)}>
              {bookingStatusLabels[item.booking.status]}
            </StatusBadge>
            <span className="rounded-full border border-[var(--color-border)] bg-surface px-3 py-1 text-xs font-semibold text-slate-600">
              {deliveryMethodLabel(item.booking.deliveryMethod)}
            </span>
          </div>
          <Link href={`/booking/${item.booking.id}`}>
            <h2 className="mt-3 line-clamp-2 text-lg font-bold text-slate-900 transition-colors hover:text-primary">
              {item.listing.title}
            </h2>
          </Link>
          <p className="mt-2 inline-flex items-center gap-2 text-sm text-slate-500">
            <UserRound className="h-4 w-4 text-primary" aria-hidden="true" />
            Penyewa: {item.renter.name}
          </p>
          <p className="mt-2 inline-flex items-center gap-2 text-sm text-slate-500">
            <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
            {item.booking.startDate} sampai {item.booking.endDate}
          </p>
          <p className="mt-2 text-sm text-slate-500">{item.listing.location}</p>
        </div>

        <div className="rounded-lg border border-[var(--color-border)] bg-surface p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Nilai pemesanan</p>
          <p className="mt-1 text-xl font-bold text-primary">{formatPrice(total)}</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Pemilik hanya menerima permintaan dulu. Pembayaran akan tersedia setelah permintaan diterima.
          </p>

          {canProcess ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <button
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-soft-sm transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                disabled={processingAction !== null}
                type="button"
                onClick={() => onProcess(item.booking.id, "accept")}
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                {processingAction === "accept" ? "Memproses" : "Terima"}
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-800 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={processingAction !== null}
                type="button"
                onClick={() => onProcess(item.booking.id, "reject")}
              >
                <XCircle className="h-4 w-4" aria-hidden="true" />
                {processingAction === "reject" ? "Memproses" : "Tolak"}
              </button>
            </div>
          ) : (
            <Link
              className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-[var(--color-border)] bg-surface-raised px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-soft-sm transition-shadow hover:shadow-soft"
              href={`/booking/${item.booking.id}`}
            >
              Lihat status
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export default function LenderRequestsPage() {
  const auth = useDashboardAuth();
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processing, setProcessing] = useState<{
    action: "accept" | "reject";
    id: string;
  } | null>(null);
  const pendingCount = useMemo(
    () => bookings.filter((item) => item.booking.status === "pending_owner").length,
    [bookings],
  );

  useEffect(() => {
    async function loadRequests() {
      if (!auth.user) {
        setIsLoading(false);
        return;
      }

      const token = getStoredToken();

      if (!token) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      const response = await apiRequest<BookingsResponse>("/bookings?role=lender", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.success) {
        setBookings(response.data.bookings);
      } else {
        setError(response.error);
      }

      setIsLoading(false);
    }

    if (!auth.isLoading) void loadRequests();
  }, [auth.isLoading, auth.user]);

  async function processRequest(id: string, action: "accept" | "reject") {
    const token = getStoredToken();

    if (!token) {
      setError("Sesi login tidak ditemukan. Masuk ulang untuk memproses permintaan.");
      return;
    }

    setProcessing({ action, id });
    setError(null);

    const response = await apiRequest<StatusActionResponse>(`/bookings/${id}/status`, {
      body: JSON.stringify({ action }),
      headers: { Authorization: `Bearer ${token}` },
      method: "PATCH",
    });

    if (response.success) {
      setBookings((current) =>
        current.map((item) => (item.booking.id === id ? response.data : item)),
      );
    } else {
      setError(response.error);
    }

    setProcessing(null);
  }

  if (auth.isLoading) return <DashboardPageSkeleton />;
  if (!auth.hasToken) return <DashboardLockedState />;
  if (auth.error || !auth.user) {
    return <DashboardErrorState message={auth.error ?? "Coba lagi beberapa saat lagi."} />;
  }
  if (isLoading) return <RequestsSkeleton />;

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        backHref="/dashboard?mode=lender"
        backLabel="Aktivitas"
        eyebrow="Pemilik"
        title="Permintaan Sewa"
        description="Tinjau permintaan sewa dari penyewa sebelum lanjut ke pembayaran."
        actions={
          <StatusBadge tone={pendingCount > 0 ? "warning" : "neutral"}>
            {pendingCount} menunggu keputusan
          </StatusBadge>
        }
      />

      <PageContainer className="pb-12">
        {error && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        {bookings.length === 0 ? (
          <EmptyState
            actionHref="/dashboard/lender/listings"
            actionLabel="Kelola barang"
            description="Permintaan sewa akan muncul setelah penyewa mengajukan tanggal sewa dari halaman detail barang."
            icon={FileText}
            title="Belum ada permintaan sewa"
          />
        ) : (
          <div className="space-y-4">
            <section className="rounded-xl border border-[var(--color-border)] bg-surface-raised p-4 shadow-soft-sm">
              <h2 className="text-sm font-semibold text-slate-900">
                {bookings.length} permintaan dan riwayat pemesanan
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Terima permintaan untuk mengubah status menjadi menunggu pembayaran. Tolak jika tanggal atau kondisi belum cocok.
              </p>
            </section>
            {bookings.map((booking) => (
              <RequestCard
                item={booking}
                key={booking.booking.id}
                processingAction={processing?.id === booking.booking.id ? processing.action : null}
                onProcess={processRequest}
              />
            ))}
          </div>
        )}
      </PageContainer>
      <MobileBottomNav />
    </PageShell>
  );
}


