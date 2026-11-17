import { describe, expect, it } from "bun:test";
import { UPLOAD_CHUNK_CHARS } from "@app/contract";
import { chunkBook, normaliseBook, splitLongParagraph } from "./chunk";

describe("upload chunks", () => {
	it("splits an over-long paragraph at sentence ends", () => {
		const sentence = `${"나".repeat(99)}. `;
		const parts = splitLongParagraph(sentence.repeat(100).trim(), 1000);
		expect(parts.length).toBeGreaterThan(1);
		for (const part of parts) {
			expect(part.length).toBeLessThanOrEqual(1000);
			expect(part.endsWith(".")).toBe(true);
		}
		expect(parts.join(" ")).toBe(sentence.repeat(100).trim());
	});

	it("keeps each chunk inside one chapter and under the size limit, with paragraph offsets", () => {
		const big = "다".repeat(5000);
		const book = normaliseBook({
			title: "책",
			author: "",
			chapters: [
				{ title: " 하나 ", paragraphs: Array.from({ length: 30 }, () => big) },
				{ title: "빈 장", paragraphs: [] },
				{ title: "둘", paragraphs: ["짧은 문단"] },
			],
		});
		expect(book.chapters.map((chapter) => chapter.title)).toEqual(["하나", "둘"]);
		const chunks = chunkBook(book);
		for (const chunk of chunks) {
			const chars = chunk.paragraphs.reduce((sum, text) => sum + text.length, 0);
			expect(chars).toBeLessThanOrEqual(UPLOAD_CHUNK_CHARS);
			expect(new TextEncoder().encode(chunk.paragraphs.join("")).length).toBeLessThanOrEqual(
				180_000,
			);
		}
		const first = chunks.filter((chunk) => chunk.ch === 0);
		expect(first.reduce((sum, chunk) => sum + chunk.paragraphs.length, 0)).toBe(30);
		expect(first[1]?.start).toBe(first[0]?.paragraphs.length);
		expect(chunks.at(-1)).toEqual({ ch: 1, start: 0, paragraphs: ["짧은 문단"] });
	});
});
