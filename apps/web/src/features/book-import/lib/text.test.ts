import { describe, expect, it } from "bun:test";
import { decodeText, parseTxt } from "./text";

describe("parseTxt", () => {
	it("splits chapters at two or more heading lines and keeps a lead-in", () => {
		const text =
			"머리말이에요.\n\n제1장 봄비\n\n비가 왔다.\n\n우산을 폈다.\n\n제2장 첫눈\n\n눈이 왔다.";
		const book = parseTxt(text, "골목");
		expect(book.title).toBe("골목");
		expect(book.chapters).toEqual([
			{ title: "시작", paragraphs: ["머리말이에요."] },
			{ title: "제1장 봄비", paragraphs: ["비가 왔다.", "우산을 폈다."] },
			{ title: "제2장 첫눈", paragraphs: ["눈이 왔다."] },
		]);
	});

	it("treats every line as a paragraph when there are no blank lines", () => {
		const book = parseTxt("첫 줄\r\n둘째 줄\r\n# 하나뿐인 제목", "책");
		expect(book.chapters).toHaveLength(1);
		expect(book.chapters[0]?.paragraphs).toEqual(["첫 줄", "둘째 줄", "# 하나뿐인 제목"]);
	});

	it("cuts a long text without headings into ~7000-character chapters", () => {
		const paragraph = "가".repeat(1000);
		const book = parseTxt(Array.from({ length: 15 }, () => paragraph).join("\n\n"), "긴 책");
		expect(book.chapters.length).toBe(2);
		expect(book.chapters[0]?.paragraphs).toHaveLength(8);
	});
});

describe("decodeText", () => {
	it("reads UTF-8 and drops the byte-order mark", () => {
		const bytes = new TextEncoder().encode("﻿안녕");
		expect(decodeText(bytes.buffer as ArrayBuffer)).toBe("안녕");
	});

	it("falls back to EUC-KR", () => {
		// "가나" in EUC-KR.
		const bytes = new Uint8Array([0xb0, 0xa1, 0xb3, 0xaa]);
		expect(decodeText(bytes.buffer)).toBe("가나");
	});
});
