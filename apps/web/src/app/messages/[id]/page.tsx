"use client";

import { MessageCircle, Send, UserRound } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useCurrentUser } from "../../../components/auth-provider";
import { EmptyState } from "../../../components/feedback";
import { PageContainer, PageHeader, PageShell } from "../../../components/page-layout";
import { MobileBottomNav, SiteHeader } from "../../../components/site-header";
import { apiRequest } from "../../../lib/api";
import { getStoredToken } from "../../../lib/auth-client";
import {
  conversationPartner,
  type MessageItem,
  type MessagesResponse,
  type SendMessageResponse,
} from "../../../lib/messages-ui";

function ThreadSkeleton() {
  return (
    <PageShell>
      <SiteHeader />
      <PageContainer className="py-8">
        <div className="h-10 w-60 animate-pulse rounded-lg bg-primary-soft" />
        <div className="mt-6 h-[520px] animate-pulse rounded-xl border border-[var(--color-border)] bg-surface-raised shadow-soft" />
      </PageContainer>
      <MobileBottomNav />
    </PageShell>
  );
}

export default function MessageThreadPage() {
  const auth = useCurrentUser();
  const params = useParams<{ id: string }>();
  const [detail, setDetail] = useState<MessagesResponse | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadMessages({ silent = false }: { silent?: boolean } = {}) {
      const token = getStoredToken();

      if (!token) {
        setIsLoading(false);
        return;
      }

      if (!silent) setIsLoading(true);
      setError(null);

      const response = await apiRequest<MessagesResponse>(
        `/conversations/${params.id}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.success) {
        setDetail(response.data);
        setMessages(response.data.messages);
      } else if (!silent) {
        setError(response.error);
      }

      if (!silent) setIsLoading(false);
    }

    if (!params.id) return;

    void loadMessages();
    const interval = window.setInterval(() => {
      void loadMessages({ silent: true });
    }, 5000);

    return () => window.clearInterval(interval);
  }, [params.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const token = getStoredToken();
    const trimmed = body.trim();

    if (!token || !trimmed) return;

    setIsSending(true);
    setSendError(null);

    const response = await apiRequest<SendMessageResponse>(
      `/conversations/${params.id}/messages`,
      {
        body: JSON.stringify({ body: trimmed }),
        headers: { Authorization: `Bearer ${token}` },
        method: "POST",
      },
    );

    if (response.success) {
      setMessages(response.data.messages);
      setBody("");
    } else {
      setSendError(response.error);
    }

    setIsSending(false);
  }

  if (auth.isLoading || isLoading) return <ThreadSkeleton />;

  if (!auth.hasToken) {
    return (
      <PageShell>
        <SiteHeader />
        <PageContainer className="flex min-h-[calc(100vh-180px)] max-w-3xl items-center justify-center py-12">
          <EmptyState
            actionHref="/auth/login"
            actionLabel="Masuk"
            description="Masuk untuk membuka percakapan."
            icon={UserRound}
            title="Masuk untuk membuka pesan"
          />
        </PageContainer>
        <MobileBottomNav />
      </PageShell>
    );
  }

  if (error || !detail || !auth.user) {
    return (
      <PageShell>
        <SiteHeader />
        <PageContainer className="flex min-h-[calc(100vh-180px)] max-w-3xl items-center justify-center py-12">
          <EmptyState
            actionHref="/messages"
            actionLabel="Kembali ke pesan"
            description={error ?? "Percakapan tidak ditemukan atau belum bisa dimuat."}
            icon={MessageCircle}
            title="Percakapan belum bisa dimuat"
          />
        </PageContainer>
        <MobileBottomNav />
      </PageShell>
    );
  }

  const partner = conversationPartner(detail.conversation, auth.user.id);

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        backHref="/messages"
        backLabel="Pesan"
        eyebrow="Percakapan"
        title={partner.name}
        description={`Tentang ${detail.conversation.listing.title}. Nomor WhatsApp tetap dibuka setelah pemesanan diterima dan pembayaran berhasil.`}
        actions={
          <Link
            className="rounded-lg border border-[var(--color-border)] bg-surface px-4 py-2 text-sm font-semibold text-slate-700 shadow-soft-sm transition-shadow hover:shadow-soft"
            href={`/listing/${detail.conversation.listing.id}`}
          >
            Lihat barang
          </Link>
        }
      />

      <PageContainer className="pb-12">
        <section className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-surface-raised shadow-soft">
          <div className="max-h-[560px] min-h-[420px] space-y-4 overflow-y-auto bg-surface p-4 sm:p-6">
            {messages.length === 0 ? (
              <div className="flex h-80 items-center justify-center text-center">
                <div>
                  <MessageCircle className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
                  <p className="mt-3 font-semibold text-slate-900">Belum ada pesan</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Tanyakan kondisi, kelengkapan, atau detail serah terima barang.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((item) => {
                const isMine = item.message.senderId === auth.user?.id;

                return (
                  <div className={`flex ${isMine ? "justify-end" : "justify-start"}`} key={item.message.id}>
                    <div
                      className={`max-w-[78%] rounded-xl px-4 py-3 text-sm leading-6 shadow-soft-sm ${
                        isMine ? "bg-primary text-white" : "border border-[var(--color-border)] bg-white text-slate-700"
                      }`}
                    >
                      {!isMine && (
                        <p className="mb-1 text-xs font-semibold text-slate-500">{item.sender.name}</p>
                      )}
                      <p className="whitespace-pre-wrap">{item.message.body}</p>
                      <p className={`mt-2 text-[11px] ${isMine ? "text-teal-50" : "text-slate-400"}`}>
                        {new Date(item.message.createdAt).toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          <form className="border-t border-[var(--color-border)] bg-surface-raised p-4" onSubmit={sendMessage}>
            {sendError && (
              <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {sendError}
              </p>
            )}
            <div className="flex gap-3">
              <label className="sr-only" htmlFor="message-body">
                Tulis pesan
              </label>
              <textarea
                className="min-h-[48px] flex-1 resize-none rounded-lg border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light"
                id="message-body"
                maxLength={1000}
                placeholder="Tulis pesan..."
                rows={1}
                value={body}
                onChange={(event) => setBody(event.target.value)}
              />
              <button
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary text-white shadow-soft-sm transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!body.trim() || isSending}
                type="submit"
                aria-label="Kirim pesan"
              >
                <Send className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </form>
        </section>
      </PageContainer>
      <MobileBottomNav />
    </PageShell>
  );
}
