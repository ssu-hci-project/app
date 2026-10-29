CREATE TABLE `reading_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`book_id` text NOT NULL,
	`name` text NOT NULL,
	`invite_code` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reading_groups_invite_code_unique` ON `reading_groups` (`invite_code`);--> statement-breakpoint
CREATE TABLE `memberships` (
	`group_id` text NOT NULL,
	`user_id` text NOT NULL,
	PRIMARY KEY(`group_id`, `user_id`),
	FOREIGN KEY (`group_id`) REFERENCES `reading_groups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `seen_notes` (
	`user_id` text NOT NULL,
	`note_id` text NOT NULL,
	`version` integer NOT NULL,
	PRIMARY KEY(`user_id`, `note_id`),
	FOREIGN KEY (`note_id`) REFERENCES `bookmarks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `share_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `share_events_key_unique` ON `share_events` (`key`);--> statement-breakpoint
ALTER TABLE `bookmarks` ADD `visibility` text DEFAULT 'legacy' NOT NULL;--> statement-breakpoint
ALTER TABLE `bookmarks` ADD `group_id` text REFERENCES reading_groups(id);--> statement-breakpoint
ALTER TABLE `bookmarks` ADD `quote` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `bookmarks` ADD `updated_at` text;--> statement-breakpoint
ALTER TABLE `bookmarks` ADD `shared_version` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `books` ADD `edition` text DEFAULT '판본 미확인' NOT NULL;