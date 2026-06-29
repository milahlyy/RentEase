"use client";

import {
  getCategoryLabel,
  type Listing,
  type ListingAvailability,
  type ListingReview,
} from "@rentease/shared";
import {
  BadgeCheck,
  CalendarDays,
  Clock3,
  ImageIcon,
  MessageCircle,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Star,
  Truck,
  WalletCards,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCurrentUser } from "../../../components/auth-provider";
import { ListingCard, ListingCardSkeleton } from "../../../components/listing-card";
import { PageContainer, PageHeader, PageShell } from "../../../components/page-layout";
import { MobileBottomNav, SiteHeader } from "../../../components/site-header";
import { apiRequest } from "../../../lib/api";
import { getStoredToken } from "../../../lib/auth-client";
import type { ConversationResponse } from "../../../lib/messages-ui";

type ListingDetailResponse = {
  listing: Listing;
  unavailableRanges: ListingAvailability[];
};

type ListingsResponse = {
  listings: Listing[];
  total: number;
  page: number;
};

type ListingReviewsResponse = {
  reviews: ListingReview[];
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("id-ID", {
    currency: "IDR",
    maximumFractionDigits: 0,
    style: "currency",
  })
    .format(value)
    .replace("Rp", "Rp ");
}

function conditionLabel(value: number) {
  if (value >= 9) return "Sangat baik";
  if (value >= 7) return "Baik";
  if (value >= 5) return "Cukup baik";
  return "Perlu dicek";
}

function DetailSkeleton() {
  return (
    <PageShell>
      <SiteHeader />
      <PageContainer className="py-8">
        <div className="mb-6 h-8 w-32 animate-pulse rounded bg-surface-sunken" />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-6">
            <div className="aspect-[4/3] animate-pulse rounded-lg bg-surface-sunken" />
            <div className="rounded-lg border border-[var(--color-border)] bg-surface p-6 shadow-soft-sm">
              <div className="h-8 w-4/5 animate-pulse rounded bg-surface-sunken" />
              <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-surface-sunken" />
              <div className="mt-8 space-y-3">
                <div className="h-4 animate-pulse rounded bg-surface-sunken" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-surface-sunken" />
                <div className="h-4 w-3/5 animate-pulse rounded bg-surface-sunken" />
              </div>
            </div>
          </section>
          <aside className="h-80 animate-pulse rounded-lg bg-surface shadow-soft-sm" />
        </div>
      </PageContainer>
      <MobileBottomNav />
    </PageShell>
  );
}

function ErrorState({
  message,
  title,
}: {
  message: string;
  title: string;
}) {
  return (
    <PageShell>
      <SiteHeader />
      <PageContainer className="flex min-h-[calc(100vh-180px)] max-w-3xl items-center justify-center py-12">
        <section className="w-full rounded-lg border border-[var(--color-border)] bg-surface p-8 text-center shadow-soft-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-surface-sunken text-primary-text">
            <ImageIcon className="h-10 w-10" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{message}</p>
          <Link
            className="mt-6 inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white shadow-soft-sm transition-colors hover:bg-primary-hover active:scale-95"
            href="/explore"
          >
            Kembali ke jelajahi
          </Link>
        </section>
      </PageContainer>
      <MobileBottomNav />
    </PageShell>
  );
}

export default function ListingDetailPage() {
  const auth = useCurrentUser();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [unavailableRanges, setUnavailableRanges] = useState<ListingAvailability[]>([]);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
  const [similarListings, setSimilarListings] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<ListingReview[]>([]);
  const [isSimilarLoading, setIsSimilarLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadListing() {
      setIsLoading(true);
      setError(null);

      const response = await apiRequest<ListingDetailResponse>(`/listings/${params.id}`);

      if (response.success) {
        setListing(response.data.listing);
        setUnavailableRanges(response.data.unavailableRanges);
        setSelectedPhotoUrl(
          response.data.listing.photos?.[0]?.url ?? response.data.listing.primaryPhotoUrl,
        );
      } else {
        setListing(null);
        setUnavailableRanges([]);
        setSelectedPhotoUrl(null);
        setError(response.error);
      }

      setIsLoading(false);
    }

    if (params.id) {
      void loadListing();
    }
  }, [params.id]);

  useEffect(() => {
    async function loadSimilarListings() {
      if (!listing) return;

      setIsSimilarLoading(true);
      const response = await apiRequest<ListingsResponse>(
        `/listings?category=${listing.category}&limit=5`,
      );

      if (response.success) {
        setSimilarListings(
          response.data.listings.filter((item) => item.id !== listing.id).slice(0, 4),
        );
      }

      setIsSimilarLoading(false);
    }

    void loadSimilarListings();
  }, [listing]);

  useEffect(() => {
    async function loadReviews() {
      if (!listing) return;

      const response = await apiRequest<ListingReviewsResponse>(`/listings/${listing.id}/reviews`);

      if (response.success) {
        setReviews(response.data.reviews);
      }
    }

    void loadReviews();
  }, [listing]);

  const photos = useMemo(() => {
    if (!listing) return [];
    if (listing.photos?.length) return listing.photos;
    if (listing.primaryPhotoUrl) {
      return [
        {
          id: `${listing.id}-primary`,
          isPrimary: true,
          order: 1,
          url: listing.primaryPhotoUrl,
        },
      ];
    }
    return [];
  }, [listing]);

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (!listing) {
    return (
      <ErrorState
        title={error === "Listing tidak ditemukan" ? "Barang tidak ditemukan" : "Barang belum bisa dimuat"}
        message={
          error === "Listing tidak ditemukan"
            ? "Barang ini mungkin sudah tidak tersedia atau tautannya salah."
            : error ?? "Coba lagi beberapa saat lagi atau kembali ke halaman jelajahi."
        }
      />
    );
  }

  const mainPhoto = selectedPhotoUrl ?? photos[0]?.url ?? listing.primaryPhotoUrl;
  const nextUnavailableRange = unavailableRanges[0];
  const isOwner = auth.user?.id === listing.ownerId;

  async function startConversation() {
    if (!listing) return;

    const listingId = listing.id;
    const token = getStoredToken();

    if (!token) {
      router.push(`/auth/login`);
      return;
    }

    setIsStartingChat(true);
    setChatError(null);

    const response = await apiRequest<ConversationResponse>("/conversations", {
      body: JSON.stringify({ listingId }),
      headers: { Authorization: `Bearer ${token}` },
      method: "POST",
    });

    if (response.success && response.data) {
      router.push(`/messages/${response.data.conversation.id}`);
    } else {
      setChatError(response.success ? "Percakapan belum bisa dibuka" : response.error);
    }

    setIsStartingChat(false);
  }

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        backHref="/explore"
        backLabel="Jelajahi"
        title="Detail barang"
      />

      <PageContainer className="pb-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className="space-y-6">
            <div className="rounded-lg border border-[var(--color-border)] bg-surface p-3 shadow-soft-sm">
              <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-surface-sunken">
                {mainPhoto ? (
                  <Image
                    alt={listing.title}
                    className="object-cover"
                    fill
                    priority
                    sizes="(min-width: 1024px) 60vw, 100vw"
                    src={mainPhoto}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-primary-text">
                    <ImageIcon className="h-14 w-14" aria-hidden="true" />
                  </div>
                )}
                {photos.length > 1 && (
                  <span className="absolute bottom-4 right-4 rounded-md bg-slate-900/80 px-3 py-1 text-xs font-semibold text-white">
                    {photos.findIndex((photo) => photo.url === mainPhoto) + 1 || 1}/{photos.length}
                  </span>
                )}
              </div>
              {photos.length > 1 && (
                <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-6">
                  {photos.slice(0, 8).map((photo) => (
                    <button
                      className={`relative aspect-square overflow-hidden rounded-md border bg-surface-sunken ${
                        photo.url === mainPhoto ? "border-primary ring-2 ring-primary-light" : "border-transparent"
                      }`}
                      key={photo.id}
                      type="button"
                      onClick={() => setSelectedPhotoUrl(photo.url)}
                    >
                      <Image
                        alt={`${listing.title} foto ${photo.order}`}
                        className="object-cover"
                        fill
                        sizes="120px"
                        src={photo.url}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <article className="rounded-lg border border-[var(--color-border)] bg-surface p-6 shadow-soft-sm">
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <span>{getCategoryLabel(listing.category)}</span>
                <span aria-hidden="true">-</span>
                {listing.rating > 0 ? (
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                    {listing.rating.toFixed(1)} ({listing.reviewCount} ulasan)
                  </span>
                ) : (
                  <span className="rounded-md border border-[var(--color-border)] bg-surface-sunken px-2 py-0.5 text-xs font-medium text-slate-600">
                    Baru
                  </span>
                )}
                <span aria-hidden="true">-</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  {listing.location}
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-bold leading-tight text-slate-900">
                {listing.title}
              </h1>
              <p className="mt-3 text-3xl font-bold text-primary">
                {formatPrice(listing.pricePerDay)} <span className="text-base font-semibold text-slate-500">/ hari</span>
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-md border border-[var(--color-border)] bg-surface p-4">
                  <p className="text-xs font-medium uppercase text-primary-text">Kondisi</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {conditionLabel(listing.condition)} ({listing.condition}/10)
                  </p>
                </div>
                <div className="rounded-md border border-[var(--color-border)] bg-surface p-4">
                  <p className="text-xs font-medium uppercase text-primary-text">Serah terima</p>
                  <p className="mt-1 inline-flex items-center gap-1 font-semibold text-slate-900">
                    <Truck className="h-4 w-4 text-primary" aria-hidden="true" />
                    Pickup / kirim
                  </p>
                </div>
                <div className="rounded-md border border-[var(--color-border)] bg-surface p-4">
                  <p className="text-xs font-medium uppercase text-primary-text">Deposit</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {formatPrice(listing.depositAmount)}
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <h2 className="text-xl font-semibold text-slate-900">Deskripsi barang</h2>
                <p className="mt-3 text-base leading-7 text-slate-600">{listing.description}</p>
              </div>
            </article>

            <section className="rounded-lg border border-[var(--color-border)] bg-surface p-6 shadow-soft-sm">
              <h2 className="text-xl font-semibold text-slate-900">Pemilik barang</h2>
              <div className="mt-4 flex items-start gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-primary-light text-xl font-bold text-primary-text">
                  {listing.owner.name.charAt(0)}
                </span>
                <div>
                  <p className="text-base font-semibold text-slate-900">
                    {listing.owner.name}
                    {listing.owner.isVerified && (
                      <BadgeCheck
                        className="ml-1 inline-block h-4 w-4 text-green-500"
                        aria-label="Terverifikasi"
                      />
                    )}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {listing.rating > 0
                      ? `${listing.rating.toFixed(1)} nilai - ${listing.reviewCount} ulasan`
                      : "Pemilik baru di RentEase"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Verifikasi identitas, rating, dan riwayat transaksi membantu menjaga sewa tetap
                    jelas dan terdokumentasi.
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-md border border-[var(--color-border)] bg-surface p-3">
                      <p className="text-xs font-semibold text-slate-500">Identitas</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {listing.owner.isVerified ? "Terverifikasi" : "Belum diverifikasi"}
                      </p>
                    </div>
                    <div className="rounded-md border border-[var(--color-border)] bg-surface p-3">
                      <p className="text-xs font-semibold text-slate-500">Respons</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">Lewat WhatsApp</p>
                    </div>
                    <div className="rounded-md border border-[var(--color-border)] bg-surface p-3">
                      <p className="text-xs font-semibold text-slate-500">Transaksi</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {listing.reviewCount > 0 ? `${listing.reviewCount} ulasan` : "Baru mulai"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-[var(--color-border)] bg-surface p-6 shadow-soft-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Ulasan penyewa</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Pengalaman penyewa sebelumnya dengan barang dan pemilik ini.
                  </p>
                </div>
                {listing.reviewCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                    {listing.rating.toFixed(1)}
                  </span>
                )}
              </div>

              {reviews.length === 0 ? (
                <div className="mt-5 rounded-md border border-dashed border-[var(--color-border-strong)] bg-surface-sunken p-5 text-sm text-slate-500">
                  Belum ada ulasan untuk barang ini.
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {reviews.map((review) => (
                    <article
                      className="rounded-md border border-[var(--color-border)] bg-surface p-4"
                      key={review.id}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-slate-900">{review.reviewerName}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            {new Date(review.createdAt).toLocaleDateString("id-ID")}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                          {review.rating}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="mt-3 text-sm leading-6 text-slate-600">{review.comment}</p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-lg border border-[var(--color-border)] bg-surface p-6 shadow-soft-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Barang serupa</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Barang lain di kategori {getCategoryLabel(listing.category)}.
                  </p>
                </div>
                <Link
                  className="text-sm font-semibold text-primary"
                  href={`/explore?category=${listing.category}`}
                >
                  Lihat semua
                </Link>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {isSimilarLoading
                  ? Array.from({ length: 4 }).map((_, index) => <ListingCardSkeleton key={index} />)
                  : similarListings.length > 0
                    ? similarListings.map((item) => <ListingCard listing={item} key={item.id} />)
                    : (
                        <p className="rounded-md border border-[var(--color-border)] bg-surface-sunken p-4 text-sm text-slate-500 sm:col-span-2 xl:col-span-4">
                          Belum ada barang serupa yang aktif.
                        </p>
                      )}
              </div>
            </section>
          </section>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <section className="rounded-lg border border-[var(--color-border)] bg-surface p-5 shadow-soft-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary-light text-lg font-bold text-primary-text">
                  {listing.owner.name.charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {listing.owner.name}
                    {listing.owner.isVerified && (
                      <BadgeCheck
                        className="ml-1 inline-block h-4 w-4 text-green-500"
                        aria-label="Terverifikasi"
                      />
                    )}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {listing.rating > 0 ? `${listing.rating.toFixed(1)} nilai dari pemilik` : "Pemilik baru"}
                  </p>
                </div>
              </div>

              <div className="mt-5 border-t border-[var(--color-border)] pt-5">
                <p className="text-sm text-slate-500">Mulai dari</p>
              <p className="mt-1 text-3xl font-bold text-primary">
                {formatPrice(listing.pricePerDay)}
              </p>
              <p className="text-sm text-slate-500">per hari</p>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between rounded-md border border-[var(--color-border)] bg-surface p-3">
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                    <WalletCards className="h-4 w-4 text-primary" aria-hidden="true" />
                    Deposit
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    {formatPrice(listing.depositAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-[var(--color-border)] bg-surface p-3">
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                    <PackageCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                    Kondisi
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    {conditionLabel(listing.condition)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-[var(--color-border)] bg-surface p-3">
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                    <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
                    Tanggal tidak tersedia
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    {unavailableRanges.length}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-[var(--color-border)] bg-surface p-3">
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                    <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                    Dana platform
                  </span>
                  <span className="text-sm font-semibold text-slate-900">Tertahan aman</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-[var(--color-border)] bg-surface px-5 py-3 text-sm font-semibold text-slate-700 shadow-soft-sm transition-shadow hover:shadow-soft disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isOwner || isStartingChat}
                  type="button"
                  onClick={() => void startConversation()}
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  {isStartingChat ? "Membuka pesan..." : "Tanya pemilik"}
                </button>
                <Link
                  className="flex w-full items-center justify-center rounded-md bg-primary px-5 py-3 text-sm font-semibold text-white shadow-soft-sm transition-colors hover:bg-primary-hover active:scale-95"
                  href={`/booking/new?listingId=${listing.id}`}
                >
                  Ajukan pemesanan
                </Link>
              </div>

              {chatError && (
                <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {chatError}
                </p>
              )}

              <div className="mt-4 rounded-md border border-[var(--color-border)] bg-surface-sunken p-4 text-sm leading-6 text-slate-600">
                <p className="font-semibold text-slate-900">Ketersediaan</p>
                {nextUnavailableRange ? (
                  <p className="mt-1">
                    Jadwal terdekat yang tidak tersedia: {nextUnavailableRange.startDate} sampai{" "}
                    {nextUnavailableRange.endDate}.
                  </p>
                ) : (
                  <p className="mt-1">Belum ada tanggal yang diblokir untuk barang ini.</p>
                )}
              </div>

              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                <p className="inline-flex items-center gap-2 font-semibold">
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Kontak pemilik terkunci
                </p>
                <p className="mt-1">
                  Tanya pemilik lewat pesan internal dulu. WhatsApp baru dibuka setelah pemesanan
                  diterima dan pembayaran berhasil.
                </p>
              </div>

              <p className="mt-4 inline-flex items-center gap-2 text-xs text-slate-500">
                <Clock3 className="h-4 w-4" aria-hidden="true" />
                Deposit dikembalikan setelah barang kembali sesuai kondisi.
              </p>
            </section>
          </aside>
        </div>
      </PageContainer>
      <MobileBottomNav />
    </PageShell>
  );
}
