import type { Listing } from "@rentease/shared";
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
      className={`block rounded-lg border border-[var(--color-border)] bg-white p-3 transition-shadow duration-150 hover:shadow-md ${className}`}
      href={`/listing/${listing.id}`}
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
        {listing.primaryPhotoUrl ? (
          <Image
            alt={listing.title}
            className="object-cover"
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            src={listing.primaryPhotoUrl}
          />
        ) : (
          <div className="h-full w-full bg-slate-100" />
        )}
        <span className="absolute left-3 top-3 rounded-md border border-blue-200 bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
          {listing.category}
        </span>
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-6 text-slate-900">
          {listing.title}
        </h3>
        <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
          {listing.rating > 0 ? (
            <>
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
              <span>
                {listing.rating.toFixed(1)} · ({listing.reviewCount} ulasan)
              </span>
            </>
          ) : (
            <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              Baru
            </span>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-600">
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
        <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{listing.location}</span>
        </div>
        <p className="mt-4 text-lg font-bold text-primary">
          {formatPrice(listing.pricePerDay)} / hari
        </p>
      </div>
    </Link>
  );
}

export function ListingCardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-lg border border-[var(--color-border)] bg-white p-3 ${className}`}
    >
      <div className="aspect-square animate-pulse rounded-xl bg-slate-200" />
      <div className="p-3">
        <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-slate-100" />
        <div className="mt-3 h-6 w-2/3 animate-pulse rounded bg-slate-100" />
        <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-slate-100" />
        <div className="mt-4 h-5 w-3/5 animate-pulse rounded bg-slate-200" />
      </div>
    </div>
  );
}
