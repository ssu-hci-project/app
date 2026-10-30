import { safe } from "@orpc/client";
import { describe, expect, it } from "vitest";
import { paginate } from "../src/lib/paginate";
import { questionContext } from "../src/lib/question-context";
import { createReader } from "./reader";

const paragraph = (label: string, length: number) =>
	`${label}${"가".repeat(Math.max(0, length - label.length - 1))}.`;

describe("in-app text", () => {
	it("cuts text into stable pages that keep paragraphs whole", () => {
		const text = [paragraph("첫", 250), paragraph("둘", 250), paragraph("셋", 250)].join("\n\n");
		const pages = paginate(text);
		expect(pages).toHaveLength(2);
		expect(pages[0]?.split("\n\n")).toHaveLength(2);
		expect(paginate(text)).toEqual(pages);
		expect(pages.join("\n\n")).toBe(text);
	});

	it("splits an over-long paragraph at sentence ends", () => {
		const sentence = `${"나".repeat(99)}. `;
		const pages = paginate(sentence.repeat(20).trim());
		expect(pages.length).toBeGreaterThan(1);
		for (const page of pages) {
			expect(page.length).toBeLessThanOrEqual(600);
			expect(page.endsWith(".")).toBe(true);
		}
	});

	it("gives the question model only text up to the current page", () => {
		const context = questionContext({
			title: "운수 좋은 날",
			author: "현진건",
			previous: `${"앞".repeat(500)}끝`,
			current: "지금 쪽",
			quote: "고른 구절",
		});
		expect(context).toContain("지금 쪽");
		expect(context).toContain("고른 구절");
		expect(context).toContain("끝");
		expect(context.length).toBeLessThan(600);
	});

	it("serves fixed pages of an imported work and rejects pages outside it", async () => {
		const reader = createReader();
		const text = Array.from({ length: 5 }, (_, index) => paragraph(`${index}`, 300)).join("\n\n");
		const book = await reader.reading.createBook({
			title: "만료 저작물",
			author: "저자",
			text,
			sourceUrl: "https://ko.wikisource.org/wiki/example",
			license: "저작권 보호기간 만료",
		});
		expect(book).toMatchObject({ pageCount: 3, license: "저작권 보호기간 만료" });
		const first = await reader.reading.getPage({ bookId: book.id, page: 1 });
		expect(first).toMatchObject({ page: 1, pageCount: 3 });
		expect(first.text.startsWith("0")).toBe(true);
		expect((await safe(reader.reading.getPage({ bookId: book.id, page: 4 })))[0]).toMatchObject({
			code: "BAD_REQUEST",
		});
		const paper = await reader.reading.createBook({
			title: "종이책",
			author: "저자",
			pageCount: 9,
		});
		expect((await safe(reader.reading.getPage({ bookId: paper.id, page: 1 })))[0]).toMatchObject({
			code: "NOT_FOUND",
		});
	});

	it("keeps the question a reader chose with the note", async () => {
		const reader = createReader();
		const book = await reader.reading.createBook({ title: "질문", author: "저자", pageCount: 5 });
		const note = await reader.notes.create({
			bookId: book.id,
			page: 2,
			quote: "",
			content: "답해 본 생각",
			prompt: "이 장면에서 가장 궁금했던 점은?",
		});
		expect(note.prompt).toBe("이 장면에서 가장 궁금했던 점은?");
		const edited = await reader.notes.update({ noteId: note.id, quote: "", content: "고친 생각" });
		expect(edited.prompt).toBeNull();
	});
});
