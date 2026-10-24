CREATE TABLE `campus_states` (
	`id` text PRIMARY KEY NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`body` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `demo_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`state_id` text NOT NULL,
	`role` text DEFAULT 'organizer' NOT NULL,
	`expires_at` text NOT NULL,
	FOREIGN KEY (`state_id`) REFERENCES `campus_states`(`id`) ON UPDATE no action ON DELETE no action
);
