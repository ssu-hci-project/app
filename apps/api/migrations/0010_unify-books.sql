-- Books created through the retired reader after 0009 still only have fixed pages.
-- Convert only books without chapters: existing paragraph anchors must never move.
CREATE TABLE `_unified_paragraphs` AS
WITH RECURSIVE split(book_id, page, rest, para, idx) AS (
	SELECT bp.book_id, bp.page, bp.text || char(10) || char(10), NULL, 0
	FROM book_pages bp
	WHERE NOT EXISTS (SELECT 1 FROM book_chapters ch WHERE ch.book_id = bp.book_id)
	UNION ALL
	SELECT book_id, page,
		substr(rest, instr(rest, char(10) || char(10)) + 2),
		substr(rest, 1, instr(rest, char(10) || char(10)) - 1), idx + 1
	FROM split WHERE rest <> ''
)
SELECT book_id, text, row_number() OVER (PARTITION BY book_id ORDER BY page, idx) - 1 AS p
FROM (SELECT book_id, page, idx, para AS text FROM split WHERE para IS NOT NULL AND trim(para) <> '');
--> statement-breakpoint
INSERT INTO book_paragraphs (book_id, ch, p, text)
SELECT book_id, 0, p, text FROM _unified_paragraphs;
--> statement-breakpoint
INSERT INTO book_chapters (book_id, ch, title, chars)
SELECT b.id, 0, b.title, sum(length(p.text))
FROM books b JOIN _unified_paragraphs p ON p.book_id = b.id GROUP BY b.id;
--> statement-breakpoint
DROP TABLE _unified_paragraphs;
