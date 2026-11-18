import { env } from "cloudflare:workers";
import { safe } from "@orpc/client";
import { describe, expect, it } from "vitest";
import { createDb } from "../src/db";
import { books } from "../src/db/schema";
import { createReader } from "./reader";

describe("book cursor pagination", () => {
	it("pages tied timestamps without duplicates or skipped books when rows are inserted or removed", async () => {
		const reader = createReader();
		const [library] = await reader.libraries.list();
		if (!library) throw new Error("missing library");
		const profile = await reader.profile.get();
		const prefix = crypto.randomUUID();
		const db = createDb(env.DB);
		const rows = Array.from({ length: 45 }, (_, i) => ({
			id: `${prefix}-${String(i).padStart(3, "0")}`,
			title: `책 ${i}`,
			author: "작가",
			pageCount: 0,
			libraryId: library.id,
			addedBy: profile.id,
			createdAt: "2026-11-17T00:00:00.000Z",
		}));
		for (const row of rows) await db.insert(books).values(row);
		const input = { libraryId: library.id, scope: "uploaded" as const, limit: 20 };
		let page = await reader.books.listPage(input);
		expect(page.items).toHaveLength(20);
		const seen = page.items.map((book) => book.id);
		await env.DB.prepare("DELETE FROM books WHERE id = ?").bind(page.items.at(-1)?.id).run();
		await db.insert(books).values({
			...rows[0],
			id: `${prefix}-new`,
			title: "새 책",
			author: "작가",
			pageCount: 0,
			createdAt: "2026-11-18T00:00:00.000Z",
		});
		while (page.nextCursor) {
			page = await reader.books.listPage({ ...input, cursor: page.nextCursor });
			seen.push(...page.items.map((book) => book.id));
		}
		expect(seen).toHaveLength(45);
		expect(new Set(seen).size).toBe(45);
		expect(seen).not.toContain(`${prefix}-new`);
	});

	it("filters saved books on the server and rejects nonmembers and excessive page sizes", async () => {
		const reader = createReader();
		const [library] = await reader.libraries.list();
		if (!library) throw new Error("missing library");
		expect((await reader.books.listPage({ libraryId: library.id, scope: "saved" })).items).toEqual(
			[],
		);
		const [forbidden] = await safe(createReader().books.listPage({ libraryId: library.id }));
		expect(forbidden).toMatchObject({ code: "FORBIDDEN" });
		const [invalid] = await safe(reader.books.listPage({ libraryId: library.id, limit: 100 }));
		expect(invalid).toMatchObject({ code: "BAD_REQUEST" });
	});
});
