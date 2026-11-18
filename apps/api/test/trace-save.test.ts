import { env } from "cloudflare:workers";
import { safe } from "@orpc/client";
import { describe, expect, it } from "vitest";
import app from "../src/index";
import { createReader } from "./reader";

describe("saving reader traces", () => {
	it("saves question answers and memos concurrently with progress, then loads and replies to them", async () => {
		const reader = createReader({ GEMINI_API_KEY: "" });
		const [library] = await reader.libraries.list();
		if (!library) throw new Error("missing library");
		await reader.profile.save({ nick: "독자", color: "#285C48" });
		const { bookId } = await reader.books.uploadBegin({
			libraryId: library.id,
			title: "저장 회귀 테스트",
			author: "작가",
			chapters: [{ title: "첫 장", chars: 13, paragraphs: 1 }],
		});
		await reader.books.uploadChunk({
			bookId,
			ch: 0,
			start: 0,
			paragraphs: ["질문에 답하고 생각을 남긴다."],
		});
		await reader.books.uploadFinish({ bookId });
		const anchor = {
			libraryId: library.id,
			bookId,
			ch: 0,
			p: 0,
			s: 0,
			e: 7,
			quote: "질문에 답하고",
		};
		const generated = await reader.questions.generate({ ...anchor });
		const q = generated.questions[0]?.q;
		if (!q) throw new Error("missing question");
		const [answer, memo] = await Promise.all([
			reader.traces.create({ ...anchor, kind: "qa", q, text: "질문에 대한 답변" }),
			reader.traces.create({ ...anchor, kind: "memo", text: "구절에 대한 생각" }),
			reader.progress.save({ bookId, ch: 0, ratio: 0.5, pct: 50, date: "2026-11-17" }),
		]);
		expect(answer).toMatchObject({ kind: "qa", q, text: "질문에 대한 답변", isMine: true });
		expect(memo).toMatchObject({ kind: "memo", text: "구절에 대한 생각" });
		const reply = await reader.traces.create({
			kind: "reply",
			parentId: answer.id,
			text: "덧붙이는 답",
		});
		expect(reply.parentId).toBe(answer.id);
		const list = await reader.traces.list({ libraryId: library.id, bookId });
		expect(list.map((trace) => trace.id)).toEqual(
			expect.arrayContaining([answer.id, memo.id, reply.id]),
		);
		const [bad] = await safe(
			reader.traces.create({ ...anchor, e: 100, kind: "qa", q, text: "답" }),
		);
		expect(bad).toMatchObject({ code: "BAD_REQUEST" });
		const detail = await reader.books.get({ libraryId: library.id, bookId });
		expect(detail.book.progress?.pct).toBe(50);
	});

	it("rejects malformed answers with 400 rather than a server error", async () => {
		const response = await app.request(
			"/api/traces",
			{
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ kind: "qa", text: "", q: "질문" }),
			},
			env,
		);
		expect(response.status).toBe(400);
	});
});
