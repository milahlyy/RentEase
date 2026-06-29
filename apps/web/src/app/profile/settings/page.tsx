"use client";

import type { KycStatus } from "@rentease/shared";
import {
  BadgeCheck,
  Clock3,
  ImagePlus,
  type LucideIcon,
  Mail,
  Phone,
  ShieldAlert,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useCurrentUser } from "../../../components/auth-provider";
import { PageContainer, PageHeader, PageShell } from "../../../components/page-layout";
import { MobileBottomNav, SiteHeader } from "../../../components/site-header";
import { apiRequest } from "../../../lib/api";
import { getStoredToken } from "../../../lib/auth-client";
import type { AuthMeResponse } from "../../../lib/auth-client";

const kycMeta: Record<
  KycStatus,
  {
    badge: string;
    className: string;
    description: string;
    icon: LucideIcon;
    label: string;
  }
> = {
  pending: {
    badge: "Menunggu review",
    className: "border-amber-200 bg-amber-50 text-amber-800",
    description: "Upload KTP dan selfie agar transaksi bernilai tinggi lebih dipercaya.",
    icon: Clock3,
    label: "Menunggu verifikasi",
  },
  rejected: {
    badge: "Perlu diperbaiki",
    className: "border-red-200 bg-red-50 text-red-800",
    description: "Dokumen perlu dikirim ulang dengan foto yang lebih jelas.",
    icon: ShieldAlert,
    label: "Perlu diperbaiki",
  },
  verified: {
    badge: "Terverifikasi",
    className: "border-green-200 bg-green-50 text-green-800",
    description: "Profil kamu sudah punya sinyal trust utama untuk transaksi rental.",
    icon: ShieldCheck,
    label: "Terverifikasi",
  },
};

function SettingsSkeleton() {
  return (
    <PageShell>
      <SiteHeader />
      <PageContainer className="py-8">
        <div className="mb-6 h-10 w-36 animate-pulse rounded-lg bg-primary-soft" />
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="rounded-xl border border-[var(--color-border)] bg-surface-raised p-6 shadow-soft">
            <div className="h-8 w-2/3 animate-pulse rounded-full bg-surface-sunken" />
            <div className="mt-6 space-y-4">
              <div className="h-16 animate-pulse rounded-lg bg-primary-soft" />
              <div className="h-16 animate-pulse rounded-lg bg-primary-soft" />
              <div className="h-16 animate-pulse rounded-lg bg-primary-soft" />
            </div>
          </div>
          <div className="h-80 animate-pulse rounded-xl bg-surface-raised shadow-soft" />
        </div>
      </PageContainer>
      <MobileBottomNav />
    </PageShell>
  );
}

function LockedState() {
  return (
    <PageShell>
      <SiteHeader />
      <PageContainer className="flex min-h-[calc(100vh-180px)] max-w-3xl items-center justify-center py-12">
        <section className="w-full rounded-xl border border-[var(--color-border)] bg-surface-raised p-8 text-center shadow-soft">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-primary-light text-primary-text shadow-inset-soft">
            <UserRound className="h-10 w-10" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-2xl font-bold text-slate-900">Masuk untuk melihat profil</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Profil dan verifikasi identitas dipakai untuk membangun trust sebelum kamu menyewa atau
            menyewakan barang.
          </p>
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
        </section>
      </PageContainer>
      <MobileBottomNav />
    </PageShell>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <PageShell>
      <SiteHeader />
      <PageContainer className="flex min-h-[calc(100vh-180px)] max-w-3xl items-center justify-center py-12">
        <section className="w-full rounded-xl border border-[var(--color-border)] bg-surface-raised p-8 text-center shadow-soft">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-amber-100 text-amber-800 shadow-inset-soft">
            <ShieldAlert className="h-10 w-10" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-2xl font-bold text-slate-900">Profil belum bisa dimuat</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{message}</p>
          <Link
            className="mt-6 inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white shadow-soft-sm transition-colors hover:bg-primary-hover active:scale-95"
            href="/auth/login"
          >
            Masuk ulang
          </Link>
        </section>
      </PageContainer>
      <MobileBottomNav />
    </PageShell>
  );
}

export default function ProfileSettingsPage() {
  const { error, hasToken, isLoading, refreshUser, user } = useCurrentUser();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    setName(user.name);
    setPhone(user.phone ?? "");
    setAvatarUrl(user.avatarUrl);
  }, [user]);

  async function uploadAvatar(token: string) {
    if (!selectedAvatar) return avatarUrl;

    const formData = new FormData();
    formData.set("avatar", selectedAvatar);

    const response = await apiRequest<{ url: string }>("/uploads/avatar", {
      body: formData,
      headers: { Authorization: `Bearer ${token}` },
      method: "POST",
    });

    if (!response.success) {
      throw new Error(response.error);
    }

    return response.data.url;
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const token = getStoredToken();

    if (!token) {
      setFormError("Sesi login tidak ditemukan. Silakan masuk ulang.");
      return;
    }

    setIsSaving(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const nextAvatarUrl = await uploadAvatar(token);
      const response = await apiRequest<AuthMeResponse>("/auth/me", {
        body: JSON.stringify({
          avatarUrl: nextAvatarUrl,
          name,
          phone: phone.trim() || null,
        }),
        headers: { Authorization: `Bearer ${token}` },
        method: "PATCH",
      });

      if (response.success) {
        setAvatarUrl(response.data.user.avatarUrl);
        setSelectedAvatar(null);
        setFormSuccess("Profil berhasil disimpan.");
        await refreshUser();
      } else {
        setFormError(response.error);
      }
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : "Profil belum bisa disimpan.");
    }

    setIsSaving(false);
  }

  if (isLoading) return <SettingsSkeleton />;
  if (!hasToken) return <LockedState />;
  if (error || !user) return <ErrorState message={error ?? "Coba lagi beberapa saat lagi."} />;

  const meta = kycMeta[user.kycStatus];
  const KycIcon = meta.icon;

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        backHref="/"
        backLabel="Beranda"
        title="Pengaturan Profil"
        description="Kelola identitas dasar yang akan dipakai untuk kepercayaan, pemesanan, dan riwayat transaksi."
      />

      <PageContainer className="pb-12">
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <form
            className="rounded-xl border border-[var(--color-border)] bg-surface-raised p-6 shadow-soft"
            onSubmit={saveProfile}
          >
            <div className="flex items-start gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-primary-light text-primary-text shadow-inset-soft">
                {avatarUrl ? (
                  <Image alt="" className="object-cover" fill sizes="64px" src={avatarUrl} />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-2xl font-bold">
                    {user.name.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">
                  {user.name}
                  {user.isVerified && (
                    <BadgeCheck
                      className="ml-1 inline-block h-4 w-4 text-green-500"
                      aria-label="Terverifikasi"
                    />
                  )}
                </p>
                <p className="mt-1 text-sm text-slate-500">Bergabung sejak 2026</p>
              </div>
            </div>

            <div className="mt-8 grid gap-5">
              <label className="block">
                <span className="text-sm font-semibold text-slate-800">Nama lengkap</span>
                <input
                  className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light"
                  minLength={2}
                  required
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>

              <label className="block">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  Email
                </span>
                <input
                  className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none"
                  readOnly
                  type="email"
                  value={user.email}
                />
                <span className="mt-1 block text-xs text-slate-500">
                  Email belum bisa diubah di MVP ini.
                </span>
              </label>

              <label className="block">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  Nomor telepon
                </span>
                <input
                  className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light"
                  minLength={8}
                  placeholder="081234567890"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </label>

              <label className="block">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <ImagePlus className="h-4 w-4" aria-hidden="true" />
                  Foto profil
                </span>
                <input
                  accept="image/jpeg,image/png,image/webp"
                  className="mt-2 block w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-primary-light file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-primary"
                  type="file"
                  onChange={(event) => setSelectedAvatar(event.target.files?.[0] ?? null)}
                />
                <span className="mt-1 block text-xs text-slate-500">
                  JPG, PNG, atau WebP. Maksimal 2MB.
                </span>
              </label>
            </div>

            {formError && (
              <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {formError}
              </p>
            )}

            {formSuccess && (
              <p className="mt-5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                {formSuccess}
              </p>
            )}

            <button
              className="mt-6 flex w-full items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white shadow-soft-sm transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? "Menyimpan..." : "Simpan profil"}
            </button>
          </form>

          <aside className="space-y-6">
            <section className="rounded-xl border border-[var(--color-border)] bg-surface-raised p-6 shadow-soft">
              <div className={`rounded-lg border p-4 ${meta.className}`}>
                <p className="inline-flex items-center gap-2 text-sm font-semibold">
                  <KycIcon className="h-4 w-4" aria-hidden="true" />
                  {meta.label}
                </p>
                <p className="mt-2 text-sm leading-6">{meta.description}</p>
              </div>
              <p className="mt-4 text-sm text-slate-500">Status: {meta.badge}</p>
              <Link
                className="mt-5 flex w-full items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white shadow-soft-sm transition-colors hover:bg-primary-hover active:scale-95"
                href="/kyc"
              >
                Verifikasi identitas
              </Link>
            </section>

            <section className="rounded-xl border border-[var(--color-border)] bg-surface-raised p-6 shadow-soft">
              <h2 className="text-lg font-semibold text-slate-900">Kesiapan akun</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <li className="flex gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  Profil dasar siap dipakai untuk pemesanan.
                </li>
                <li className="flex gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  Verifikasi identitas membantu deposit dan transaksi bernilai tinggi lebih
                  dipercaya.
                </li>
              </ul>
            </section>
          </aside>
        </div>
      </PageContainer>
      <MobileBottomNav />
    </PageShell>
  );
}

