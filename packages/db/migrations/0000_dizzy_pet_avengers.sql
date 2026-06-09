CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`listing_id` text NOT NULL,
	`renter_id` text NOT NULL,
	`lender_id` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`total_price` integer NOT NULL,
	`deposit` integer NOT NULL,
	`delivery_method` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`listing_id`) REFERENCES `listings`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`renter_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lender_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `disputes` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`raised_by` text NOT NULL,
	`reason` text NOT NULL,
	`status` text NOT NULL,
	`resolved_at` text,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`raised_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `kyc_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`ktp_url` text NOT NULL,
	`selfie_url` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`reviewed_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `listing_availability` (
	`id` text PRIMARY KEY NOT NULL,
	`listing_id` text NOT NULL,
	`blocked_date` text NOT NULL,
	FOREIGN KEY (`listing_id`) REFERENCES `listings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `listing_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`listing_id` text NOT NULL,
	`url` text NOT NULL,
	`order` integer NOT NULL,
	`is_primary` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`listing_id`) REFERENCES `listings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `listings` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`condition` integer NOT NULL,
	`price_per_day` integer NOT NULL,
	`deposit_amount` integer NOT NULL,
	`location` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`midtrans_order_id` text NOT NULL,
	`amount` integer NOT NULL,
	`status` text NOT NULL,
	`paid_at` text,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`reviewer_id` text NOT NULL,
	`reviewee_id` text NOT NULL,
	`rating` integer NOT NULL,
	`comment` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewee_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`role` text DEFAULT 'renter' NOT NULL,
	`avatar_url` text,
	`is_verified` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payments_midtrans_order_id_unique` ON `payments` (`midtrans_order_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);