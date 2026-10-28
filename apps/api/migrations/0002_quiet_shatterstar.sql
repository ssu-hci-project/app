CREATE TABLE `question_answers` (
	`id` text PRIMARY KEY NOT NULL,
	`book_id` text NOT NULL,
	`page` integer NOT NULL,
	`template_id` text NOT NULL,
	`content` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE cascade
);
