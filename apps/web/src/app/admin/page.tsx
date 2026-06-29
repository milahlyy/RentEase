"use client";

import {
  ClipboardList,
  FileCheck2,
  LayoutDashboard,
  PackageSearch,
  ShieldAlert,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useCurrentUser } from "../../components/auth-provider";
import { EmptyState, StatCard, StatusBadge } from "../../components/feedback";
import { PageContainer, PageHeader, PageShell } from "../../components/page-layout";
import { MobileBottomNav, SiteHeader } from "../../components/site-header";
import { apiRequest } from "../../lib/api";
import { getStoredToken } from "../../lib/auth-client";

type AdminSummaryResponse = {
  admin: {
    email: string;
    name: string;
  };
  stats: {
    activeBookings: number;
    activeListings: number;
    openDisputes: number;
    pendingVerifications: number;
    totalUsers: number;
  };
  pendingKyc: {
    id: string;
    status: string;
    reviewed_at: string | null;
    user_id: string;
    name: string;
    email: string;
  }[];
  recentListings: {
    id: string;
    title: string;
    status: string;
    created_at: string;
    owner_name: string;
  }[];
  recentBookings: {
    id: string;
    status: string;
    created_at: string;
    listing_title: string;
    renter_name: string;
    lender_name: string;
  }[];
};

function AdminSkeleton() {
  return (
    <PageShell>
      <SiteHeader />
      <PageContainer className="py-8">
        <div className="h-10 w-52 animate-pulse rounded-lg bg-primary-soft" />
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              className="h-32 animate-pulse rounded-xl border border-[var(--color-border)] bg-surface-raised shadow-soft-sm"
              key={index}
            />
          ))}
        </div>
        <div className="mt-6 h-80 animate-pulse rounded-xl border border-[var(--color-border)] bg-surface-raised shadow-soft" />
      </PageContainer>
      <MobileBottomNav />
    </PageShell>
  );
}

function SimpleList({
  empty,
  items,
  title,
}: {
  empty: string;
  items: { id: string; primary: string; secondary: string; badge?: string }[];
  title: string;
}) {
  return (
    <section className="rounded-xl border border-[var(--color-border)] bg-surface-raised p-6 shadow-soft">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-[var(--color-border-strong)] bg-surface p-4 text-sm text-slate-500">
          {empty}
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <article
              className="flex items-start justify-between gap-4 rounded-lg border border-[var(--color-border)] bg-surface p-4"
              key={item.id}
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">{item.primary}</p>
                <p className="mt-1 text-sm text-slate-500">{item.secondary}</p>
              </div>
              {item.badge && <StatusBadge tone="neutral">{item.badge}</StatusBadge>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default function AdminPage() {
  const auth = useCurrentUser();
  const [data, setData] = useState<AdminSummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAdminSummary() {
      const token = getStoredToken();

      if (!token) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      const response = await apiRequest<AdminSummaryResponse>("/admin/summary", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.success) {
        setData(response.data);
      } else {
        setError(response.error);
      }

      setIsLoading(false);
    }

    void loadAdminSummary();
  }, []);

  if (auth.isLoading || isLoading) return <AdminSkeleton />;

  if (!auth.hasToken) {
    return (
      <PageShell>
        <SiteHeader />
        <PageContainer className="flex min-h-[calc(100vh-180px)] max-w-3xl items-center justify-center py-12">
          <EmptyState
            actionHref="/auth/login"
            actionLabel="Masuk"
            description="Admin Lite hanya tersedia untuk akun operator demo."
            icon={ShieldAlert}
            title="Masuk untuk membuka admin"
          />
        </PageContainer>
        <MobileBottomNav />
      </PageShell>
    );
  }

  if (error || !data) {
    return (
      <PageShell>
        <SiteHeader />
        <PageContainer className="flex min-h-[calc(100vh-180px)] max-w-3xl items-center justify-center py-12">
          <EmptyState
            actionHref="/"
            actionLabel="Kembali ke beranda"
            description={error ?? "Admin belum bisa dimuat."}
            icon={ShieldAlert}
            title="Akses admin ditolak"
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
        backHref="/dashboard"
        backLabel="Aktivitas"
        eyebrow="Admin Lite"
        title="Pusat Operasional"
        description="Pantau trust, listing, dan transaksi penting untuk demo RentEase."
      />

      <PageContainer className="space-y-6 pb-12">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            description="Akun terdaftar di platform."
            icon={Users}
            label="Total user"
            value={String(data.stats.totalUsers)}
          />
          <StatCard
            description="Barang yang tampil di Jelajahi."
            icon={PackageSearch}
            label="Listing aktif"
            value={String(data.stats.activeListings)}
          />
          <StatCard
            description="Booking yang masih berjalan."
            icon={ClipboardList}
            label="Booking aktif"
            value={String(data.stats.activeBookings)}
          />
          <StatCard
            description="Verifikasi yang perlu dicek."
            icon={FileCheck2}
            label="Verifikasi pending"
            value={String(data.stats.pendingVerifications)}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <SimpleList
            empty="Tidak ada verifikasi identitas pending."
            title="Verifikasi identitas pending"
            items={data.pendingKyc.map((item) => ({
              id: item.id,
              primary: item.name,
              secondary: item.email,
              badge: "Pending",
            }))}
          />
          <SimpleList
            empty="Belum ada listing terbaru."
            title="Listing terbaru"
            items={data.recentListings.map((item) => ({
              id: item.id,
              primary: item.title,
              secondary: `Pemilik: ${item.owner_name}`,
              badge: item.status,
            }))}
          />
          <SimpleList
            empty="Belum ada booking."
            title="Booking terbaru"
            items={data.recentBookings.map((item) => ({
              id: item.id,
              primary: item.listing_title,
              secondary: `${item.renter_name} -> ${item.lender_name}`,
              badge: item.status,
            }))}
          />
          <section className="rounded-xl border border-[var(--color-border)] bg-surface-raised p-6 shadow-soft">
            <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-slate-900">
              <LayoutDashboard className="h-5 w-5 text-primary" aria-hidden="true" />
              Dispute & klaim deposit
            </h2>
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
              {data.stats.openDisputes > 0
                ? `${data.stats.openDisputes} kasus perlu ditinjau.`
                : "Belum ada dispute. Modul klaim deposit penuh dibuat setelah flow dasar stabil."}
            </p>
          </section>
        </div>
      </PageContainer>
      <MobileBottomNav />
    </PageShell>
  );
}
