"use client";

import { bookingStatusLabels } from "@rentease/shared";
import { CalendarDays, ClipboardList, PackageOpen, ReceiptText, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
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

function OrdersSkeleton() {
  return (
    <PageShell>
      <SiteHeader />
      <PageContainer className="py-8">
        <div className="h-10 w-52 animate-pulse rounded-lg bg-primary-soft" />
        <div className="mt-6 grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              className="h-44 animate-pulse rounded-xl border border-[var(--color-border)] bg-surface-raised shadow-soft-sm"
              key={index}
            />
          ))}
        </div>
      </PageContainer>
      <MobileBottomNav />
    </PageShell>
  );
}

function OrderCard({ item }: { item: BookingSummary }) {
  const total = bookingTotal(item.booking);

  return (
    <article className="rounded-xl border border-[var(--color-border)] bg-surface-raised p-4 shadow-soft-sm transition-shadow hover:shadow-soft sm:p-5">
      <div className="grid gap-4 md:grid-cols-[112px_minmax(0,1fr)_auto] md:items-start">
        <Link
          className="relative block aspect-square w-full overflow-hidden rounded-lg bg-surface-sunken md:w-28"
          href={`/booking/${item.booking.id}`}
        >
          {item.listing.photoUrl ? (
            <Image
              alt={item.listing.title}
              className="object-cover"
              fill
              sizes="(min-width: 768px) 112px, 100vw"
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
          <p className="mt-2 text-sm text-slate-500">Pemilik: {item.owner.name}</p>
          <p className="mt-2 inline-flex items-center gap-2 text-sm text-slate-500">
            <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
            {item.booking.startDate} sampai {item.booking.endDate}
          </p>
          <p className="mt-2 text-sm text-slate-500">{item.listing.location}</p>
        </div>

        <div className="rounded-lg border border-[var(--color-border)] bg-surface p-4 md:min-w-52">
          <p className="text-xs font-semibold uppercase text-slate-500">Total sementara</p>
          <p className="mt-1 text-xl font-bold text-primary">{formatPrice(total)}</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Termasuk sewa, deposit, dan biaya serah terima jika ada.
          </p>
          <Link
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-soft-sm transition-colors hover:bg-primary-hover active:scale-95"
            href={`/booking/${item.booking.id}`}
          >
            Lihat status
            <ReceiptText className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function RenterOrdersPage() {
  const auth = useDashboardAuth();
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
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

      const response = await apiRequest<BookingsResponse>("/bookings?role=renter", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.success) {
        setBookings(response.data.bookings);
      } else {
        setError(response.error);
      }

      setIsLoading(false);
    }

    if (!auth.isLoading) void loadOrders();
  }, [auth.isLoading, auth.user]);

  if (auth.isLoading) return <DashboardPageSkeleton />;
  if (!auth.hasToken) return <DashboardLockedState />;
  if (auth.error || !auth.user) {
    return <DashboardErrorState message={auth.error ?? "Coba lagi beberapa saat lagi."} />;
  }
  if (isLoading) return <OrdersSkeleton />;

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        backHref="/dashboard"
        backLabel="Aktivitas"
        eyebrow="Penyewa"
        title="Pesanan Saya"
        description="Pantau pemesanan, pembayaran, deposit, dan pengembalian barang yang kamu sewa."
      />

      <PageContainer className="pb-12">
        {error ? (
          <EmptyState
            actionHref="/dashboard/renter/orders"
            actionLabel="Coba lagi"
            description={error}
            icon={ClipboardList}
            title="Pesanan belum bisa dimuat"
          />
        ) : bookings.length === 0 ? (
          <EmptyState
            actionHref="/explore"
            actionLabel="Cari barang"
            description="Setelah kamu mengajukan pemesanan, keputusan pemilik, pembayaran, dan status pengembalian akan tampil di sini."
            icon={UserRound}
            title="Belum ada pesanan"
          />
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-[var(--color-border)] bg-surface-raised p-4 shadow-soft-sm">
              <p className="text-sm font-semibold text-slate-900">
                {bookings.length} pesanan ditemukan
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                WhatsApp pemilik tetap terkunci sampai pemesanan diterima dan pembayaran berhasil.
              </p>
            </div>
            {bookings.map((booking) => (
              <OrderCard item={booking} key={booking.booking.id} />
            ))}
          </div>
        )}
      </PageContainer>
      <MobileBottomNav />
    </PageShell>
  );
}
