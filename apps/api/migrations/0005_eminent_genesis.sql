CREATE TABLE `reading_progress` (
	`user_id` text NOT NULL,
	`book_id` text NOT NULL,
	`page` integer NOT NULL,
	`last_opened_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `book_id`),
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `bookmarks` ADD `user_id` text;--> statement-breakpoint
ALTER TABLE `question_answers` ADD `user_id` text;