import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import app from "../src/index";
import { createReader } from "./reader";

describe("unified books", () => {
	it("serves health and documentation without exposing the retired reader", async () => {
		expect(await (await app.request("/api/health", {}, env)).json()).toEqual({ status: "ok" });
		const docs = await app.request("/api/docs", {}, env);
		expect(docs.status).toBe(200);
		expect((await app.request("/api/books", {}, env)).status).toBe(404);
		expect((await app.request("/api/rpc/reading/listBooks", {}, env)).status).toBe(404);
	});

	it("converts a legacy book to chapters without changing existing paragraph anchors", async () => {
		const id = crypto.randomUUID();
		const existing = crypto.randomUUID();
		for (const bookId of [id, existing]) {
			await env.DB.prepare(
				"INSERT INTO books (id, title, author, page_count, created_at) VALUES (?, '예전 책', '작가', 2, '2026-11-17T00:00:00.000Z')",
			)
				.bind(bookId)
				.run();
			await env.DB.prepare(
				"INSERT INTO book_pages (book_id, page, text) VALUES (?, 1, ?), (?, 2, ?)",
			)
				.bind(bookId, "첫 문단.\n\n둘째 문단.", bookId, "마지막 문단.")
				.run();
		}
		await env.DB.prepare("INSERT INTO book_chapters VALUES (?, 0, '기존 장', 6)")
			.bind(existing)
			.run();
		await env.DB.prepare("INSERT INTO book_paragraphs VALUES (?, 0, 0, '기존 문단.')")
			.bind(existing)
			.run();
		const migration = env.TEST_MIGRATIONS.find((entry) => entry.name.includes("0010_unify-books"));
		if (!migration) throw new Error("missing book migration");
		await env.DB.batch(migration.queries.map((query) => env.DB.prepare(query)));
		const reader = createReader();
		const [library] = await reader.libraries.list();
		if (!library) throw new Error("missing library");
		const chapter = await reader.books.chapter({ libraryId: library.id, bookId: id, ch: 0 });
		expect(chapter.paragraphs).toEqual(["첫 문단.", "둘째 문단.", "마지막 문단."]);
		const untouched = await reader.books.chapter({
			libraryId: library.id,
			bookId: existing,
			ch: 0,
		});
		expect(untouched.paragraphs).toEqual(["기존 문단."]);
		const detail = await reader.books.get({ libraryId: library.id, bookId: id });
		expect(detail.book.chapterCount).toBe(1);
	});
});
