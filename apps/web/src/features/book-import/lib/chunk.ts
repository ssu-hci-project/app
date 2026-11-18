import { UPLOAD_CHUNK_CHARS, UPLOAD_PARAGRAPH_CHARS } from "@app/contract";
import type { ParsedBook } from "./parsed-book";

/** Request bodies stay under ~180KB; Korean is up to 3 bytes per character in UTF-8. */
const CHUNK_BYTES = 180_000;
const encoder = new TextEncoder();

/** Cuts a paragraph longer than the API allows at a sentence end or line break. */
export function splitLongParagraph(paragraph: string, max = UPLOAD_PARAGRAPH_CHARS): string[] {
	const parts: string[] = [];
	let rest = paragraph;
	while (rest.length > max) {
		let cut = rest.lastIndexOf(". ", max);
		if (cut < max / 3) cut = rest.lastIndexOf("\n", max);
		if (cut < max / 3) cut = max - 1;
		parts.push(rest.slice(0, cut + 1).trim());
		rest = rest.slice(cut + 1);
	}
	if (rest.trim()) parts.push(rest.trim());
	return parts;
}

/** Chapters ready to upload: long paragraphs split, empty chapters dropped. */
export function normaliseBook(book: ParsedBook): ParsedBook {
	return {
		...book,
		chapters: book.chapters
			.map((chapter) => ({
				title: chapter.title.trim().slice(0, 120),
				paragraphs: chapter.paragraphs.flatMap((paragraph) => splitLongParagraph(paragraph)),
			}))
			.filter((chapter) => chapter.paragraphs.length),
	};
}

export type UploadChunk = { ch: number; start: number; paragraphs: string[] };

/** One request per chunk: whole paragraphs of a single chapter, within the size limits. */
export function chunkBook(book: ParsedBook): UploadChunk[] {
	const chunks: UploadChunk[] = [];
	book.chapters.forEach((chapter, ch) => {
		let current: string[] = [];
		let start = 0;
		let chars = 0;
		let bytes = 0;
		chapter.paragraphs.forEach((paragraph, index) => {
			const size = encoder.encode(paragraph).length + 8;
			if (
				current.length &&
				(bytes + size > CHUNK_BYTES || chars + paragraph.length > UPLOAD_CHUNK_CHARS)
			) {
				chunks.push({ ch, start, paragraphs: current });
				current = [];
				start = index;
				chars = 0;
				bytes = 0;
			}
			current.push(paragraph);
			chars += paragraph.length;
			bytes += size;
		});
		if (current.length) chunks.push({ ch, start, paragraphs: current });
	});
	return chunks;
}
