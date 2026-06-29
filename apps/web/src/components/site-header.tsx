"use client";

import {
  BadgeCheck,
  ClipboardList,
  Home,
  MessageCircle,
  PackagePlus,
  Search,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useCurrentUser } from "./auth-provider";

type SiteHeaderProps = {
  searchPlaceholder?: string;
  searchValue?: string;
  showSearch?: boolean;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
};

function getInitial(name?: string) {
  return name?.trim().charAt(0).toUpperCase() || "U";
}

function navLinkClass(isActive: boolean) {
  return `border-b-2 px-1 py-2 text-sm font-semibold transition-colors ${
    isActive
      ? "border-primary text-primary"
      : "border-transparent text-slate-700 hover:border-slate-300 hover:text-slate-950"
  }`;
}

export function SiteHeader({
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder = "Cari kamera, stroller, alat camping...",
  searchValue = "",
  showSearch = false,
}: SiteHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading: isAuthLoading, logout, user } = useCurrentUser();

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearchSubmit?.(searchValue);
  }

  function handleLogout() {
    logout();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-surface shadow-soft-sm">
      <div className="container mx-auto flex max-w-7xl items-center gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
        <Link className="shrink-0 text-xl font-bold text-primary" href="/">
          RentEase
        </Link>

        {showSearch && (
          <form
            className="mx-auto hidden w-full max-w-xl items-center gap-2 rounded-md border border-[var(--color-border)] bg-surface px-4 py-2 shadow-inset-soft md:flex"
            onSubmit={submitSearch}
          >
            <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <input
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              placeholder={searchPlaceholder}
              type="search"
              value={searchValue}
              onChange={(event) => onSearchChange?.(event.target.value)}
            />
          </form>
        )}

        <nav className="ml-auto hidden items-center gap-5 md:flex">
          {isAuthLoading ? (
            <div className="h-9 w-40 animate-pulse rounded-lg bg-surface-sunken" />
          ) : (
            <>
              <Link className={navLinkClass(pathname === "/")} href="/">
                Beranda
              </Link>
              <Link className={navLinkClass(pathname.startsWith("/explore"))} href="/explore">
                Jelajahi
              </Link>
              {user ? (
                <>
                  <Link
                    className={navLinkClass(pathname.startsWith("/dashboard"))}
                    href="/dashboard"
                  >
                    Aktivitas
                  </Link>
                  <Link className={navLinkClass(pathname.startsWith("/messages"))} href="/messages">
                    Pesan
                  </Link>
                  <Link
                    className="flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-surface px-2 py-1.5 text-sm font-semibold text-slate-800 transition-colors hover:border-[var(--color-border-strong)]"
                    href="/profile/settings"
                    aria-label="Buka profil dan verifikasi identitas"
                  >
                    {user.avatarUrl ? (
                      <span className="relative h-7 w-7 overflow-hidden rounded-full bg-primary-light">
                        <Image
                          alt=""
                          className="object-cover"
                          fill
                          sizes="28px"
                          src={user.avatarUrl}
                        />
                      </span>
                    ) : (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary-text">
                        {getInitial(user.name)}
                      </span>
                    )}
                    <span className="max-w-[120px] truncate">
                      {user.name}
                      {user.isVerified && (
                        <BadgeCheck
                          className="ml-1 inline-block h-4 w-4 text-green-500"
                          aria-label="Terverifikasi"
                        />
                      )}
                    </span>
                  </Link>
                  <button
                    className="px-1 py-2 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-950"
                    type="button"
                    onClick={handleLogout}
                  >
                    Keluar
                  </button>
                </>
              ) : (
                <>
                  <Link
                    className="border-b-2 border-transparent px-1 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
                    href="/auth/login"
                  >
                    Masuk
                  </Link>
                  <Link
                    className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-soft-sm transition-colors hover:bg-primary-hover active:scale-95"
                    href="/auth/register"
                  >
                    Daftar
                  </Link>
                </>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const items = [
    { label: "Beranda", href: "/", icon: Home, active: pathname === "/" },
    { label: "Jelajahi", href: "/explore", icon: Search, active: pathname.startsWith("/explore") },
    {
      label: "Aktivitas",
      href: "/dashboard/renter/orders",
      icon: pathname.startsWith("/dashboard/lender/listings") ? PackagePlus : ClipboardList,
      active: pathname.startsWith("/dashboard"),
    },
    {
      label: "Pesan",
      href: "/messages",
      icon: MessageCircle,
      active: pathname.startsWith("/messages"),
    },
    {
      label: "Profil",
      href: "/profile/settings",
      icon: UserRound,
      active: pathname.startsWith("/profile") || pathname.startsWith("/kyc"),
    },
  ];

  return (
    <nav className="pb-safe fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border)] bg-surface shadow-soft-sm md:hidden">
      <div className="grid grid-cols-5 px-1 py-1.5">
        {items.map((item) => (
          <Link
            className={`flex flex-col items-center gap-1 border-t-2 px-2 py-1.5 text-xs font-medium ${
              item.active ? "border-primary text-primary" : "border-transparent text-slate-500"
            }`}
            href={item.href}
            key={item.label}
          >
            <item.icon className="h-5 w-5" aria-hidden="true" />
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
