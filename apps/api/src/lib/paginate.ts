import { splitParagraphs } from "./paragraphs";

/** Roughly one phone screen of Korean prose at the reader's body size. */
const TARGET = 600;

/**
 * Legacy fixed pages, still used by the old `reading` procedures. Pages are whole paragraphs from
 * `splitParagraphs` joined by blank lines, so splitting a page at blank lines gives the paragraphs
 * back (the 0009 migration relies on this).
 */
export function paginate(text: string, target = TARGET): string[] {
	const pages: string[] = [];
	let current: string[] = [];
	let length = 0;
	for (const paragraph of splitParagraphs(text, target)) {
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
