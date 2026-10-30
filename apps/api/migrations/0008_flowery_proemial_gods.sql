CREATE TABLE `book_pages` (
	`book_id` text NOT NULL,
	`page` integer NOT NULL,
	`text` text NOT NULL,
	PRIMARY KEY(`book_id`, `page`),
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `bookmarks` ADD `prompt` text;--> statement-breakpoint
ALTER TABLE `books` ADD `source_url` text;--> statement-breakpoint
ALTER TABLE `books` ADD `license` text;