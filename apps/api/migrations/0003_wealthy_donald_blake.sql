CREATE TABLE `generated_questions` (
	`id` text PRIMARY KEY NOT NULL,
	`book_id` text NOT NULL,
	`page` integer NOT NULL,
	`question` text NOT NULL,
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE cascade
);
