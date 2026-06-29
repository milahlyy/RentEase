"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowRight, Clock3 } from "lucide-react";
import Link from "next/link";
import {
  DashboardErrorState,
  DashboardLockedState,
  DashboardPageSkeleton,
  useDashboardAuth,
} from "./dashboard-auth";
import { PageContainer, PageHeader, PageShell } from "./page-layout";
import { MobileBottomNav, SiteHeader } from "./site-header";

type DashboardPlaceholderPageProps = {
  actionHref?: string;
  actionLabel?: string;
  description: string;
  emptyDescription: string;
  emptyTitle: string;
  icon: LucideIcon;
  title: string;
};

export function DashboardPlaceholderPage({
  actionHref = "/dashboard",
  actionLabel = "Kembali ke aktivitas",
  description,
  emptyDescription,
  emptyTitle,
  icon: Icon,
  title,
}: DashboardPlaceholderPageProps) {
  const auth = useDashboardAuth();

  if (auth.isLoading) return <DashboardPageSkeleton />;
  if (!auth.hasToken) return <DashboardLockedState />;
  if (auth.error || !auth.user) {
    return <DashboardErrorState message={auth.error ?? "Coba lagi beberapa saat lagi."} />;
  }

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        backHref="/dashboard"
        backLabel="Aktivitas"
        eyebrow="Aktivitas"
        title={title}
        description={description}
      />
      <PageContainer className="pb-12">
        <section className="rounded-xl border border-[var(--color-border)] bg-surface-raised p-8 shadow-soft">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary-text shadow-inset-soft">
                <Icon className="h-7 w-7" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{emptyTitle}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  {emptyDescription}
                </p>
                <p className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <Clock3 className="h-4 w-4 text-primary" aria-hidden="true" />
                  Data asli akan masuk setelah alur terkait dibuat.
                </p>
              </div>
            </div>
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white shadow-soft-sm transition-colors hover:bg-primary-hover active:scale-95"
              href={actionHref}
            >
              {actionLabel}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </PageContainer>
      <MobileBottomNav />
    </PageShell>
  );
}

