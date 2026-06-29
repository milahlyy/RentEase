"use client";

import type {
  Booking,
  BookingStatus,
  ConditionEvidence,
  DepositTransaction,
  EvidencePhotoType,
} from "@rentease/shared";
import {
  bookingStatusLabels,
  depositStatusLabels,
  evidencePhotoTypeLabels,
} from "@rentease/shared";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  ImageIcon,
  Lock,
  MessageCircle,
  PackageOpen,
  ReceiptText,
  ShieldCheck,
  UploadCloud,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCurrentUser } from "../../../components/auth-provider";
import { EmptyState, StatusBadge } from "../../../components/feedback";
import { PageContainer, PageHeader, PageShell } from "../../../components/page-layout";
import { MobileBottomNav, SiteHeader } from "../../../components/site-header";
import { apiRequest } from "../../../lib/api";
import { getStoredToken } from "../../../lib/auth-client";
import { bookingStatusTone } from "../../../lib/booking-ui";
import { formatPrice } from "../../../lib/format";
import type { ConversationResponse } from "../../../lib/messages-ui";

type PemesananDetailResponse = {
  booking: Booking;
  listing: {
    id: string;
    location: string;
    photoUrl: string | null;
    title: string;
  };
  owner: {
    id: string;
    isVerified: boolean;
    name: string;
    phone: string | null;
  };
  renter: {
    id: string;
    name: string;
  };
  deposit: DepositTransaction | null;
  evidence: ConditionEvidence[];
  statusLabel: string;
};

const timeline: { label: string; status: BookingStatus }[] = [
  { label: "Menunggu pemilik", status: "pending_owner" },
  { label: "Menunggu pembayaran", status: "awaiting_payment" },
  { label: "Dikonfirmasi", status: "confirmed" },
  { label: "Siap serah terima", status: "ready_for_pickup" },
  { label: "Sedang disewa", status: "active" },
  { label: "Pengembalian", status: "return_pending" },
  { label: "Selesai", status: "completed" },
];

const evidenceSlots: {
  description: string;
  role: "lender" | "renter";
  type: EvidencePhotoType;
}[] = [
  {
    description: "Pemilik memotret kondisi barang sebelum diserahkan.",
    role: "lender",
    type: "pre_handover_owner",
  },
  {
    description: "Penyewa memotret kondisi barang saat barang diterima.",
    role: "renter",
    type: "received_by_renter",
  },
  {
    description: "Penyewa memotret kondisi barang sebelum proses pengembalian.",
    role: "renter",
    type: "pre_return_renter",
  },
  {
    description: "Pemilik memotret kondisi barang setelah barang kembali.",
    role: "lender",
    type: "post_return_owner",
  },
];

const uploadableStatuses: Record<EvidencePhotoType, BookingStatus[]> = {
  post_return_owner: ["return_pending", "completed"],
  pre_handover_owner: ["confirmed", "ready_for_pickup"],
  pre_return_renter: ["active", "return_pending"],
  received_by_renter: ["ready_for_pickup", "active"],
};

type UserBookingRole = "lender" | "renter" | null;
type LifecycleAction = "confirm_received" | "confirm_return_good" | "mark_ready" | "request_return";

function latestEvidenceByType(evidence: ConditionEvidence[], type: EvidencePhotoType) {
  return evidence.filter((item) => item.type === type).at(-1) ?? null;
}

function canUploadEvidence({
  role,
  status,
  type,
}: {
  role: UserBookingRole;
  status: BookingStatus;
  type: EvidencePhotoType;
}) {
  const slot = evidenceSlots.find((item) => item.type === type);

  return Boolean(slot && role === slot.role && uploadableStatuses[type].includes(status));
}

function nextLifecycleAction(status: BookingStatus, role: UserBookingRole) {
  if (status === "confirmed" && role === "lender") {
    return {
      action: "mark_ready" as LifecycleAction,
      helper: "Upload foto kondisi awal sebelum menandai barang siap.",
      label: "Barang siap diserahterimakan",
      requiredEvidenceType: "pre_handover_owner" as EvidencePhotoType,
    };
  }

  if (status === "ready_for_pickup" && role === "renter") {
    return {
      action: "confirm_received" as LifecycleAction,
      helper: "Upload foto kondisi saat diterima sebelum transaksi aktif.",
      label: "Konfirmasi barang diterima",
      requiredEvidenceType: "received_by_renter" as EvidencePhotoType,
    };
  }

  if (status === "active" && role === "renter") {
    return {
      action: "request_return" as LifecycleAction,
      helper: "Upload foto kondisi barang sebelum mengajukan pengembalian.",
      label: "Ajukan pengembalian",
      requiredEvidenceType: "pre_return_renter" as EvidencePhotoType,
    };
  }

  if (status === "return_pending" && role === "lender") {
    return {
      action: "confirm_return_good" as LifecycleAction,
      helper: "Upload foto setelah barang kembali sebelum menyelesaikan transaksi.",
      label: "Konfirmasi barang kembali baik",
      requiredEvidenceType: "post_return_owner" as EvidencePhotoType,
    };
  }

  return null;
}

function PemesananDetailSkeleton() {
  return (
    <PageShell>
      <SiteHeader />
      <PageContainer className="py-8">
        <div className="h-10 w-52 animate-pulse rounded-lg bg-primary-soft" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="h-96 animate-pulse rounded-xl border border-[var(--color-border)] bg-surface-raised shadow-soft" />
          <div className="h-80 animate-pulse rounded-xl border border-[var(--color-border)] bg-surface-raised shadow-soft" />
        </div>
      </PageContainer>
      <MobileBottomNav />
    </PageShell>
  );
}

function statusIndex(status: BookingStatus) {
  const index = timeline.findIndex((item) => item.status === status);
  return index >= 0 ? index : 0;
}

function whatsappHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.startsWith("0") ? `62${digits.slice(1)}` : digits;

  return `https://wa.me/${normalized}`;
}

export default function PemesananDetailPage() {
  const auth = useCurrentUser();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<PemesananDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [selectedEvidenceFiles, setSelectedEvidenceFiles] = useState<
    Partial<Record<EvidencePhotoType, File>>
  >({});
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  const [uploadingEvidenceType, setUploadingEvidenceType] = useState<EvidencePhotoType | null>(
    null,
  );
  const [processingAction, setProcessingAction] = useState<LifecycleAction | null>(null);
  const [lifecycleError, setLifecycleError] = useState<string | null>(null);
  const [isOpeningChat, setIsOpeningChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPemesanan() {
      const token = getStoredToken();

      if (!token) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      const response = await apiRequest<PemesananDetailResponse>(`/bookings/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.success) {
        setDetail(response.data);
      } else {
        setError(response.error);
      }

      setIsLoading(false);
    }

    if (params.id) void loadPemesanan();
  }, [params.id]);

  if (auth.isLoading || isLoading) return <PemesananDetailSkeleton />;

  if (!auth.hasToken) {
    return (
      <PageShell>
        <SiteHeader />
        <PageContainer className="flex min-h-[calc(100vh-180px)] max-w-3xl items-center justify-center py-12">
          <EmptyState
            actionHref="/auth/login"
            actionLabel="Masuk"
            description="Masuk untuk melihat status pemesanan, pembayaran, deposit, dan serah terima."
            icon={UserRound}
            title="Masuk untuk melihat pemesanan"
          />
        </PageContainer>
        <MobileBottomNav />
      </PageShell>
    );
  }

  if (!detail) {
    return (
      <PageShell>
        <SiteHeader />
        <PageContainer className="flex min-h-[calc(100vh-180px)] max-w-3xl items-center justify-center py-12">
          <EmptyState
            actionHref="/dashboard/renter/orders"
            actionLabel="Lihat pesanan"
            description={error ?? "Pemesanan tidak ditemukan atau belum bisa dimuat."}
            icon={PackageOpen}
            title="Pemesanan belum bisa dimuat"
          />
        </PageContainer>
        <MobileBottomNav />
      </PageShell>
    );
  }

  const currentIndex = statusIndex(detail.booking.status);
  const total =
    detail.booking.rentalPrice +
    detail.booking.depositAmount +
    detail.booking.deliveryFee +
    detail.booking.lateFee;
  const isAwaitingPayment = detail.booking.status === "awaiting_payment";
  const isPaymentComplete = Boolean(detail.booking.whatsappUnlockedAt);
  const currentUserRole: UserBookingRole =
    auth.user?.id === detail.owner.id
      ? "lender"
      : auth.user?.id === detail.renter.id
        ? "renter"
        : null;
  const lifecycleAction = nextLifecycleAction(detail.booking.status, currentUserRole);
  const requiredEvidence = lifecycleAction
    ? latestEvidenceByType(detail.evidence, lifecycleAction.requiredEvidenceType)
    : null;
  const ownerWhatsappHref =
    isPaymentComplete && detail.owner.phone ? whatsappHref(detail.owner.phone) : null;

  async function simulatePayment() {
    if (!detail) return;

    const token = getStoredToken();
    const bookingId = detail.booking.id;

    if (!token) {
      setPaymentError("Sesi login tidak ditemukan. Silakan masuk ulang.");
      return;
    }

    setIsSimulatingPayment(true);
    setPaymentError(null);

    const response = await apiRequest<PemesananDetailResponse>(
      `/bookings/${bookingId}/simulate-payment`,
      {
        headers: { Authorization: `Bearer ${token}` },
        method: "POST",
      },
    );

    if (response.success) {
      setDetail(response.data);
    } else {
      setPaymentError(response.error);
    }

    setIsSimulatingPayment(false);
  }

  async function uploadEvidence(type: EvidencePhotoType) {
    if (!detail) return;

    const token = getStoredToken();
    const file = selectedEvidenceFiles[type];

    if (!token) {
      setEvidenceError("Sesi login tidak ditemukan. Silakan masuk ulang.");
      return;
    }

    if (!file) {
      setEvidenceError("Pilih foto bukti dulu.");
      return;
    }

    setUploadingEvidenceType(type);
    setEvidenceError(null);

    const formData = new FormData();
    formData.set("type", type);
    formData.set("photo", file);

    const response = await apiRequest<PemesananDetailResponse>(
      `/bookings/${detail.booking.id}/evidence`,
      {
        body: formData,
        headers: { Authorization: `Bearer ${token}` },
        method: "POST",
      },
    );

    if (response.success) {
      setDetail(response.data);
      setSelectedEvidenceFiles((current) => {
        const next = { ...current };
        delete next[type];
        return next;
      });
    } else {
      setEvidenceError(response.error);
    }

    setUploadingEvidenceType(null);
  }

  async function runLifecycleAction(action: LifecycleAction) {
    if (!detail) return;

    const token = getStoredToken();

    if (!token) {
      setLifecycleError("Sesi login tidak ditemukan. Silakan masuk ulang.");
      return;
    }

    setProcessingAction(action);
    setLifecycleError(null);

    const response = await apiRequest<PemesananDetailResponse>(
      `/bookings/${detail.booking.id}/lifecycle`,
      {
        body: JSON.stringify({ action }),
        headers: { Authorization: `Bearer ${token}` },
        method: "PATCH",
      },
    );

    if (response.success) {
      setDetail(response.data);
    } else {
      setLifecycleError(response.error);
    }

    setProcessingAction(null);
  }

  async function openConversation() {
    if (!detail) return;

    const token = getStoredToken();

    if (!token) {
      setChatError("Sesi login tidak ditemukan. Silakan masuk ulang.");
      return;
    }

    setIsOpeningChat(true);
    setChatError(null);

    const response = await apiRequest<ConversationResponse>("/conversations", {
      body: JSON.stringify({ bookingId: detail.booking.id }),
      headers: { Authorization: `Bearer ${token}` },
      method: "POST",
    });

    if (response.success && response.data) {
      router.push(`/messages/${response.data.conversation.id}`);
    } else {
      setChatError(response.success ? "Percakapan belum bisa dibuka" : response.error);
    }

    setIsOpeningChat(false);
  }

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        backHref="/dashboard/renter/orders"
        backLabel="Pesanan"
        eyebrow="Pemesanan"
        title="Status Pemesanan"
        description="Pantau permintaan, pembayaran, deposit, dan dokumentasi kondisi barang dari satu halaman."
        actions={
          <StatusBadge tone={bookingStatusTone(detail.booking.status)}>
            {bookingStatusLabels[detail.booking.status]}
          </StatusBadge>
        }
      />

      <PageContainer className="grid gap-6 pb-12 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-6">
          <article className="rounded-xl border border-[var(--color-border)] bg-surface-raised p-6 shadow-soft">
            <div className="flex gap-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-surface-sunken">
                {detail.listing.photoUrl ? (
                  <Image alt={detail.listing.title} className="object-cover" fill sizes="96px" src={detail.listing.photoUrl} />
                ) : (
                  <div className="flex h-full items-center justify-center text-primary">
                    <PackageOpen className="h-8 w-8" aria-hidden="true" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h2 className="line-clamp-2 text-xl font-bold text-slate-900">{detail.listing.title}</h2>
                <p className="mt-2 text-sm text-slate-500">{detail.listing.location}</p>
                <p className="mt-2 text-sm text-slate-500">
                  {detail.booking.startDate} sampai {detail.booking.endDate}
                </p>
              </div>
            </div>
          </article>

          <section className="rounded-xl border border-[var(--color-border)] bg-surface-raised p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-slate-900">Timeline transaksi</h2>
            <div className="mt-5 space-y-4">
              {timeline.map((item, index) => {
                const isDone = index < currentIndex;
                const isCurrent = index === currentIndex;

                return (
                  <div className="flex gap-3" key={item.status}>
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                        isDone || isCurrent
                          ? "border-teal-200 bg-primary-light text-primary"
                          : "border-[var(--color-border)] bg-surface text-slate-400"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Clock3 className="h-4 w-4" aria-hidden="true" />
                      )}
                    </span>
                    <div>
                      <p className={`font-semibold ${isCurrent ? "text-primary" : "text-slate-900"}`}>
                        {item.label}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {isCurrent
                          ? "Status pemesanan saat ini."
                          : isDone
                            ? "Tahap ini sudah dilewati."
                            : "Tahap ini akan aktif setelah proses sebelumnya selesai."}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border border-[var(--color-border)] bg-surface-raised p-6 shadow-soft">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Bukti kondisi barang</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Foto ini dipakai sebagai catatan kondisi saat serah terima dan pengembalian.
                </p>
              </div>
              <StatusBadge tone="primary">{detail.evidence.length}/4 foto</StatusBadge>
            </div>

            {evidenceError && (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {evidenceError}
              </p>
            )}

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {evidenceSlots.map((slot) => {
                const evidence = latestEvidenceByType(detail.evidence, slot.type);
                const canUpload = canUploadEvidence({
                  role: currentUserRole,
                  status: detail.booking.status,
                  type: slot.type,
                });
                const file = selectedEvidenceFiles[slot.type];

                return (
                  <div
                    className="rounded-lg border border-[var(--color-border)] bg-surface p-4 text-sm text-slate-500"
                    key={slot.type}
                  >
                    {evidence ? (
                      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-surface-sunken">
                        <Image
                          alt={evidencePhotoTypeLabels[slot.type]}
                          className="object-cover"
                          fill
                          sizes="(min-width: 640px) 320px, 100vw"
                          src={evidence.photoUrl}
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-[var(--color-border-strong)] bg-primary-soft text-primary">
                        <ImageIcon className="h-8 w-8" aria-hidden="true" />
                      </div>
                    )}

                    <div className="mt-4 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {evidencePhotoTypeLabels[slot.type]}
                        </p>
                        <p className="mt-1 leading-6">{slot.description}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {slot.role === "lender" ? "Pemilik" : "Penyewa"}
                      </span>
                    </div>

                    {evidence && (
                      <p className="mt-3 text-xs text-slate-400">
                        Diunggah {new Date(evidence.createdAt).toLocaleString("id-ID")}
                      </p>
                    )}

                    {canUpload && (
                      <div className="mt-4 space-y-3">
                        <label className="block">
                          <span className="text-xs font-semibold uppercase text-slate-500">
                            Pilih foto bukti
                          </span>
                          <input
                            accept="image/jpeg,image/png,image/webp"
                            className="mt-2 block w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-primary-light file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-primary"
                            type="file"
                            onChange={(event) => {
                              const nextFile = event.target.files?.[0];
                              setSelectedEvidenceFiles((current) => ({
                                ...current,
                                [slot.type]: nextFile,
                              }));
                            }}
                          />
                        </label>
                        {file && <p className="text-xs text-slate-500">Dipilih: {file.name}</p>}
                        <button
                          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-soft-sm transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={!file || uploadingEvidenceType === slot.type}
                          type="button"
                          onClick={() => void uploadEvidence(slot.type)}
                        >
                          <UploadCloud className="h-4 w-4" aria-hidden="true" />
                          {uploadingEvidenceType === slot.type ? "Mengunggah..." : "Upload foto"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </section>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-xl border border-[var(--color-border)] bg-surface-raised p-6 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Ringkasan pembayaran</h2>
              <StatusBadge icon={ReceiptText} tone="primary">
                Mode demo
              </StatusBadge>
            </div>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Harga sewa</span>
                <span className="font-semibold text-slate-900">{formatPrice(detail.booking.rentalPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Deposit</span>
                <span className="font-semibold text-slate-900">{formatPrice(detail.booking.depositAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Ongkir</span>
                <span className="font-semibold text-slate-900">{formatPrice(detail.booking.deliveryFee)}</span>
              </div>
              {detail.booking.lateFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Denda terlambat</span>
                  <span className="font-semibold text-slate-900">{formatPrice(detail.booking.lateFee)}</span>
                </div>
              )}
            </div>
            <div className="mt-5 border-t border-[var(--color-border)] pt-5">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-900">Total</span>
                <span className="text-xl font-bold text-primary">{formatPrice(total)}</span>
              </div>
              <p className="mt-2 inline-flex items-start gap-2 text-xs leading-5 text-slate-500">
                <ReceiptText className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                {isAwaitingPayment
                  ? "Tidak ada uang sungguhan yang diproses. Ini simulasi untuk demo alur deposit dan pemesanan."
                  : isPaymentComplete
                    ? "Simulasi pembayaran sudah tercatat. Jadwal terkunci dan deposit ditahan sampai barang kembali sesuai kondisi."
                    : "Pemilik perlu menerima permintaan dulu sebelum masuk tahap pembayaran."}
              </p>
            </div>

            {isAwaitingPayment && (
              <button
                className="mt-5 flex w-full items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white shadow-soft-sm transition-colors hover:bg-primary-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSimulatingPayment}
                type="button"
                onClick={simulatePayment}
              >
                {isSimulatingPayment ? "Memproses simulasi..." : "Bayar sekarang (Simulasi Demo)"}
              </button>
            )}

            {paymentError && (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {paymentError}
              </p>
            )}

            {isPaymentComplete && (
              <div className="mt-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-800">
                <p className="inline-flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Simulasi pembayaran berhasil
                </p>
                <ul className="mt-2 space-y-1">
                  <li>Pembayaran sewa tercatat.</li>
                  <li>Deposit ditahan platform.</li>
                  <li>Kontak pemilik terbuka untuk koordinasi serah terima.</li>
                </ul>
              </div>
            )}

            {lifecycleAction && (
              <div className="mt-5 rounded-lg border border-[var(--color-border)] bg-surface p-4">
                <p className="font-semibold text-slate-900">Langkah berikutnya</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">{lifecycleAction.helper}</p>
                {!requiredEvidence && (
                  <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    Upload {evidencePhotoTypeLabels[lifecycleAction.requiredEvidenceType].toLowerCase()} dulu.
                  </p>
                )}
                <button
                  className="mt-4 flex w-full items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white shadow-soft-sm transition-colors hover:bg-primary-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!requiredEvidence || processingAction === lifecycleAction.action}
                  type="button"
                  onClick={() => void runLifecycleAction(lifecycleAction.action)}
                >
                  {processingAction === lifecycleAction.action ? "Memproses..." : lifecycleAction.label}
                </button>
                {detail.booking.status === "return_pending" && currentUserRole === "lender" && (
                  <button
                    className="mt-3 flex w-full cursor-not-allowed items-center justify-center rounded-lg border border-[var(--color-border)] bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-400"
                    disabled
                    type="button"
                  >
                    Klaim deposit segera tersedia
                  </button>
                )}
              </div>
            )}

            {lifecycleError && (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {lifecycleError}
              </p>
            )}

            <button
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] bg-surface px-5 py-3 text-sm font-semibold text-slate-700 shadow-soft-sm transition-shadow hover:shadow-soft disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isOpeningChat}
              type="button"
              onClick={() => void openConversation()}
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              {isOpeningChat ? "Membuka pesan..." : "Buka pesan transaksi"}
            </button>

            {chatError && (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {chatError}
              </p>
            )}

            {isPaymentComplete ? (
              <div className="mt-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-800">
                <p className="inline-flex items-center gap-2 font-semibold">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  Kontak pemilik terbuka
                </p>
                <p className="mt-1">
                  Pembayaran berhasil. Gunakan kontak ini untuk koordinasi serah terima barang.
                </p>
                {ownerWhatsappHref && (
                  <a
                    className="mt-3 inline-flex rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-800"
                    href={ownerWhatsappHref}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Hubungi pemilik
                  </a>
                )}
              </div>
            ) : (
              <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                <p className="inline-flex items-center gap-2 font-semibold">
                  <Lock className="h-4 w-4" aria-hidden="true" />
                  WhatsApp terkunci
                </p>
                <p className="mt-1">Kontak pemilik baru dibuka setelah pemesanan diterima dan pembayaran berhasil.</p>
              </div>
            )}

            <div className="mt-5 rounded-lg bg-primary-soft p-4 text-sm leading-6 text-slate-600 shadow-inset-soft">
              <p className="inline-flex items-center gap-2 font-semibold text-slate-900">
                <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                Status deposit
              </p>
              <p className="mt-1">
                {detail.deposit?.status === "refunded"
                  ? "Dikembalikan penuh lewat simulasi demo setelah barang dikonfirmasi kembali baik."
                  : detail.deposit
                    ? `${depositStatusLabels[detail.deposit.status]}. Deposit masih mengikuti simulasi demo transaksi.`
                    : "Belum dibayar. Nantinya deposit akan ditahan platform sampai barang kembali."}
              </p>
            </div>

            <Link
              className="mt-5 flex w-full items-center justify-center rounded-lg border border-[var(--color-border)] bg-surface px-5 py-3 text-sm font-semibold text-slate-700 shadow-soft-sm transition-shadow hover:shadow-soft"
              href={`/listing/${detail.listing.id}`}
            >
              Lihat detail barang
            </Link>

            <p className="mt-4 inline-flex items-start gap-2 text-xs leading-5 text-slate-500">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              Metode serah terima: {detail.booking.deliveryMethod === "pickup" ? "Ambil sendiri" : "Dikirim pemilik"}.
            </p>
          </section>
        </aside>
      </PageContainer>
      <MobileBottomNav />
    </PageShell>
  );
}






