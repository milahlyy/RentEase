"use client";

import { ShieldAlert, UserRound } from "lucide-react";
import Link from "next/link";
import { useCurrentUser } from "./auth-provider";
import { EmptyState } from "./feedback";
import { PageContainer, PageShell } from "./page-layout";
import { MobileBottomNav, SiteHeader } from "./site-header";

export const useDashboardAuth = useCurrentUser;

export function DashboardPageSkeleton() {
  return (
    <PageShell>
      <SiteHeader />
      <PageContainer className="py-8">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-primary-soft" />
        <div className="mt-6 h-12 w-full max-w-sm animate-pulse rounded-lg bg-surface-sunken" />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              className="h-32 animate-pulse rounded-xl border border-[var(--color-border)] bg-surface-raised shadow-soft-sm"
              key={index}
            />
          ))}
        </div>
        <div className="mt-6 h-64 animate-pulse rounded-xl border border-[var(--color-border)] bg-surface-raised shadow-soft" />
      </PageContainer>
      <MobileBottomNav />
    </PageShell>
  );
}

export function DashboardLockedState() {
  return (
    <PageShell>
      <SiteHeader />
      <PageContainer className="flex min-h-[calc(100vh-180px)] max-w-3xl items-center justify-center py-12">
        <EmptyState
          description="Aktivitas dipakai untuk melihat pesanan, barang sewaan, permintaan sewa, dan ringkasan rental kamu."
          icon={UserRound}
          title="Masuk untuk membuka aktivitas"
        >
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white shadow-soft-sm transition-colors hover:bg-primary-hover active:scale-95"
              href="/auth/login"
            >
              Masuk
            </Link>
            <Link
              className="rounded-lg border border-[var(--color-border)] bg-surface px-5 py-3 text-sm font-semibold text-slate-700 shadow-soft-sm transition-shadow hover:shadow-soft active:scale-95"
              href="/auth/register"
            >
              Daftar
            </Link>
          </div>
        </EmptyState>
      </PageContainer>
      <MobileBottomNav />
    </PageShell>
  );
}

export function DashboardErrorState({ message }: { message: string }) {
  return (
    <PageShell>
      <SiteHeader />
      <PageContainer className="flex min-h-[calc(100vh-180px)] max-w-3xl items-center justify-center py-12">
        <EmptyState
          actionHref="/auth/login"
          actionLabel="Masuk ulang"
          description={message}
          icon={ShieldAlert}
          title="Aktivitas belum bisa dimuat"
        />
      </PageContainer>
      <MobileBottomNav />
    </PageShell>
  );
}

