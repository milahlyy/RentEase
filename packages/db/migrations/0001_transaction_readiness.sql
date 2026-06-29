CREATE TABLE `condition_evidence` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`uploaded_by` text NOT NULL,
	`photo_url` text NOT NULL,
	`type` text NOT NULL,
	`note` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `deposit_claims` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`claimed_by` text NOT NULL,
	`amount` integer NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`resolved_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`claimed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `deposit_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`amount` integer NOT NULL,
	`status` text DEFAULT 'not_paid' NOT NULL,
	`held_at` text,
	`refunded_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `extension_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`requested_by` text NOT NULL,
	`new_end_date` text NOT NULL,
	`additional_rental_price` integer NOT NULL,
	`additional_deposit_amount` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'requested' NOT NULL,
	`created_at` text NOT NULL,
	`resolved_at` text,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
