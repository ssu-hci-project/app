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
