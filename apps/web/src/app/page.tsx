import { categories } from "@rentease/shared";
import { Search, ShieldCheck, WalletCards } from "lucide-react";

const featuredListings = [
  {
    title: "Canon EOS 80D",
    location: "Jakarta Selatan",
    price: "Rp 150.000 / hari",
  },
  {
    title: "Stroller Cabin Premium",
    location: "Tangerang",
    price: "Rp 85.000 / hari",
  },
  {
    title: "Tenda Camping 4 Orang",
    location: "Depok",
    price: "Rp 60.000 / hari",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
          <span className="text-xl font-semibold text-teal-800">RentEase</span>
          <nav className="hidden gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="/explore">Explore</a>
            <a href="/dashboard/renter">Penyewa</a>
            <a href="/dashboard/lender">Pemilik</a>
          </nav>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
              P2P Rental Marketplace
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight text-slate-950 md:text-6xl">
              Sewa barang lebih aman, sewakan aset lebih mudah.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Temukan kamera, stroller, alat outdoor, dan kebutuhan fase pendek
              lainnya dengan verifikasi identitas, booking calendar, dan
              transaksi tercatat.
            </p>
            <form className="mt-8 flex max-w-2xl flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-2 sm:flex-row">
              <label className="flex flex-1 items-center gap-3 rounded-md bg-white px-4 py-3 text-slate-500">
                <Search className="h-5 w-5" aria-hidden="true" />
                <input
                  className="w-full bg-transparent text-base outline-none placeholder:text-slate-400"
                  placeholder="Cari kamera, stroller, drone..."
                  type="search"
                />
              </label>
              <button
                className="rounded-md bg-teal-700 px-6 py-3 font-semibold text-white"
                type="submit"
              >
                Cari Barang
              </button>
            </form>
          </div>

          <div className="grid gap-4">
            {featuredListings.map((listing) => (
              <article
                className="rounded-lg border border-slate-200 bg-slate-50 p-5"
                key={listing.title}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950">
                      {listing.title}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {listing.location}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-teal-800">
                    {listing.price}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <ShieldCheck className="h-6 w-6 text-teal-700" aria-hidden="true" />
          <h2 className="mt-4 font-semibold">KYC dan rating</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Profil terverifikasi dan review membantu kedua pihak membangun
            kepercayaan.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <WalletCards className="h-6 w-6 text-teal-700" aria-hidden="true" />
          <h2 className="mt-4 font-semibold">Payment flow</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Midtrans menjadi dasar transaksi digital dan escrow flow untuk MVP.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <Search className="h-6 w-6 text-teal-700" aria-hidden="true" />
          <h2 className="mt-4 font-semibold">Discovery</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Search, filter kategori, lokasi, harga, dan kondisi masuk ke scope
            awal.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <h2 className="text-xl font-semibold text-slate-950">Kategori</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((category) => (
            <span
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              key={category.value}
            >
              {category.label}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
