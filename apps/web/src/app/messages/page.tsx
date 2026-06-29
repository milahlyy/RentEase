"use client";

import { MessageCircle, PackageOpen, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCurrentUser } from "../../components/auth-provider";
import { EmptyState, StatusBadge } from "../../components/feedback";
import { PageContainer, PageHeader, PageShell } from "../../components/page-layout";
import { MobileBottomNav, SiteHeader } from "../../components/site-header";
import { apiRequest } from "../../lib/api";
import { getStoredToken } from "../../lib/auth-client";
import {
  conversationPartner,
  type ConversationSummary,
  type ConversationsResponse,
} from "../../lib/messages-ui";

function MessagesSkeleton() {
  return (
    <PageShell>
      <SiteHeader />
      <PageContainer className="py-8">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-primary-soft" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              className="h-24 animate-pulse rounded-xl border border-[var(--color-border)] bg-surface-raised shadow-soft"
              key={index}
            />
          ))}
        </div>
      </PageContainer>
      <MobileBottomNav />
    </PageShell>
  );
}

export default function MessagesPage() {
  const auth = useCurrentUser();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadConversations() {
      const token = getStoredToken();

      if (!token) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      const response = await apiRequest<ConversationsResponse>("/conversations", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.success) {
        setConversations(response.data.conversations);
      } else {
        setError(response.error);
      }

      setIsLoading(false);
    }

    void loadConversations();
  }, []);

  if (auth.isLoading || isLoading) return <MessagesSkeleton />;

  if (!auth.hasToken) {
    return (
      <PageShell>
        <SiteHeader />
        <PageContainer className="flex min-h-[calc(100vh-180px)] max-w-3xl items-center justify-center py-12">
          <EmptyState
            actionHref="/auth/login"
            actionLabel="Masuk"
            description="Masuk untuk bertanya ke pemilik barang dan melihat percakapan transaksi."
            icon={UserRound}
            title="Masuk untuk membuka pesan"
          />
        </PageContainer>
        <MobileBottomNav />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        backHref="/"
        backLabel="Beranda"
        eyebrow="Pesan"
        title="Percakapan"
        description="Tanya pemilik barang sebelum pemesanan dan lanjutkan koordinasi transaksi di sini."
      />

      <PageContainer className="pb-12">
        {error ? (
          <EmptyState
            actionHref="/explore"
            actionLabel="Jelajahi barang"
            description={error}
            icon={MessageCircle}
            title="Percakapan belum bisa dimuat"
          />
        ) : conversations.length === 0 ? (
          <EmptyState
            actionHref="/explore"
            actionLabel="Cari barang"
            description="Belum ada percakapan. Buka detail barang lalu klik Tanya pemilik."
            icon={MessageCircle}
            title="Belum ada pesan"
          />
        ) : (
          <div className="space-y-3">
            {conversations.map((conversation) => {
              const partner = auth.user
                ? conversationPartner(conversation, auth.user.id)
                : conversation.owner;

              return (
                <Link
                  className="flex gap-4 rounded-xl border border-[var(--color-border)] bg-surface-raised p-4 shadow-soft-sm transition-shadow hover:shadow-soft"
                  href={`/messages/${conversation.conversation.id}`}
                  key={conversation.conversation.id}
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-sunken">
                    {conversation.listing.photoUrl ? (
                      <Image
                        alt={conversation.listing.title}
                        className="object-cover"
                        fill
                        sizes="80px"
                        src={conversation.listing.photoUrl}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-primary">
                        <PackageOpen className="h-8 w-8" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{partner.name}</p>
                        <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                          {conversation.listing.title}
                        </p>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <StatusBadge tone="primary">{conversation.unreadCount} baru</StatusBadge>
                      )}
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                      {conversation.lastMessage?.body ?? "Belum ada pesan. Mulai percakapan."}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </PageContainer>
      <MobileBottomNav />
    </PageShell>
  );
}
