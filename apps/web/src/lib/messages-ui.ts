import type { Conversation, Message } from "@rentease/shared";

export type ConversationSummary = {
  conversation: Conversation;
  listing: {
    id: string;
    title: string;
    photoUrl: string | null;
  };
  renter: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  owner: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  lastMessage: {
    body: string;
    createdAt: string | null;
  } | null;
  unreadCount: number;
};

export type MessageItem = {
  message: Message;
  sender: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
};

export type ConversationsResponse = {
  conversations: ConversationSummary[];
};

export type ConversationResponse = ConversationSummary | null;

export type MessagesResponse = {
  conversation: ConversationSummary;
  messages: MessageItem[];
};

export type SendMessageResponse = {
  messages: MessageItem[];
};

export function conversationPartner(conversation: ConversationSummary, currentUserId: string) {
  return conversation.conversation.ownerId === currentUserId
    ? conversation.renter
    : conversation.owner;
}
