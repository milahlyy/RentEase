"use client";

import type { KycStatus } from "@rentease/shared";
import {
  BadgeCheck,
  Camera,
  CheckCircle2,
  Clock3,
  FileImage,
  ShieldAlert,
  ShieldCheck,
  Upload,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { ChangeEvent, FormEvent, useState } from "react";
import { useCurrentUser } from "../../components/auth-provider";
import { PageContainer, PageHeader, PageShell } from "../../components/page-layout";
import { MobileBottomNav, SiteHeader } from "../../components/site-header";

const kycMeta: Record<
  KycStatus,
  {
    className: string;
    description: string;
    icon: LucideIcon;
    label: string;
  }
> = {
  pending: {
    className: "border-amber-200 bg-amber-50 text-amber-800",
    description: "Dokumen identitas kamu siap dikirim untuk ditinjau.",
    icon: Clock3,
    label: "Menunggu review",
  },
  rejected: {
    className: "border-red-200 bg-red-50 text-red-800",
    description: "Kirim ulang dokumen dengan foto KTP dan selfie yang lebih jelas.",
    icon: ShieldAlert,
    label: "Perlu diperbaiki",
  },
  verified: {
    className: "border-green-200 bg-green-50 text-green-800",
    description: "Identitas kamu sudah terverifikasi untuk membangun trust transaksi.",
    icon: ShieldCheck,
    label: "Terverifikasi",
  },
};

function KycSkeleton() {
  return (
    <PageShell>
      <SiteHeader />
      <PageContainer className="py-8">
        <div className="mb-8 h-10 w-40 animate-pulse rounded-lg bg-primary-soft" />
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-xl border border-[var(--color-border)] bg-surface-raised p-6 shadow-soft">
            <div className="h-8 w-2/3 animate-pulse rounded-full bg-surface-sunken" />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="h-44 animate-pulse rounded-xl bg-primary-soft" />
              <div className="h-44 animate-pulse rounded-xl bg-primary-soft" />
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
          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Masuk untuk verifikasi identitas
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Verifikasi identitas dipakai untuk menjaga trust sebelum pemesanan, deposit, dan serah
            terima barang.
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
          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Verifikasi identitas belum bisa dimuat
          </h1>
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

function UploadField({
  description,
  fileName,
  icon: Icon,
  id,
  label,
  onChange,
}: {
  description: string;
  fileName: string | null;
  icon: LucideIcon;
  id: string;
  label: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label
      className="block cursor-pointer rounded-xl border border-dashed border-[var(--color-border-strong)] bg-primary-soft p-5 shadow-inset-soft transition-shadow hover:shadow-soft-sm"
      htmlFor={id}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface text-primary shadow-soft-sm">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <span className="mt-4 block text-sm font-semibold text-slate-900">{label}</span>
      <span className="mt-1 block text-sm leading-6 text-slate-500">{description}</span>
      <span className="mt-4 flex min-h-11 items-center rounded-lg bg-surface px-4 py-3 text-sm font-medium text-slate-700 shadow-soft-sm">
        {fileName ?? "Pilih file JPG, PNG, atau PDF"}
      </span>
      <input
        accept="image/png,image/jpeg,application/pdf"
        className="sr-only"
        id={id}
        type="file"
        onChange={onChange}
      />
    </label>
  );
}

export default function KycPage() {
  const { error, hasToken, isLoading, user } = useCurrentUser();
  const [ktpFileName, setKtpFileName] = useState<string | null>(null);
  const [selfieFileName, setSelfieFileName] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitted(true);
  }

  if (isLoading) return <KycSkeleton />;
  if (!hasToken) return <LockedState />;
  if (error || !user) return <ErrorState message={error ?? "Coba lagi beberapa saat lagi."} />;

  const meta = kycMeta[user.kycStatus];
  const StatusIcon = meta.icon;
  const canSubmit = Boolean(ktpFileName && selfieFileName);

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        backHref="/profile/settings"
        backLabel="Profil"
        eyebrow="Pusat Kepercayaan"
        title="Verifikasi Identitas"
        description="Upload KTP dan selfie sebagai bukti identitas. Data ini membantu pemilik dan penyewa merasa lebih aman sebelum pemesanan, deposit, dan serah terima barang."
      />

      <PageContainer className="pb-12">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="rounded-xl border border-[var(--color-border)] bg-surface-raised p-6 shadow-soft">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Dokumen identitas</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Pastikan foto jelas, tidak terpotong, dan nama sesuai profil.
                </p>
              </div>
              <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${meta.className}`}>
                <StatusIcon className="h-4 w-4" aria-hidden="true" />
                {meta.label}
              </span>
            </div>

            {user.kycStatus === "verified" ? (
              <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-6 text-green-800 shadow-inset-soft">
                <p className="inline-flex items-center gap-2 font-semibold">
                  <BadgeCheck className="h-5 w-5 text-green-500" aria-hidden="true" />
                  Identitas sudah terverifikasi
                </p>
                <p className="mt-2 text-sm leading-6">
                  Kamu sudah punya sinyal trust utama untuk transaksi. Upload ulang tidak diperlukan
                  saat ini.
                </p>
              </div>
            ) : (
              <form className="mt-6" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <UploadField
                    description="Foto KTP asli yang terbaca jelas."
                    fileName={ktpFileName}
                    icon={FileImage}
                    id="ktp-file"
                    label="Foto KTP"
                    onChange={(event) =>
                      setKtpFileName(event.target.files?.[0]?.name ?? null)
                    }
                  />
                  <UploadField
                    description="Selfie sambil memegang KTP untuk validasi manual."
                    fileName={selfieFileName}
                    icon={Camera}
                    id="selfie-file"
                    label="Selfie dengan KTP"
                    onChange={(event) =>
                      setSelfieFileName(event.target.files?.[0]?.name ?? null)
                    }
                  />
                </div>

                {!canSubmit && (
                  <p className="mt-4 text-sm text-slate-500">
                    Pilih kedua dokumen untuk mengaktifkan tombol kirim.
                  </p>
                )}

                {isSubmitted && (
                  <div className="mt-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-800">
                    <p className="inline-flex items-center gap-2 font-semibold">
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      Pengajuan verifikasi identitas tersimpan.
                    </p>
                    <p className="mt-1">
                      Upload file dan review manual belum aktif, jadi status akun belum berubah
                      otomatis.
                    </p>
                  </div>
                )}

                <button
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white shadow-soft-sm transition-colors hover:bg-primary-hover active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none sm:w-auto"
                  disabled={!canSubmit}
                  type="submit"
                >
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  Kirim pengajuan
                </button>
              </form>
            )}
          </section>

          <aside className="space-y-6">
            <section className="rounded-xl border border-[var(--color-border)] bg-surface-raised p-6 shadow-soft">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-light font-bold text-primary-text shadow-inset-soft">
                  {user.name.charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{user.name}</p>
                  <p className="truncate text-sm text-slate-500">{user.email}</p>
                </div>
              </div>

              <div className={`mt-5 rounded-lg border p-4 ${meta.className}`}>
                <p className="inline-flex items-center gap-2 text-sm font-semibold">
                  <StatusIcon className="h-4 w-4" aria-hidden="true" />
                  Status verifikasi: {meta.label}
                </p>
                <p className="mt-2 text-sm leading-6">{meta.description}</p>
              </div>
            </section>

            <section className="rounded-xl border border-[var(--color-border)] bg-surface-raised p-6 shadow-soft">
              <h2 className="text-lg font-semibold text-slate-900">Dipakai nanti untuk</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <li className="flex gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  Kepercayaan pemilik saat menerima pemesanan.
                </li>
                <li className="flex gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  Sinyal risiko untuk deposit dan dispute.
                </li>
                <li className="flex gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  Kebijakan kontak WhatsApp setelah pemesanan diterima dan pembayaran sukses.
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

