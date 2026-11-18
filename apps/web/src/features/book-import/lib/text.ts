import { extractBlocks, parseMarkup } from "./markup";
import type { ParsedBook, ParsedChapter } from "./parsed-book";
import { clean } from "./parsed-book";

/** UTF-8 first; Korean text files are often EUC-KR (CP949). */
export function decodeText(buffer: ArrayBuffer) {
	try {
		return new TextDecoder("utf-8", { fatal: true }).decode(buffer).replace(/^\ufeff/, "");
	} catch {
		try {
			return new TextDecoder("euc-kr").decode(buffer);
		} catch {
			return new TextDecoder().decode(buffer);
		}
	}
}

const CHAPTER_HEAD =
	/^(제\s*[0-9０-９一二三四五六七八九十百]+\s*[장화부편권]|chapter\s*[0-9ivx]+|part\s*[0-9ivx]+|프롤로그|에필로그|prologue|epilogue|[0-9]{1,3}\s*[장화]|#{1,3}\s)/i;
/** A text without chapter headings is cut into chapters of about this many characters. */
const CHAPTER_CHARS = 7000;

/**
 * Plain text: paragraphs at blank lines (or every line when the file has none). Two or more
 * chapter-heading lines ("제1장", "Chapter 2", "# 제목"…) split chapters; otherwise ~7000 characters.
 */
export function parseTxt(text: string, name: string): ParsedBook {
	const normalised = text.replace(/\r\n?/g, "\n");
	const hasBlankLines = /\n[ \t]*\n/.test(normalised);
	const paragraphs = (hasBlankLines ? normalised.split(/\n[ \t]*\n+/) : normalised.split("\n"))
		.map(clean)
		.filter(Boolean);
	const heads = paragraphs
		.map((paragraph, index) =>
			CHAPTER_HEAD.test(paragraph) && paragraph.length < 50 && !paragraph.includes("\n")
				? index
				: -1,
		)
		.filter((index) => index >= 0);
	const chapters: ParsedChapter[] = [];
	if (heads.length >= 2) {
		const first = heads[0] ?? 0;
		if (first > 0) chapters.push({ title: "시작", paragraphs: paragraphs.slice(0, first) });
		heads.forEach((head, at) => {
			const body = paragraphs.slice(head + 1, heads[at + 1] ?? paragraphs.length);
			if (body.length)
				chapters.push({ title: (paragraphs[head] ?? "").replace(/^#+\s*/, ""), paragraphs: body });
		});
	} else {
		let current: string[] = [];
		let length = 0;
		for (const paragraph of paragraphs) {
			current.push(paragraph);
			length += paragraph.length;
			if (length > CHAPTER_CHARS) {
				chapters.push({ title: "", paragraphs: current });
				current = [];
				length = 0;
			}
		}
		if (current.length) chapters.push({ title: "", paragraphs: current });
	}
	return { title: name, author: "", chapters };
}

/** A single HTML file: every heading starts a chapter. */
export function parseHtml(text: string, name: string): ParsedBook {
	const doc = parseMarkup(text, "text/html");
	const chapters: ParsedChapter[] = [];
	let current: ParsedChapter | undefined;
	for (const block of extractBlocks(doc.body ?? doc.documentElement)) {
		if (block.heading) {
			current = { title: block.text.slice(0, 60), paragraphs: [] };
			chapters.push(current);
		} else {
			if (!current) {
				current = { title: "", paragraphs: [] };
				chapters.push(current);
			}
			current.paragraphs.push(block.text);
		}
	}
	return {
		title: doc.title.trim() || name,
		author: "",
		chapters: chapters.filter((chapter) => chapter.paragraphs.length),
	};
}
