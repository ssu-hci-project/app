/** Paragraphs longer than this are cut at sentence ends, so a paragraph never outgrows a screen. */
const MAX_PARAGRAPH = 600;

/**
 * Splits plain text into paragraphs at blank lines. Line breaks inside a paragraph become spaces
 * and an over-long paragraph is cut at sentence ends. The same text always yields the same
 * paragraphs, so (chapter, paragraph, offset) can anchor every trace.
 */
export function splitParagraphs(text: string, max = MAX_PARAGRAPH): string[] {
	return text
		.replace(/\r\n?/g, "\n")
		.split(/\n\s*\n/)
		.map((paragraph) => paragraph.replace(/\s*\n\s*/g, " ").trim())
		.filter(Boolean)
		.flatMap((paragraph) => splitLong(paragraph, max));
}

function splitLong(paragraph: string, max: number): string[] {
	if (paragraph.length <= max) return [paragraph];
	// Sentence ends: ., ?, ! (optionally followed by a closing quote), then whitespace.
	const sentences = paragraph.match(/[^.?!]+[.?!]+["”’」』]?\s*|[^.?!]+$/g) ?? [paragraph];
	const parts: string[] = [];
	let current = "";
	for (const sentence of sentences) {
		if (current && current.length + sentence.length > max) {
			parts.push(current.trim());
			current = "";
		}
		current += sentence;
	}
	if (current.trim()) parts.push(current.trim());
	return parts;
}
