import type { Book } from "@app/contract";
import type { QueryClient } from "@tanstack/react-query";
import { orpc } from "@/shared/api";

function booksIn(data: unknown): Book[] {
	if (!data || typeof data !== "object") return [];
	if (Array.isArray(data)) return data as Book[];
	const value = data as { pages?: { items: Book[] }[]; books?: Book[] };
	if (value.pages) return value.pages.flatMap((page) => page.items);
	return value.books ?? [];
}

/** A book already loaded by a list or search, so its detail screen can draw before the request returns. */
export function findCachedBook(client: QueryClient, bookId: string): Book | undefined {
	for (const [, data] of client.getQueriesData({ queryKey: orpc.books.key() })) {
		const book = booksIn(data).find((item) => item.id === bookId);
		if (book) return book;
	}
	return undefined;
}
