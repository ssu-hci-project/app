CREATE TABLE `library_books` (
	`library_id` text NOT NULL,
	`book_id` text NOT NULL,
	`added_by` text NOT NULL,
	`added_at` text NOT NULL,
	PRIMARY KEY(`library_id`, `book_id`),
	FOREIGN KEY (`library_id`) REFERENCES `libraries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `library_books_book` ON `library_books` (`book_id`);