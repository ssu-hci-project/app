CREATE TABLE `book_chapters` (
	`book_id` text NOT NULL,
	`ch` integer NOT NULL,
	`title` text NOT NULL,
	`chars` integer NOT NULL,
	PRIMARY KEY(`book_id`, `ch`),
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `book_paragraphs` (
	`book_id` text NOT NULL,
	`ch` integer NOT NULL,
	`p` integer NOT NULL,
	`text` text NOT NULL,
	PRIMARY KEY(`book_id`, `ch`, `p`),
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `libraries` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`invite_code` text NOT NULL,
	`owner_id` text NOT NULL,
	`personal` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `libraries_invite_code_unique` ON `libraries` (`invite_code`);--> statement-breakpoint
CREATE TABLE `library_members` (
	`library_id` text NOT NULL,
	`user_id` text NOT NULL,
	`joined_at` text NOT NULL,
	PRIMARY KEY(`library_id`, `user_id`),
	FOREIGN KEY (`library_id`) REFERENCES `libraries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `library_members_user` ON `library_members` (`user_id`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`nick` text NOT NULL,
	`color` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `progress` (
	`user_id` text NOT NULL,
	`book_id` text NOT NULL,
	`ch` integer NOT NULL,
	`ratio` real NOT NULL,
	`pct` integer NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `book_id`),
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `reactions` (
	`trace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`emoji` text NOT NULL,
	PRIMARY KEY(`trace_id`, `user_id`),
	FOREIGN KEY (`trace_id`) REFERENCES `traces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `reads` (
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`book_id` text NOT NULL,
	PRIMARY KEY(`user_id`, `date`, `book_id`),
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `saved_books` (
	`user_id` text NOT NULL,
	`book_id` text NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `book_id`),
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `traces` (
	`id` text PRIMARY KEY NOT NULL,
	`library_id` text NOT NULL,
	`book_id` text NOT NULL,
	`ch` integer NOT NULL,
	`p` integer NOT NULL,
	`s` integer NOT NULL,
	`e` integer NOT NULL,
	`quote` text NOT NULL,
	`kind` text NOT NULL,
	`text` text,
	`q` text,
	`emoji` text,
	`data` text,
	`parent_id` text,
	`author_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`library_id`) REFERENCES `libraries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`parent_id`) REFERENCES `traces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `traces_book` ON `traces` (`library_id`,`book_id`);--> statement-breakpoint
ALTER TABLE `books` ADD `library_id` text REFERENCES libraries(id) ON DELETE cascade;--> statement-breakpoint
ALTER TABLE `books` ADD `added_by` text;--> statement-breakpoint
ALTER TABLE `books` ADD `color` text;--> statement-breakpoint
ALTER TABLE `books` ADD `status` text DEFAULT 'ready' NOT NULL;--> statement-breakpoint
-- 아래는 손으로 쓴 데이터 이전입니다. 모임 → 서재, 600자 쪽 → 문단, 쪽 기록 → 흔적.
-- 1) 모임(reading_groups)을 서재로 옮깁니다. 같은 id와 초대 코드를 유지하고, 처음 들어온 사람이 관리자입니다.
INSERT INTO `libraries` (`id`, `name`, `invite_code`, `owner_id`, `personal`, `created_at`)
SELECT g.`id`, g.`name`, g.`invite_code`,
	coalesce((SELECT m.`user_id` FROM `memberships` m WHERE m.`group_id` = g.`id` ORDER BY m.rowid LIMIT 1), ''),
	0, g.`created_at`
FROM `reading_groups` g;
--> statement-breakpoint
INSERT INTO `library_members` (`library_id`, `user_id`, `joined_at`)
SELECT m.`group_id`, m.`user_id`, g.`created_at`
FROM `memberships` m JOIN `reading_groups` g ON g.`id` = m.`group_id`;
--> statement-breakpoint
-- 2) 개인 기록이 있는 사람에게 개인 서재를 만듭니다(나머지는 처음 접속할 때 만들어져요).
INSERT INTO `libraries` (`id`, `name`, `invite_code`, `owner_id`, `personal`, `created_at`)
SELECT lower(hex(randomblob(16))), '나의 서재',
	replace(replace(upper(hex(randomblob(4))), '0', 'Z'), '1', 'Y'),
	u.`user_id`, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM (
	SELECT `user_id` FROM `bookmarks` WHERE `user_id` IS NOT NULL AND `visibility` IN ('private', 'group')
	UNION SELECT `user_id` FROM `question_answers` WHERE `user_id` IS NOT NULL
	UNION SELECT `user_id` FROM `reading_progress`
) u;
--> statement-breakpoint
INSERT INTO `library_members` (`library_id`, `user_id`, `joined_at`)
SELECT `id`, `owner_id`, `created_at` FROM `libraries` WHERE `personal` = 1;
--> statement-breakpoint
-- 3) 쪽 본문을 문단으로 나눕니다. 쪽은 문단을 빈 줄로 이어 붙인 것이라 그대로 되돌릴 수 있어요.
CREATE TABLE `_page_paragraphs` (`book_id` text, `page` integer, `idx` integer, `text` text);
--> statement-breakpoint
INSERT INTO `_page_paragraphs` (`book_id`, `page`, `idx`, `text`)
WITH RECURSIVE split(`book_id`, `page`, `rest`, `para`, `idx`) AS (
	SELECT `book_id`, `page`, `text` || char(10) || char(10), NULL, 0 FROM `book_pages`
	UNION ALL
	SELECT `book_id`, `page`,
		substr(`rest`, instr(`rest`, char(10) || char(10)) + 2),
		substr(`rest`, 1, instr(`rest`, char(10) || char(10)) - 1),
		`idx` + 1
	FROM split WHERE `rest` <> ''
)
SELECT `book_id`, `page`, `idx`, `para` FROM split WHERE `para` IS NOT NULL AND trim(`para`) <> '';
--> statement-breakpoint
CREATE TABLE `_paragraphs` AS
SELECT `book_id`, `page`, `idx`, `text`,
	row_number() OVER (PARTITION BY `book_id` ORDER BY `page`, `idx`) - 1 AS `p`
FROM `_page_paragraphs`;
--> statement-breakpoint
INSERT INTO `book_paragraphs` (`book_id`, `ch`, `p`, `text`)
SELECT `book_id`, 0, `p`, `text` FROM `_paragraphs`;
--> statement-breakpoint
INSERT INTO `book_chapters` (`book_id`, `ch`, `title`, `chars`)
SELECT b.`id`, 0, b.`title`, sum(length(p.`text`))
FROM `books` b JOIN `_paragraphs` p ON p.`book_id` = b.`id`
GROUP BY b.`id`;
--> statement-breakpoint
-- 4) 쪽 기록을 그 쪽 첫 문단 첫 문장에 남긴 메모 흔적으로 옮깁니다(질문이 있으면 질문 흔적).
--    개인 기록은 개인 서재로, 모임 공유 기록은 그 서재로. legacy 공개 기록은 옮기지 않습니다.
INSERT INTO `traces` (`id`, `library_id`, `book_id`, `ch`, `p`, `s`, `e`, `quote`, `kind`, `text`, `q`, `author_id`, `created_at`)
SELECT b.`id`, l.`id`, b.`book_id`, 0, pp.`p`, 0,
	CASE WHEN instr(pp.`text`, '. ') > 0 THEN instr(pp.`text`, '. ') ELSE length(pp.`text`) END,
	CASE WHEN b.`quote` <> '' THEN b.`quote` ELSE substr(pp.`text`, 1, CASE WHEN instr(pp.`text`, '. ') > 0 THEN instr(pp.`text`, '. ') ELSE 200 END) END,
	CASE WHEN coalesce(b.`prompt`, '') <> '' THEN 'qa' ELSE 'memo' END,
	b.`content`,
	CASE WHEN coalesce(b.`prompt`, '') <> '' THEN b.`prompt` ELSE NULL END,
	b.`user_id`, b.`created_at`
FROM `bookmarks` b
JOIN `_paragraphs` pp ON pp.`book_id` = b.`book_id` AND pp.`page` = b.`page` AND pp.`idx` = 1
JOIN `libraries` l ON l.`id` = CASE
	WHEN b.`visibility` = 'group' THEN b.`group_id`
	ELSE (SELECT x.`id` FROM `libraries` x WHERE x.`personal` = 1 AND x.`owner_id` = b.`user_id`)
END
WHERE b.`user_id` IS NOT NULL AND b.`visibility` IN ('private', 'group');
--> statement-breakpoint
INSERT INTO `traces` (`id`, `library_id`, `book_id`, `ch`, `p`, `s`, `e`, `quote`, `kind`, `text`, `q`, `author_id`, `created_at`)
SELECT a.`id`, l.`id`, a.`book_id`, 0, pp.`p`, 0,
	CASE WHEN instr(pp.`text`, '. ') > 0 THEN instr(pp.`text`, '. ') ELSE length(pp.`text`) END,
	substr(pp.`text`, 1, CASE WHEN instr(pp.`text`, '. ') > 0 THEN instr(pp.`text`, '. ') ELSE 200 END),
	'qa', a.`content`,
	coalesce(
		(SELECT gq.`question` FROM `generated_questions` gq WHERE gq.`id` = a.`template_id`),
		CASE a.`template_id`
			WHEN 'question' THEN '이 부분에서 가장 궁금했던 점은 무엇인가요?'
			WHEN 'emotion' THEN '이 부분을 읽으며 어떤 감정이 들었나요?'
			WHEN 'perspective' THEN '다른 인물의 입장에서는 이 장면이 어떻게 보일까요?'
			WHEN 'connection' THEN '이 부분은 어떤 경험이나 생각을 떠올리게 하나요?'
			ELSE '이 부분에서 떠오른 생각은 무엇인가요?'
		END
	),
	a.`user_id`, a.`created_at`
FROM `question_answers` a
JOIN `_paragraphs` pp ON pp.`book_id` = a.`book_id` AND pp.`page` = a.`page` AND pp.`idx` = 1
JOIN `libraries` l ON l.`personal` = 1 AND l.`owner_id` = a.`user_id`
WHERE a.`user_id` IS NOT NULL;
--> statement-breakpoint
-- 5) 읽던 쪽은 1장 안의 비율로, 마지막으로 연 날은 읽은 날로 옮깁니다.
INSERT INTO `progress` (`user_id`, `book_id`, `ch`, `ratio`, `pct`, `updated_at`)
SELECT r.`user_id`, r.`book_id`, 0,
	min(1.0, max(0.0, (r.`page` - 1) * 1.0 / max(1, b.`page_count`))),
	min(100, max(0, CAST(round((r.`page` - 1) * 100.0 / max(1, b.`page_count`)) AS integer))),
	r.`last_opened_at`
FROM `reading_progress` r JOIN `books` b ON b.`id` = r.`book_id`;
--> statement-breakpoint
INSERT OR IGNORE INTO `reads` (`user_id`, `date`, `book_id`)
SELECT `user_id`, substr(`last_opened_at`, 1, 10), `book_id` FROM `reading_progress`;
--> statement-breakpoint
DROP TABLE `_paragraphs`;
--> statement-breakpoint
DROP TABLE `_page_paragraphs`;
