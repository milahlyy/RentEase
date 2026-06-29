import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type EmptyStateProps = {
  actionHref?: string;
  actionLabel?: string;
  children?: ReactNode;
  description: string;
  icon: LucideIcon;
  title: string;
};

type StatusTone = "neutral" | "warning" | "success" | "danger" | "primary";

const toneClasses: Record<StatusTone, string> = {
  danger: "border-red-200 bg-red-50 text-red-800",
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
  primary: "border-teal-200 bg-teal-50 text-teal-800",
  success: "border-green-200 bg-green-50 text-green-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
};

export function EmptyState({
  actionHref,
  actionLabel,
  children,
  description,
  icon: Icon,
  title,
}: EmptyStateProps) {
  return (
    <section className="w-full rounded-xl border border-[var(--color-border)] bg-surface-raised p-8 text-center shadow-soft">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-primary-light text-primary-text shadow-inset-soft">
        <Icon className="h-10 w-10" aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-2xl font-bold text-slate-900">{title}</h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {children}
      {actionHref && actionLabel && (
        <Link
          className="mt-6 inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white shadow-soft-sm transition-colors hover:bg-primary-hover active:scale-95"
          href={actionHref}
        >
          {actionLabel}
        </Link>
      )}
    </section>
  );
}

export function StatusBadge({
  children,
  icon: Icon,
  tone = "neutral",
}: {
  children: ReactNode;
  icon?: LucideIcon;
  tone?: StatusTone;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${toneClasses[tone]}`}
    >
      {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
      {children}
    </span>
  );
}

export function StatCard({
  description,
  icon: Icon,
  label,
  value,
}: {
  description: string;
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <section className="rounded-xl border border-[var(--color-border)] bg-surface-raised p-5 shadow-soft-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light text-primary-text shadow-inset-soft">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-500">{description}</p>
    </section>
  );
}
