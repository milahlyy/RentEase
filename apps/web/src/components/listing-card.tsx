import { getCategoryLabel, type Listing } from "@rentease/shared";
import { BadgeCheck, MapPin, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

function formatPrice(value: number) {
  return new Intl.NumberFormat("id-ID", {
    currency: "IDR",
    maximumFractionDigits: 0,
    style: "currency",
  })
    .format(value)
    .replace("Rp", "Rp ");
}

export function ListingCard({
  className = "",
  listing,
}: {
  className?: string;
  listing: Listing;
}) {
  return (
    <Link
      className={`group block overflow-hidden rounded-lg border border-[var(--color-border)] bg-surface transition duration-150 hover:border-[var(--color-border-strong)] hover:shadow-soft-sm ${className}`}
      href={`/listing/${listing.id}`}
    >
      <div className="relative aspect-square overflow-hidden bg-surface-sunken">
        {listing.primaryPhotoUrl ? (
          <Image
            alt={listing.title}
            className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            src={listing.primaryPhotoUrl}
          />
        ) : (
          <div className="h-full w-full bg-surface-sunken" />
        )}
      </div>
      <div className="p-3">
        <p className="mb-1 text-xs text-slate-500">{getCategoryLabel(listing.category)}</p>
        <h3 className="line-clamp-2 min-h-[40px] text-sm font-semibold leading-5 text-slate-900">
          {listing.title}
        </h3>
        <p className="mt-2 text-lg font-bold text-primary">
          {formatPrice(listing.pricePerDay)} <span className="text-sm font-semibold text-slate-500">/ hari</span>
        </p>
        <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
          {listing.rating > 0 ? (
            <>
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
              <span>
                {listing.rating.toFixed(1)} ({listing.reviewCount} ulasan)
              </span>
            </>
          ) : (
            <span className="rounded-md border border-[var(--color-border)] bg-surface-sunken px-2 py-0.5 text-xs font-medium text-slate-600">
              Baru
            </span>
          )}
        </div>
        <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{listing.location}</span>
        </div>
        <div className="mt-3 flex items-center gap-2 border-t border-[var(--color-border)] pt-3 text-xs text-slate-500">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-light font-semibold text-primary-text">
            {listing.owner.name.charAt(0)}
          </span>
          <span className="truncate">
            {listing.owner.name}
            {listing.owner.isVerified && (
              <BadgeCheck
                className="ml-1 inline-block h-4 w-4 text-green-500"
                aria-label="Terverifikasi"
              />
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ListingCardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-[var(--color-border)] bg-surface ${className}`}
    >
      <div className="aspect-square animate-pulse bg-surface-sunken" />
      <div className="p-3">
        <div className="h-3 w-1/3 animate-pulse rounded bg-surface-sunken" />
        <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-surface-sunken" />
        <div className="mt-2 h-5 w-2/3 animate-pulse rounded bg-surface-sunken" />
        <div className="mt-3 h-3 w-1/2 animate-pulse rounded bg-surface-sunken" />
        <div className="mt-3 h-px bg-[var(--color-border)]" />
        <div className="mt-3 h-6 w-2/3 animate-pulse rounded bg-surface-sunken" />
      </div>
    </div>
  );
}
