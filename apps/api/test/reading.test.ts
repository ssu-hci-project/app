import { env } from "cloudflare:workers";
import type { Contract } from "@app/contract";
import { createORPCClient, isDefinedError, safe } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";
import { describe, expect, it } from "vitest";
import app from "../src/index";

function createReader(): ContractRouterClient<Contract> {
	let cookie = "";
	return createORPCClient(
		new RPCLink({
			url: "http://test.local/api/rpc",
			fetch: async (request) => {
				const next = new Request(request);
				if (cookie) next.headers.set("cookie", cookie);
				const response = await app.fetch(next, env);
				cookie = response.headers.get("set-cookie")?.split(";")[0] ?? cookie;
				return response;
			},
		}),
	);
}
const client = createReader();

const clientWithoutKey: ContractRouterClient<Contract> = createORPCClient(
	new RPCLink({
		url: "http://test.local/api/rpc",
		fetch: async (request) => app.fetch(request, { ...env, GEMINI_API_KEY: "" }),
	}),
);

describe("reading API", () => {
	it("persists an anonymous reader's progress and identifies their own bookmarks without sharing state", async () => {
		const alice = createReader();
		const bob = createReader();
		const book = await alice.reading.createBook({
			title: "함께 읽는 책",
			author: "저자",
			pageCount: 20,
		});
		expect((await alice.reading.getBook({ bookId: book.id })).currentPage).toBe(1);
		await alice.reading.saveProgress({ bookId: book.id, page: 7 });
		expect((await alice.reading.getBook({ bookId: book.id })).currentPage).toBe(7);
		expect((await bob.reading.getBook({ bookId: book.id })).currentPage).toBe(1);
		await alice.reading.createBookmark({ bookId: book.id, page: 7, content: "나의 생각" });
		expect((await alice.reading.listBookmarks({ bookId: book.id, page: 7 }))[0]?.isMine).toBe(true);
		expect(await bob.reading.listBookmarks({ bookId: book.id, page: 7 })).toEqual([]);
		const [invalid] = await safe(alice.reading.saveProgress({ bookId: book.id, page: 21 }));
		expect(invalid).toMatchObject({ code: "BAD_REQUEST" });
		expect((await alice.reading.getBook({ bookId: book.id })).currentPage).toBe(7);
		const [missing] = await safe(alice.reading.getBook({ bookId: "missing" }));
		expect(missing).toMatchObject({ code: "NOT_FOUND" });
	});
	it("serves the health endpoint and API documentation", async () => {
		const health = await app.request("/api/health", {}, env);
		expect(await health.json()).toEqual({ status: "ok" });
		expect((await app.request("/api/docs", {}, env)).status).toBe(200);
	});
	it("uses the built-in questions when no Gemini key is configured", async () => {
		const book = await client.reading.createBook({ title: "책", author: "저자", pageCount: 10 });
		const result = await clientWithoutKey.reading.generateQuestions({
			bookId: book.id,
			page: 1,
			context: "한 사람이 길을 나섰다.",
		});
		expect(result.source).toBe("fallback");
		expect(result.questions).toEqual(await client.reading.listQuestionTemplates());
		const [invalid] = await safe(
			client.reading.generateQuestions({ bookId: book.id, page: 11, context: "내용" }),
		);
		expect(invalid).toMatchObject({ code: "BAD_REQUEST" });
	});
	it("lists optional question templates and compares answers for the same book, page and question", async () => {
		const templates = await client.reading.listQuestionTemplates();
		expect(templates.map((template) => template.id)).toContain("question");
		const book = await client.reading.createBook({
			title: "질문 책",
			author: "저자",
			pageCount: 30,
		});
		const input = { bookId: book.id, page: 4, templateId: "question" as const };
		expect(await client.reading.listQuestionAnswers(input)).toEqual([]);
		const first = await client.reading.createQuestionAnswer({ ...input, content: "왜 그랬을까?" });
		const second = await client.reading.createQuestionAnswer({
			...input,
			content: "무엇이 바뀌었을까?",
		});
		await client.reading.createQuestionAnswer({ ...input, page: 5, content: "다른 페이지" });
		await client.reading.createQuestionAnswer({
			...input,
			templateId: "emotion",
			content: "놀라움",
		});
		expect(await client.reading.listQuestionAnswers(input)).toEqual(
			expect.arrayContaining([first, second]),
		);
		expect(await client.reading.listQuestionAnswers(input)).toHaveLength(2);
		const [invalidPage] = await safe(
			client.reading.createQuestionAnswer({ ...input, page: 31, content: "생각" }),
		);
		expect(invalidPage).toMatchObject({ code: "BAD_REQUEST" });
		const [missing] = await safe(
			client.reading.listQuestionAnswers({ ...input, bookId: "missing" }),
		);
		expect(isDefinedError(missing) && missing.code).toBe("NOT_FOUND");
		const [empty] = await safe(client.reading.createQuestionAnswer({ ...input, content: " " }));
		expect(empty).toMatchObject({ code: "BAD_REQUEST" });
	});
	it("creates and lists books and page-specific bookmarks", async () => {
		const book = await client.reading.createBook({ title: "책", author: "저자", pageCount: 100 });
		expect(await client.reading.listBooks()).toContainEqual(book);
		const first = await client.reading.createBookmark({
			bookId: book.id,
			page: 5,
			content: "생각",
		});
		await client.reading.createBookmark({ bookId: book.id, page: 6, content: "다른 생각" });
		expect(await client.reading.listBookmarks({ bookId: book.id, page: 5 })).toEqual([first]);
	});

	it("rejects missing books and out-of-range pages", async () => {
		const [missing] = await safe(client.reading.listBookmarks({ bookId: "missing", page: 1 }));
		expect(isDefinedError(missing) && missing.code).toBe("NOT_FOUND");
		const book = await client.reading.createBook({ title: "책", author: "저자", pageCount: 10 });
		const [invalid] = await safe(
			client.reading.createBookmark({ bookId: book.id, page: 11, content: "생각" }),
		);
		expect(invalid).toMatchObject({ code: "BAD_REQUEST" });
		const [empty] = await safe(
			client.reading.createBookmark({ bookId: book.id, page: 1, content: "  " }),
		);
		expect(empty).toMatchObject({ code: "BAD_REQUEST" });
	});
});
