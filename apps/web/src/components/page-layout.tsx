import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
  className?: string;
};

type PageContainerProps = {
  children: ReactNode;
  className?: string;
};

type PageHeaderProps = {
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
  children?: ReactNode;
  description?: string;
  eyebrow?: string;
  title: string;
};

export function PageShell({ children, className = "" }: PageShellProps) {
  return (
    <main className={`min-h-screen bg-[var(--color-bg-subtle)] pb-20 md:pb-12 ${className}`}>
      {children}
    </main>
  );
}

export function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <div className={`container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 transition-colors hover:text-primary"
      href={href}
    >
      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      {children}
    </Link>
  );
}

export function PageHeader({
  actions,
  backHref,
  backLabel,
  children,
  description,
  eyebrow,
  title,
}: PageHeaderProps) {
  return (
    <PageContainer className="py-6">
      {(backHref || backLabel) && backHref && backLabel && (
        <div className="mb-4">
          <BackLink href={backHref}>{backLabel}</BackLink>
        </div>
      )}
      <div className="flex flex-col gap-4 border-b border-[var(--color-border)] pb-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          {eyebrow && <p className="text-sm font-semibold text-primary">{eyebrow}</p>}
          <h1 className={eyebrow ? "mt-1 text-2xl font-bold text-slate-900" : "text-2xl font-bold text-slate-900"}>
            {title}
          </h1>
          {description && <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>}
          {children}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </PageContainer>
  );
}
