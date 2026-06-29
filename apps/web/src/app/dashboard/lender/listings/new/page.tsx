"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { categories } from "@rentease/shared";
import { ArrowLeft, Camera, ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  DashboardErrorState,
  DashboardLockedState,
  DashboardPageSkeleton,
  useDashboardAuth,
} from "../../../../../components/dashboard-auth";
import { PageContainer, PageHeader, PageShell } from "../../../../../components/page-layout";
import { MobileBottomNav, SiteHeader } from "../../../../../components/site-header";
import { apiRequest } from "../../../../../lib/api";
import { getStoredToken } from "../../../../../lib/auth-client";

const createListingSchema = z.object({
  title: z.string().trim().min(3, "Nama barang minimal 3 karakter"),
  category: z.string().min(1, "Kategori wajib dipilih"),
  description: z.string().trim().min(10, "Deskripsi minimal 10 karakter"),
  condition: z.coerce.number().int().min(1, "Minimal 1").max(10, "Maksimal 10"),
  pricePerDay: z.coerce.number().int().positive("Harga harus lebih dari 0"),
  depositAmount: z.coerce.number().int().min(0, "Deposit tidak boleh negatif"),
  location: z.string().trim().min(2, "Lokasi wajib diisi"),
});

type CreateListingFormValues = z.infer<typeof createListingSchema>;

type CreateListingResponse = {
  id: string;
  status: "draft";
};

type UploadedPhoto = {
  key: string;
  url: string;
  contentType: string;
  size: number;
};

type UploadResponse = {
  photos: UploadedPhoto[];
};

type PhotoDraft = {
  id: string;
  file: File;
  previewUrl: string;
};

const maxPhotos = 8;
const maxPhotoSize = 5 * 1024 * 1024;
const acceptedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-600">{message}</p>;
}

export default function NewListingPage() {
  const auth = useDashboardAuth();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const photosRef = useRef<PhotoDraft[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<PhotoDraft[]>([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<CreateListingFormValues>({
    resolver: zodResolver(createListingSchema),
    defaultValues: {
      category: "",
      condition: 8,
      depositAmount: 0,
      description: "",
      location: "",
      pricePerDay: 0,
      title: "",
    },
  });

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(() => {
    return () => {
      photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    };
  }, []);

  function addPhotos(files: FileList | File[]) {
    const incoming = Array.from(files);

    if (incoming.length === 0) return;

    const availableSlots = maxPhotos - photos.length;

    if (availableSlots <= 0) {
      setPhotoError(`Maksimal ${maxPhotos} foto per barang.`);
      return;
    }

    const accepted: PhotoDraft[] = [];

    for (const file of incoming.slice(0, availableSlots)) {
      if (!acceptedImageTypes.has(file.type)) {
        setPhotoError("Format foto harus JPG, PNG, atau WebP.");
        return;
      }

      if (file.size > maxPhotoSize) {
        setPhotoError("Ukuran tiap foto maksimal 5MB.");
        return;
      }

      accepted.push({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    setPhotoError(null);
    setPhotos((current) => [...current, ...accepted]);
  }

  function removePhoto(id: string) {
    setPhotos((current) => {
      const removed = current.find((photo) => photo.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);

      return current.filter((photo) => photo.id !== id);
    });
  }

  function makePrimary(id: string) {
    setPhotos((current) => {
      const selected = current.find((photo) => photo.id === id);
      if (!selected) return current;

      return [selected, ...current.filter((photo) => photo.id !== id)];
    });
  }

  async function uploadPhotos(token: string) {
    const formData = new FormData();

    photos.forEach((photo) => {
      formData.append("photos", photo.file);
    });

    return apiRequest<UploadResponse>("/uploads/listing-photos", {
      body: formData,
      headers: { Authorization: `Bearer ${token}` },
      method: "POST",
    });
  }

  async function onSubmit(values: CreateListingFormValues) {
    const token = getStoredToken();

    if (!token) {
      setFormError("Sesi login tidak ditemukan. Silakan masuk ulang.");
      return;
    }

    if (photos.length === 0) {
      setPhotoError("Pilih minimal 1 foto barang.");
      return;
    }

    setFormError(null);
    setPhotoError(null);
    setIsUploadingPhotos(true);

    const uploadResponse = await uploadPhotos(token);
    setIsUploadingPhotos(false);

    if (!uploadResponse.success) {
      setPhotoError(uploadResponse.error);
      return;
    }

    const response = await apiRequest<CreateListingResponse>("/listings", {
      body: JSON.stringify({
        ...values,
        photoUrls: uploadResponse.data.photos.map((photo) => photo.url),
      }),
      headers: { Authorization: `Bearer ${token}` },
      method: "POST",
    });

    if (!response.success) {
      setFormError(response.error);
      return;
    }

    router.push("/dashboard/lender/listings");
  }

  if (auth.isLoading) return <DashboardPageSkeleton />;
  if (!auth.hasToken) return <DashboardLockedState />;
  if (auth.error || !auth.user) {
    return <DashboardErrorState message={auth.error ?? "Coba lagi beberapa saat lagi."} />;
  }

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        backHref="/dashboard/lender/listings"
        backLabel="Barang Sewaan"
        eyebrow="Pemilik"
        title="Tambah Barang"
        description="Upload foto asli barang, isi detail sewa, lalu simpan sebagai draf sebelum diterbitkan."
      />

      <PageContainer className="pb-12">
        <form
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
          onSubmit={handleSubmit(onSubmit)}
        >
          <section className="rounded-xl border border-[var(--color-border)] bg-surface-raised p-6 shadow-soft">
            <div className="grid gap-5">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Foto barang <span className="text-red-600">*</span>
                  </label>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Upload 1-8 foto. Foto pertama akan menjadi foto utama di Jelajahi.
                  </p>
                </div>
                <button
                  className="flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-border-strong)] bg-surface p-6 text-center transition-colors hover:border-primary hover:bg-primary-soft"
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    addPhotos(event.dataTransfer.files);
                  }}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-light text-primary-text shadow-inset-soft">
                    <ImagePlus className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <span className="mt-3 text-sm font-semibold text-slate-900">
                    Pilih atau tarik foto ke sini
                  </span>
                  <span className="mt-1 text-xs text-slate-500">JPG, PNG, atau WebP maksimal 5MB</span>
                </button>
                <input
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  multiple
                  ref={inputRef}
                  type="file"
                  onChange={(event) => {
                    if (event.target.files) addPhotos(event.target.files);
                    event.target.value = "";
                  }}
                />
                {photoError && <p className="text-xs text-red-600">{photoError}</p>}
                {photos.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {photos.map((photo, index) => (
                      <div
                        className="group relative aspect-square overflow-hidden rounded-lg border border-[var(--color-border)] bg-surface-sunken"
                        key={photo.id}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- Blob preview cannot be optimized before upload. */}
                        <img
                          alt={`Preview foto ${index + 1}`}
                          className="h-full w-full object-cover"
                          src={photo.previewUrl}
                        />
                        <div className="absolute inset-x-2 top-2 flex items-center justify-between gap-2">
                          <button
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold shadow-soft-sm ${
                              index === 0
                                ? "bg-primary text-white"
                                : "bg-white/90 text-slate-700 hover:bg-primary-light"
                            }`}
                            type="button"
                            onClick={() => makePrimary(photo.id)}
                          >
                            <Star className="h-3 w-3" aria-hidden="true" />
                            {index === 0 ? "Utama" : "Utama"}
                          </button>
                          <button
                            className="rounded-full bg-white/90 p-1.5 text-red-700 shadow-soft-sm hover:bg-red-50"
                            type="button"
                            aria-label="Hapus foto"
                            onClick={() => removePhoto(photo.id)}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700" htmlFor="title">
                  Nama barang <span className="text-red-600">*</span>
                </label>
                <input
                  className="w-full rounded-lg border border-[var(--color-border)] bg-surface px-3 py-2.5 text-sm outline-none shadow-inset-soft placeholder:text-slate-400 focus:border-primary"
                  id="title"
                  placeholder="contoh: Kamera Canon EOS M50"
                  {...register("title")}
                />
                <FieldError message={errors.title?.message} />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700" htmlFor="category">
                    Kategori <span className="text-red-600">*</span>
                  </label>
                  <select
                    className="w-full rounded-lg border border-[var(--color-border)] bg-surface px-3 py-2.5 text-sm outline-none shadow-inset-soft focus:border-primary"
                    id="category"
                    {...register("category")}
                  >
                    <option value="">Pilih kategori</option>
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  <FieldError message={errors.category?.message} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700" htmlFor="condition">
                    Kondisi barang 1-10 <span className="text-red-600">*</span>
                  </label>
                  <input
                    className="w-full rounded-lg border border-[var(--color-border)] bg-surface px-3 py-2.5 text-sm outline-none shadow-inset-soft placeholder:text-slate-400 focus:border-primary"
                    id="condition"
                    max={10}
                    min={1}
                    type="number"
                    {...register("condition")}
                  />
                  <FieldError message={errors.condition?.message} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700" htmlFor="description">
                  Deskripsi <span className="text-red-600">*</span>
                </label>
                <textarea
                  className="min-h-32 w-full rounded-lg border border-[var(--color-border)] bg-surface px-3 py-2.5 text-sm outline-none shadow-inset-soft placeholder:text-slate-400 focus:border-primary"
                  id="description"
                  placeholder="Jelaskan kelengkapan, aturan pakai, dan kondisi barang."
                  {...register("description")}
                />
                <FieldError message={errors.description?.message} />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700" htmlFor="pricePerDay">
                    Harga per hari <span className="text-red-600">*</span>
                  </label>
                  <input
                    className="w-full rounded-lg border border-[var(--color-border)] bg-surface px-3 py-2.5 text-sm outline-none shadow-inset-soft placeholder:text-slate-400 focus:border-primary"
                    id="pricePerDay"
                    inputMode="numeric"
                    type="number"
                    {...register("pricePerDay")}
                  />
                  <FieldError message={errors.pricePerDay?.message} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700" htmlFor="depositAmount">
                    Deposit <span className="text-red-600">*</span>
                  </label>
                  <input
                    className="w-full rounded-lg border border-[var(--color-border)] bg-surface px-3 py-2.5 text-sm outline-none shadow-inset-soft placeholder:text-slate-400 focus:border-primary"
                    id="depositAmount"
                    inputMode="numeric"
                    type="number"
                    {...register("depositAmount")}
                  />
                  <FieldError message={errors.depositAmount?.message} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700" htmlFor="location">
                  Lokasi <span className="text-red-600">*</span>
                </label>
                <input
                  className="w-full rounded-lg border border-[var(--color-border)] bg-surface px-3 py-2.5 text-sm outline-none shadow-inset-soft placeholder:text-slate-400 focus:border-primary"
                  id="location"
                  placeholder="contoh: Jakarta Selatan"
                  {...register("location")}
                />
                <FieldError message={errors.location?.message} />
              </div>

            </div>
          </section>

          <aside className="space-y-4">
            <section className="rounded-xl border border-[var(--color-border)] bg-surface-raised p-6 shadow-soft">
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-light text-primary-text shadow-inset-soft">
                <Camera className="h-6 w-6" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-slate-900">Status awal: Draf</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Barang baru tidak langsung tampil di Jelajahi. Terbitkan dari halaman barang sewaan
                setelah detailnya sudah siap.
              </p>

              {formError && (
                <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                </p>
              )}

              <button
                className="mt-5 flex w-full items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white shadow-soft-sm transition-colors hover:bg-primary-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting || isUploadingPhotos}
                type="submit"
              >
                {(isSubmitting || isUploadingPhotos) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isUploadingPhotos ? "Mengunggah foto..." : "Simpan draf"}
              </button>
              <Link
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] bg-surface px-5 py-3 text-sm font-semibold text-slate-700 shadow-soft-sm transition-shadow hover:shadow-soft"
                href="/dashboard/lender/listings"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Batal
              </Link>
            </section>
          </aside>
        </form>
      </PageContainer>
      <MobileBottomNav />
    </PageShell>
  );
}



