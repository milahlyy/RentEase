"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest } from "../../../lib/api";
import { setStoredToken } from "../../../lib/auth-client";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Nama lengkap minimal 2 karakter"),
  email: z.string().trim().email("Format email tidak valid"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
  phone: z.string().trim().min(8, "Nomor telepon minimal 8 karakter"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

type RegisterResponse = {
  token: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    setFormError(null);
    const response = await apiRequest<RegisterResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(values),
    });

    if (!response.success) {
      setFormError(response.error);
      return;
    }

    setStoredToken(response.data.token);
    router.push("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg-subtle)] px-4 py-12">
      <section className="w-full max-w-md">
        <Link className="mx-auto mb-6 block text-center text-2xl font-bold text-primary" href="/">
          RentEase
        </Link>
        <div className="rounded-xl border border-[var(--color-border)] bg-surface-raised p-6 shadow-soft">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900">Daftar</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Buat akun untuk mulai menyewa atau menyewakan barang.
            </p>
          </div>

          <button
            className="flex w-full items-center justify-center rounded-lg border border-[var(--color-border)] bg-surface px-4 py-3 text-sm font-semibold text-slate-700 shadow-soft-sm transition-shadow hover:shadow-soft active:scale-95"
            type="button"
          >
            Lanjutkan dengan Google
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--color-border)]" />
            <span className="text-xs font-medium uppercase text-slate-400">
              atau daftar dengan email
            </span>
            <div className="h-px flex-1 bg-[var(--color-border)]" />
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="name">
                Nama lengkap <span className="text-red-600">*</span>
              </label>
              <input
                className={`w-full rounded-lg border bg-surface px-3 py-2.5 text-sm outline-none shadow-inset-soft transition-colors placeholder:text-slate-400 focus:border-primary ${
                  errors.name ? "border-red-500" : "border-[var(--color-border)]"
                }`}
                id="name"
                placeholder="contoh: Rendy Saputra"
                type="text"
                {...register("name")}
              />
              {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="email">
                Email <span className="text-red-600">*</span>
              </label>
              <input
                className={`w-full rounded-lg border bg-surface px-3 py-2.5 text-sm outline-none shadow-inset-soft transition-colors placeholder:text-slate-400 focus:border-primary ${
                  errors.email ? "border-red-500" : "border-[var(--color-border)]"
                }`}
                id="email"
                placeholder="nama@email.com"
                type="email"
                {...register("email")}
              />
              {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="phone">
                Nomor telepon <span className="text-red-600">*</span>
              </label>
              <input
                className={`w-full rounded-lg border bg-surface px-3 py-2.5 text-sm outline-none shadow-inset-soft transition-colors placeholder:text-slate-400 focus:border-primary ${
                  errors.phone ? "border-red-500" : "border-[var(--color-border)]"
                }`}
                id="phone"
                placeholder="081234567890"
                type="tel"
                {...register("phone")}
              />
              {errors.phone && <p className="text-xs text-red-600">{errors.phone.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="password">
                Kata sandi <span className="text-red-600">*</span>
              </label>
              <input
                className={`w-full rounded-lg border bg-surface px-3 py-2.5 text-sm outline-none shadow-inset-soft transition-colors placeholder:text-slate-400 focus:border-primary ${
                  errors.password ? "border-red-500" : "border-[var(--color-border)]"
                }`}
                id="password"
                placeholder="Minimal 8 karakter"
                type="password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            {formError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {formError}
              </p>
            )}

            <button
              className="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white shadow-soft-sm transition-colors hover:bg-primary-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Daftar
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Sudah punya akun?{" "}
            <Link className="font-semibold text-primary hover:text-primary-hover" href="/auth/login">
              Masuk
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
