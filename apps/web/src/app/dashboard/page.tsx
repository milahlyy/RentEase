"use client";

import type { Listing } from "@rentease/shared";
import {
  ArrowRight,
  ClipboardList,
  FileText,
  LayoutDashboard,
  PackageOpen,
  Plus,
  ReceiptText,
  Search,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  DashboardErrorState,
  DashboardLockedState,
  DashboardPageSkeleton,
  useDashboardAuth,
} from "../../components/dashboard-auth";
import { StatCard } from "../../components/feedback";
import { PageContainer, PageHeader, PageShell } from "../../components/page-layout";
import { MobileBottomNav, SiteHeader } from "../../components/site-header";
import { apiRequest } from "../../lib/api";
import { getStoredToken } from "../../lib/auth-client";
import type { BookingsResponse, BookingSummary } from "../../lib/booking-ui";
import {
  parseDashboardMode,
  type DashboardLink,
  type DashboardMode,
  type DashboardStat,
} from "../../lib/dashboard-ui";

type MyListingsResponse = {
  listings: Listing[];
};

const renterLinks: DashboardLink[] = [
  {
    label: "Lihat pesanan",
    description: "Cek status pemesanan, pembayaran, dan pengembalian.",
    href: "/dashboard/renter/orders",
    icon: ClipboardList,
  },
  {
    label: "Cari barang",
    description: "Mulai pemesanan dari halaman jelajahi.",
    href: "/explore",
    icon: Search,
  },
];

const lenderLinks: DashboardLink[] = [
  {
    label: "Kelola barang",
    description: "Lihat barang yang kamu sewakan.",
    href: "/dashboard/lender/listings",
    icon: PackageOpen,
  },
  {
    label: "Permintaan sewa",
    description: "Terima atau tolak permintaan sewa dari penyewa.",
    href: "/dashboard/lender/requests",
    icon: FileText,
  },
  {
    label: "Ringkasan pendapatan",
    description: "Pantau pendapatan yang selesai.",
    href: "/dashboard/lender/earnings",
    icon: WalletCards,
  },
];

function ModeSegmentedControl({
  mode,
  onChange,
}: {
  mode: DashboardMode;
  onChange: (mode: DashboardMode) => void;
}) {
  const items: { label: string; value: DashboardMode }[] = [
    { label: "Penyewa", value: "renter" },
    { label: "Pemilik", value: "lender" },
  ];

  return (
    <div className="inline-flex rounded-lg border border-[var(--color-border)] bg-surface p-1 shadow-soft-sm">
      {items.map((item) => (
        <button
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            mode === item.value
              ? "bg-primary text-white shadow-soft-sm"
              : "text-slate-600 hover:bg-primary-soft hover:text-primary-text"
          }`}
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function StatGrid({ stats }: { stats: DashboardStat[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => (
        <StatCard
          description={stat.description}
          icon={stat.icon}
          key={stat.label}
          label={stat.label}
          value={stat.value}
        />
      ))}
    </div>
  );
}

function QuickLinks({ links }: { links: DashboardLink[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {links.map((item) => (
        <Link
          className="group flex items-start justify-between gap-4 rounded-xl border border-[var(--color-border)] bg-surface-raised p-5 shadow-soft-sm transition-shadow hover:shadow-soft"
          href={item.href}
          key={item.href}
        >
          <span className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary-text shadow-inset-soft">
              <item.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-slate-900">{item.label}</span>
              <span className="mt-1 block text-sm leading-6 text-slate-500">
                {item.description}
              </span>
            </span>
          </span>
          <ArrowRight
            className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-primary"
            aria-hidden="true"
          />
        </Link>
      ))}
    </div>
  );
}

function buildRenterStats(bookings: BookingSummary[], isLoading: boolean): DashboardStat[] {
  const activeStatuses = ["confirmed", "ready_for_pickup", "in_transit", "active", "return_pending"];
  const activeCount = bookings.filter((item) => activeStatuses.includes(item.booking.status)).length;
  const awaitingPaymentCount = bookings.filter(
    (item) => item.booking.status === "awaiting_payment",
  ).length;
  const completedCount = bookings.filter((item) => item.booking.status === "completed").length;

  return [
    {
      label: "Pesanan aktif",
      value: isLoading ? "..." : String(activeCount),
      description: "Barang yang sedang berjalan atau menunggu pengembalian.",
      icon: ClipboardList,
    },
    {
      label: "Menunggu pembayaran",
      value: isLoading ? "..." : String(awaitingPaymentCount),
      description: "Pemesanan yang sudah diterima pemilik dan perlu dibayar.",
      icon: ReceiptText,
    },
    {
      label: "Sewa selesai",
      value: isLoading ? "..." : String(completedCount),
      description: "Riwayat transaksi selesai masuk ke arsip pesanan.",
      icon: PackageOpen,
    },
  ];
}

function buildLenderStats(
  listings: Listing[],
  isListingsLoading: boolean,
  bookings: BookingSummary[],
  isBookingsLoading: boolean,
): DashboardStat[] {
  const activeCount = listings.filter((listing) => listing.status === "active").length;
  const draftOrInactiveCount = listings.filter((listing) =>
    ["draft", "inactive"].includes(listing.status),
  ).length;
  const pendingRequestCount = bookings.filter(
    (item) => item.booking.status === "pending_owner",
  ).length;

  return [
    {
      label: "Barang aktif",
      value: isListingsLoading ? "..." : String(activeCount),
      description: "Barang yang sudah diterbitkan dan tampil di Jelajahi.",
      icon: PackageOpen,
    },
    {
      label: "Draf/nonaktif",
      value: isListingsLoading ? "..." : String(draftOrInactiveCount),
      description: "Barang yang masih perlu dicek atau sedang disembunyikan.",
      icon: FileText,
    },
    {
      label: "Permintaan masuk",
      value: isBookingsLoading ? "..." : String(pendingRequestCount),
      description: "Permintaan sewa yang menunggu keputusan pemilik.",
      icon: WalletCards,
    },
  ];
}

function EmptyWorkflowPanel({
  hasLenderListings = false,
  mode,
}: {
  hasLenderListings?: boolean;
  mode: DashboardMode;
}) {
  const isRenter = mode === "renter";
  const lenderTitle = hasLenderListings ? "Barang sewaan sudah siap" : "Belum ada aktivitas pemilik";
  const lenderDescription = hasLenderListings
    ? "Kamu sudah punya barang sewaan. Permintaan sewa dan pendapatan akan muncul saat transaksi berjalan."
    : "Setelah barang dan permintaan sewa dibuat, kamu bisa memantau status barang, permintaan sewa, dan pendapatan dari sini.";

  return (
    <section className="rounded-xl border border-[var(--color-border)] bg-surface-raised p-6 shadow-soft">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary-text shadow-inset-soft">
            {isRenter ? (
              <ClipboardList className="h-7 w-7" aria-hidden="true" />
            ) : (
              <PackageOpen className="h-7 w-7" aria-hidden="true" />
            )}
          </span>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              {isRenter ? "Belum ada pesanan aktif" : lenderTitle}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              {isRenter
                ? "Setelah kamu mengajukan pemesanan, status pemilik, pembayaran, dan pengembalian akan tampil di sini."
                : lenderDescription}
            </p>
          </div>
        </div>
        <Link
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white shadow-soft-sm transition-colors hover:bg-primary-hover active:scale-95"
          href={isRenter ? "/explore" : "/dashboard/lender/listings"}
        >
          {isRenter ? "Cari barang" : "Kelola barang"}
          {isRenter ? (
            <Search className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Plus className="h-4 w-4" aria-hidden="true" />
          )}
        </Link>
      </div>
    </section>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = parseDashboardMode(searchParams.get("mode"));
  const auth = useDashboardAuth();
  const [lenderListings, setLenderListings] = useState<Listing[]>([]);
  const [isLenderListingsLoading, setIsLenderListingsLoading] = useState(false);
  const [lenderListingsError, setLenderListingsError] = useState<string | null>(null);
  const [renterBookings, setRenterBookings] = useState<BookingSummary[]>([]);
  const [lenderBookings, setLenderBookings] = useState<BookingSummary[]>([]);
  const [isBookingsLoading, setIsBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const isRenter = mode === "renter";
  const renterStats = useMemo(
    () => buildRenterStats(renterBookings, isBookingsLoading && isRenter),
    [isBookingsLoading, isRenter, renterBookings],
  );
  const lenderStats = useMemo(
    () =>
      buildLenderStats(
        lenderListings,
        isLenderListingsLoading,
        lenderBookings,
        isBookingsLoading && !isRenter,
      ),
    [isBookingsLoading, isLenderListingsLoading, isRenter, lenderBookings, lenderListings],
  );

  function setMode(nextMode: DashboardMode) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", nextMode);
    router.replace(`/dashboard?${params.toString()}`, { scroll: false });
  }

  useEffect(() => {
    async function loadLenderListings() {
      if (!auth.user || isRenter) {
        return;
      }

      const token = getStoredToken();

      if (!token) {
        return;
      }

      setIsLenderListingsLoading(true);
      setLenderListingsError(null);

      const response = await apiRequest<MyListingsResponse>("/listings/mine", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.success) {
        setLenderListings(response.data.listings);
      } else {
        setLenderListingsError(response.error);
      }

      setIsLenderListingsLoading(false);
    }

    void loadLenderListings();
  }, [auth.user, isRenter]);

  useEffect(() => {
    async function loadAktivitasBookings() {
      if (!auth.user) {
        return;
      }

      const token = getStoredToken();

      if (!token) {
        return;
      }

      const role = isRenter ? "renter" : "lender";
      setIsBookingsLoading(true);
      setBookingsError(null);

      const response = await apiRequest<BookingsResponse>(`/bookings?role=${role}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.success) {
        if (isRenter) {
          setRenterBookings(response.data.bookings);
        } else {
          setLenderBookings(response.data.bookings);
        }
      } else {
        setBookingsError(response.error);
      }

      setIsBookingsLoading(false);
    }

    void loadAktivitasBookings();
  }, [auth.user, isRenter]);

  if (auth.isLoading) return <DashboardPageSkeleton />;
  if (!auth.hasToken) return <DashboardLockedState />;
  if (auth.error || !auth.user) {
    return <DashboardErrorState message={auth.error ?? "Coba lagi beberapa saat lagi."} />;
  }

  const stats = isRenter ? renterStats : lenderStats;
  const links = isRenter ? renterLinks : lenderLinks;

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        eyebrow="Aktivitas"
        title={`Halo, ${auth.user.name}`}
        description="Pantau aktivitas sewa dan barang yang kamu sewakan dari satu tempat."
        actions={<ModeSegmentedControl mode={mode} onChange={setMode} />}
      >
        <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-surface px-3 py-2 text-xs font-semibold text-slate-600 shadow-soft-sm">
          <LayoutDashboard className="h-4 w-4 text-primary" aria-hidden="true" />
          Mode saat ini: {isRenter ? "Penyewa" : "Pemilik"}
        </div>
      </PageHeader>

      <PageContainer className="space-y-6 pb-12">
        {bookingsError && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Data pemesanan belum bisa dimuat: {bookingsError}
          </p>
        )}
        {lenderListingsError && !isRenter && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Barang sewaan belum bisa dimuat: {lenderListingsError}
          </p>
        )}
        <StatGrid stats={stats} />
        <EmptyWorkflowPanel hasLenderListings={lenderListings.length > 0} mode={mode} />

        <section className="rounded-xl border border-[var(--color-border)] bg-surface-raised p-6 shadow-soft">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-slate-900">
              {isRenter ? "Aksi penyewa" : "Aksi pemilik"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {isRenter
                ? "Akses cepat ini terhubung ke pesanan dan alur pemesanan yang sedang berjalan."
                : "Akses cepat ini dipakai untuk barang sewaan, permintaan sewa, dan pendapatan."}
            </p>
          </div>
          <QuickLinks links={links} />
        </section>
      </PageContainer>
      <MobileBottomNav />
    </PageShell>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardPageSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}



