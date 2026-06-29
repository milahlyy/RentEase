import { Hono } from "hono";
import { z } from "zod";
import { failure, getBearerToken, success, verifyJwt, type Bindings } from "./auth";
import type { Conversation, Message } from "@rentease/shared";

type AuthResult =
  | { success: true; userId: string }
  | { success: false; error: string; status: 401 };

type ConversationRow = {
  id: string;
  listing_id: string;
  booking_id: string | null;
  renter_id: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  listing_title: string;
  listing_photo_url: string | null;
  renter_name: string;
  renter_avatar_url: string | null;
  owner_name: string;
  owner_avatar_url: string | null;
  last_message_body: string | null;
  last_message_at: string | null;
  unread_count: number;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
  sender_name: string;
  sender_avatar_url: string | null;
};

type ListingOwnerRow = {
  id: string;
  owner_id: string;
};

type BookingConversationRow = {
  id: string;
  listing_id: string;
  renter_id: string;
  lender_id: string;
};

const conversationsRoute = new Hono<{ Bindings: Bindings }>();

const startConversationSchema = z
  .object({
    bookingId: z.string().trim().min(1).optional(),
    listingId: z.string().trim().min(1).optional(),
  })
  .refine((value) => value.bookingId || value.listingId, "Barang atau pemesanan wajib dipilih");

const createMessageSchema = z.object({
  body: z.string().trim().min(1, "Pesan tidak boleh kosong").max(1000, "Pesan terlalu panjang"),
});

async function requireUserId(c: { env: Bindings; req: { raw: Request } }): Promise<AuthResult> {
  const token = getBearerToken(c.req.raw);

  if (!token) {
    return { success: false, error: "Token tidak ditemukan", status: 401 };
  }

  const payload = await verifyJwt(token, c.env.JWT_SECRET);

  if (!payload) {
    return { success: false, error: "Token tidak valid atau sudah kedaluwarsa", status: 401 };
  }

  return { success: true, userId: payload.sub };
}

function toConversation(row: ConversationRow) {
  const conversation: Conversation = {
    id: row.id,
    listingId: row.listing_id,
    bookingId: row.booking_id,
    renterId: row.renter_id,
    ownerId: row.owner_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  return {
    conversation,
    listing: {
      id: row.listing_id,
      title: row.listing_title,
      photoUrl: row.listing_photo_url,
    },
    renter: {
      id: row.renter_id,
      name: row.renter_name,
      avatarUrl: row.renter_avatar_url,
    },
    owner: {
      id: row.owner_id,
      name: row.owner_name,
      avatarUrl: row.owner_avatar_url,
    },
    lastMessage: row.last_message_body
      ? {
          body: row.last_message_body,
          createdAt: row.last_message_at,
        }
      : null,
    unreadCount: Number(row.unread_count),
  };
}

function toMessage(row: MessageRow) {
  const message: Message = {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body,
    readAt: row.read_at,
    createdAt: row.created_at,
  };

  return {
    message,
    sender: {
      id: row.sender_id,
      name: row.sender_name,
      avatarUrl: row.sender_avatar_url,
    },
  };
}

async function getConversation(db: D1Database, id: string, userId: string) {
  const row = await db
    .prepare(
      `SELECT
        c.*,
        l.title AS listing_title,
        p.url AS listing_photo_url,
        renter.name AS renter_name,
        renter.avatar_url AS renter_avatar_url,
        owner.name AS owner_name,
        owner.avatar_url AS owner_avatar_url,
        last_message.body AS last_message_body,
        last_message.created_at AS last_message_at,
        COALESCE(unread.total, 0) AS unread_count
       FROM conversations c
       JOIN listings l ON l.id = c.listing_id
       LEFT JOIN listing_photos p ON p.listing_id = l.id AND p.is_primary = 1
       JOIN users renter ON renter.id = c.renter_id
       JOIN users owner ON owner.id = c.owner_id
       LEFT JOIN messages last_message ON last_message.id = (
         SELECT id FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1
       )
       LEFT JOIN (
         SELECT conversation_id, COUNT(*) AS total
         FROM messages
         WHERE read_at IS NULL AND sender_id != ?
         GROUP BY conversation_id
       ) unread ON unread.conversation_id = c.id
       WHERE c.id = ? AND (c.renter_id = ? OR c.owner_id = ?)
       LIMIT 1`,
    )
    .bind(userId, id, userId, userId)
    .first<ConversationRow>();

  return row ? toConversation(row) : null;
}

conversationsRoute.post("/", async (c) => {
  const auth = await requireUserId(c);

  if (!auth.success) {
    return c.json(failure(auth.error), auth.status);
  }

  const body = startConversationSchema.safeParse(await c.req.json().catch(() => null));

  if (!body.success) {
    return c.json(failure(body.error.issues[0]?.message ?? "Data chat tidak valid"), 400);
  }

  let listingId = body.data.listingId ?? "";
  let renterId = auth.userId;
  let ownerId = "";
  let bookingId: string | null = null;

  if (body.data.bookingId) {
    const booking = await c.env.DB.prepare(
      "SELECT id, listing_id, renter_id, lender_id FROM bookings WHERE id = ? LIMIT 1",
    )
      .bind(body.data.bookingId)
      .first<BookingConversationRow>();

    if (!booking) {
      return c.json(failure("Pemesanan tidak ditemukan"), 404);
    }

    if (booking.renter_id !== auth.userId && booking.lender_id !== auth.userId) {
      return c.json(failure("Kamu tidak punya akses ke pemesanan ini"), 403);
    }

    listingId = booking.listing_id;
    renterId = booking.renter_id;
    ownerId = booking.lender_id;
    bookingId = booking.id;
  }

  const listing = await c.env.DB.prepare("SELECT id, owner_id FROM listings WHERE id = ? LIMIT 1")
    .bind(listingId)
    .first<ListingOwnerRow>();

  if (!listing) {
    return c.json(failure("Barang tidak ditemukan"), 404);
  }

  if (!ownerId) {
    ownerId = listing.owner_id;
  }

  if (!body.data.bookingId && ownerId === auth.userId) {
    return c.json(failure("Kamu tidak bisa membuka chat dengan listing milik sendiri"), 409);
  }

  const existing = await c.env.DB.prepare(
    `SELECT id FROM conversations
     WHERE listing_id = ? AND renter_id = ? AND owner_id = ?
     ORDER BY updated_at DESC
     LIMIT 1`,
  )
    .bind(listing.id, renterId, ownerId)
    .first<{ id: string }>();

  const id = existing?.id ?? crypto.randomUUID();
  const now = new Date().toISOString();

  if (!existing) {
    await c.env.DB.prepare(
      `INSERT INTO conversations
       (id, listing_id, booking_id, renter_id, owner_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(id, listing.id, bookingId, renterId, ownerId, now, now)
      .run();
  } else if (bookingId) {
    await c.env.DB.prepare(
      "UPDATE conversations SET booking_id = COALESCE(booking_id, ?), updated_at = ? WHERE id = ?",
    )
      .bind(bookingId, now, id)
      .run();
  }

  const conversation = await getConversation(c.env.DB, id, auth.userId);

  return c.json(success(conversation), existing ? 200 : 201);
});

conversationsRoute.get("/", async (c) => {
  const auth = await requireUserId(c);

  if (!auth.success) {
    return c.json(failure(auth.error), auth.status);
  }

  const rows = await c.env.DB.prepare(
    `SELECT
      c.*,
      l.title AS listing_title,
      p.url AS listing_photo_url,
      renter.name AS renter_name,
      renter.avatar_url AS renter_avatar_url,
      owner.name AS owner_name,
      owner.avatar_url AS owner_avatar_url,
      last_message.body AS last_message_body,
      last_message.created_at AS last_message_at,
      COALESCE(unread.total, 0) AS unread_count
     FROM conversations c
     JOIN listings l ON l.id = c.listing_id
     LEFT JOIN listing_photos p ON p.listing_id = l.id AND p.is_primary = 1
     JOIN users renter ON renter.id = c.renter_id
     JOIN users owner ON owner.id = c.owner_id
     LEFT JOIN messages last_message ON last_message.id = (
       SELECT id FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1
     )
     LEFT JOIN (
       SELECT conversation_id, COUNT(*) AS total
       FROM messages
       WHERE read_at IS NULL AND sender_id != ?
       GROUP BY conversation_id
     ) unread ON unread.conversation_id = c.id
     WHERE c.renter_id = ? OR c.owner_id = ?
     ORDER BY COALESCE(last_message.created_at, c.updated_at) DESC`,
  )
    .bind(auth.userId, auth.userId, auth.userId)
    .all<ConversationRow>();

  return c.json(success({ conversations: rows.results.map((row) => toConversation(row)) }));
});

conversationsRoute.get("/:id/messages", async (c) => {
  const auth = await requireUserId(c);

  if (!auth.success) {
    return c.json(failure(auth.error), auth.status);
  }

  const conversation = await getConversation(c.env.DB, c.req.param("id"), auth.userId);

  if (!conversation) {
    return c.json(failure("Percakapan tidak ditemukan"), 404);
  }

  const now = new Date().toISOString();

  await c.env.DB.prepare(
    "UPDATE messages SET read_at = ? WHERE conversation_id = ? AND sender_id != ? AND read_at IS NULL",
  )
    .bind(now, conversation.conversation.id, auth.userId)
    .run();

  const messages = await c.env.DB.prepare(
    `SELECT
      m.*,
      u.name AS sender_name,
      u.avatar_url AS sender_avatar_url
     FROM messages m
     JOIN users u ON u.id = m.sender_id
     WHERE m.conversation_id = ?
     ORDER BY m.created_at ASC`,
  )
    .bind(conversation.conversation.id)
    .all<MessageRow>();

  return c.json(
    success({
      conversation,
      messages: messages.results.map((row) => toMessage(row)),
    }),
  );
});

conversationsRoute.post("/:id/messages", async (c) => {
  const auth = await requireUserId(c);

  if (!auth.success) {
    return c.json(failure(auth.error), auth.status);
  }

  const body = createMessageSchema.safeParse(await c.req.json().catch(() => null));

  if (!body.success) {
    return c.json(failure(body.error.issues[0]?.message ?? "Pesan tidak valid"), 400);
  }

  const conversation = await getConversation(c.env.DB, c.req.param("id"), auth.userId);

  if (!conversation) {
    return c.json(failure("Percakapan tidak ditemukan"), 404);
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO messages (id, conversation_id, sender_id, body, read_at, created_at)
       VALUES (?, ?, ?, ?, NULL, ?)`,
    ).bind(id, conversation.conversation.id, auth.userId, body.data.body, now),
    c.env.DB.prepare("UPDATE conversations SET updated_at = ? WHERE id = ?").bind(
      now,
      conversation.conversation.id,
    ),
  ]);

  const messages = await c.env.DB.prepare(
    `SELECT
      m.*,
      u.name AS sender_name,
      u.avatar_url AS sender_avatar_url
     FROM messages m
     JOIN users u ON u.id = m.sender_id
     WHERE m.conversation_id = ?
     ORDER BY m.created_at ASC`,
  )
    .bind(conversation.conversation.id)
    .all<MessageRow>();

  return c.json(success({ messages: messages.results.map((row) => toMessage(row)) }), 201);
});

export { conversationsRoute };
