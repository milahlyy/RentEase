CREATE TABLE `conversations` (
  `id` text PRIMARY KEY NOT NULL,
  `listing_id` text NOT NULL,
  `booking_id` text,
  `renter_id` text NOT NULL,
  `owner_id` text NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`listing_id`) REFERENCES `listings`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`renter_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE `messages` (
  `id` text PRIMARY KEY NOT NULL,
  `conversation_id` text NOT NULL,
  `sender_id` text NOT NULL,
  `body` text NOT NULL,
  `read_at` text,
  `created_at` text NOT NULL,
  FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE INDEX `conversations_listing_renter_owner_idx`
  ON `conversations` (`listing_id`, `renter_id`, `owner_id`);

CREATE INDEX `conversations_renter_updated_idx`
  ON `conversations` (`renter_id`, `updated_at`);

CREATE INDEX `conversations_owner_updated_idx`
  ON `conversations` (`owner_id`, `updated_at`);

CREATE INDEX `messages_conversation_created_idx`
  ON `messages` (`conversation_id`, `created_at`);
