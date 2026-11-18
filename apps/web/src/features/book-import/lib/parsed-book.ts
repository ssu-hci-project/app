export type ParsedChapter = { title: string; paragraphs: string[] };
export type ParsedBook = { title: string; author: string; chapters: ParsedChapter[] };

/** Collapses runs of spaces, trims each line and drops blank lines inside a paragraph. */
export const clean = (text: string) =>
	text
		.replace(/[ \t\u00a0\u3000]+/g, " ")
		.replace(/ *\n */g, "\n")
		.replace(/\n{2,}/g, "\n")
		.trim();
