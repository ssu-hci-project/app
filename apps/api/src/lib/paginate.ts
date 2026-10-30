/** Roughly one phone screen of Korean prose at the reader's body size. */
const TARGET = 600;

/**
 * Cuts a work into fixed pages. Paragraphs stay whole when they fit; a paragraph longer than a
 * page is split at sentence ends. The same text always yields the same pages, so page numbers can
 * anchor notes and group discussions.
 */
export function paginate(text: string, target = TARGET): string[] {
	const paragraphs = text
		.replace(/\r\n?/g, "\n")
		.split(/\n\s*\n/)
		.map((paragraph) => paragraph.replace(/\s*\n\s*/g, " ").trim())
		.filter(Boolean)
		.flatMap((paragraph) => splitLong(paragraph, target));
	const pages: string[] = [];
	let current: string[] = [];
	let length = 0;
	for (const paragraph of paragraphs) {
		if (current.length && length + paragraph.length > target) {
			pages.push(current.join("\n\n"));
			current = [];
			length = 0;
		}
		current.push(paragraph);
		length += paragraph.length;
	}
	if (current.length) pages.push(current.join("\n\n"));
	return pages;
}

function splitLong(paragraph: string, target: number): string[] {
	if (paragraph.length <= target) return [paragraph];
	// Sentence ends: ., ?, ! (optionally followed by a closing quote), then whitespace.
	const sentences = paragraph.match(/[^.?!]+[.?!]+["”’」』]?\s*|[^.?!]+$/g) ?? [paragraph];
	const parts: string[] = [];
	let current = "";
	for (const sentence of sentences) {
		if (current && current.length + sentence.length > target) {
			parts.push(current.trim());
			current = "";
		}
		current += sentence;
	}
	if (current.trim()) parts.push(current.trim());
	return parts;
}
