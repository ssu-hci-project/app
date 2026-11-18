import { expect, test } from "bun:test";
import type { Book } from "@app/contract";
import { QueryClient } from "@tanstack/react-query";
import { Window } from "happy-dom";

const book = (id: string) => ({ id, title: id }) as Book;

test("finds a book in paged lists, plain lists and search results", async () => {
	if (typeof window === "undefined")
		Object.assign(globalThis, { window: new Window({ url: "http://localhost:3000" }) });
	const { orpc } = await import("@/shared/api");
	const { findCachedBook } = await import("./cached-book");
	const client = new QueryClient();
	client.setQueryData(
		orpc.books.listPage.infiniteKey({
			input: () => ({ libraryId: "l", scope: "catalog" as const, cursor: null, limit: 20 }),
			initialPageParam: null,
		}),
		{ pages: [{ items: [book("a")], nextCursor: null }], pageParams: [null] },
	);
	client.setQueryData(orpc.books.list.queryKey({ input: { libraryId: "l" } }), [book("b")]);
	client.setQueryData(orpc.books.search.queryKey({ input: { libraryId: "l", q: "c" } }), {
		bookIds: ["c"],
		books: [book("c")],
		titles: {},
		passages: [],
		traces: [],
	});
	expect(findCachedBook(client, "a")?.title).toBe("a");
	expect(findCachedBook(client, "b")?.title).toBe("b");
	expect(findCachedBook(client, "c")?.title).toBe("c");
	expect(findCachedBook(client, "missing")).toBeUndefined();
});
