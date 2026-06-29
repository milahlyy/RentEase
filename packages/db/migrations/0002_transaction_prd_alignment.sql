PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TABLE `deposit_transactions_new` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`amount_held` integer NOT NULL,
	`amount_claimed` integer DEFAULT 0 NOT NULL,
	`amount_refunded` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'not_paid' NOT NULL,
	`released_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `deposit_transactions_new`
	(`id`, `booking_id`, `amount_held`, `amount_claimed`, `amount_refunded`, `status`, `released_at`, `created_at`)
SELECT
	`id`,
	`booking_id`,
	`amount`,
	0,
	0,
	`status`,
	`refunded_at`,
	`created_at`
FROM `deposit_transactions`;
--> statement-breakpoint
DROP TABLE `deposit_transactions`;
--> statement-breakpoint
ALTER TABLE `deposit_transactions_new` RENAME TO `deposit_transactions`;
--> statement-breakpoint
CREATE TABLE `extension_requests_new` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`requested_by` text NOT NULL,
	`requested_end_date` text NOT NULL,
	`additional_price` integer NOT NULL,
	`status` text DEFAULT 'requested' NOT NULL,
	`approved_at` text,
	`paid_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `extension_requests_new`
	(`id`, `booking_id`, `requested_by`, `requested_end_date`, `additional_price`, `status`, `approved_at`, `paid_at`, `created_at`)
SELECT
	`id`,
	`booking_id`,
	`requested_by`,
	`new_end_date`,
	`additional_rental_price`,
	`status`,
	CASE WHEN `status` IN ('approved', 'paid') THEN `resolved_at` ELSE NULL END,
	CASE WHEN `status` = 'paid' THEN `resolved_at` ELSE NULL END,
	`created_at`
FROM `extension_requests`;
--> statement-breakpoint
DROP TABLE `extension_requests`;
--> statement-breakpoint
ALTER TABLE `extension_requests_new` RENAME TO `extension_requests`;
--> statement-breakpoint
ALTER TABLE `deposit_claims` ADD `renter_responded_at` text;
--> statement-breakpoint
ALTER TABLE `disputes` ADD `deposit_claim_id` text REFERENCES `deposit_claims`(`id`);
--> statement-breakpoint
PRAGMA foreign_keys=ON;
