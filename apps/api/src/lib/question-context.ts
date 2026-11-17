/** Characters of the previous page kept as lead-in, so the scene has some context. */
const LEAD_IN = 400;

/**
 * Builds what Gemini sees: the end of the previous page, the current page and the passage the
 * reader picked. Nothing after the current page is included, so questions cannot spoil the story,
 * and the reader's own notes are never part of it.
 */
export function questionContext({
	title,
	author,
	previous,
	current,
	quote,
}: {
	title: string;
	author: string;
	previous?: string;
	current: string;
	quote?: string;
}) {
	return [
		`작품: ${title} (${author})`,
		previous ? `직전 내용: …${previous.slice(-LEAD_IN)}` : "",
		`지금 읽는 쪽:\n${current}`,
		quote ? `독자가 고른 구절: ${quote}` : "",
	]
		.filter(Boolean)
		.join("\n\n");
}

/** Characters of chapter text sent around the passage. */
const PASSAGE_WINDOW = 3500;

/**
 * What Gemini sees for a passage question: the book, the chapter title, up to 3500 characters of
 * the chapter around the passage and the passage itself. Other readers' traces are never included.
 */
export function passageContext({
	title,
	author,
	chapterTitle,
	chapter,
	quote,
	again,
}: {
	title: string;
	author: string;
	chapterTitle: string;
	chapter: string;
	quote: string;
	again?: boolean;
}) {
	const at = Math.max(0, chapter.indexOf(quote));
	const start =
		chapter.length <= PASSAGE_WINDOW
			? 0
			: Math.min(Math.max(0, at - PASSAGE_WINDOW / 2), chapter.length - PASSAGE_WINDOW);
	return [
		`작품: ${title}${author ? ` (${author})` : ""}`,
		chapterTitle ? `장: ${chapterTitle}` : "",
		`장의 맥락:\n${chapter.slice(start, start + PASSAGE_WINDOW)}`,
		`독자가 고른 구절: ${quote}`,
		again ? "이전과 다른 새로운 관점의 질문으로 만들어주세요." : "",
	]
		.filter(Boolean)
		.join("\n\n");
}
