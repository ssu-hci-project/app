import type { Book, Library, Profile, Trace, TraceInput } from "@app/contract";
import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { orpc } from "./client";
import type { CachePatch } from "./optimistic-cache";

type Detail = { book: Book; recentTraces: Trace[]; readers: Trace["author"][] };
const inputOf = (key: QueryKey) =>
	(key[1] as { input?: { bookId?: string; libraryId?: string } } | undefined)?.input;

/** Build domain-specific cache changes once for all callers of an API mutation. */
export function optimisticPatches(
	client: QueryClient,
	key: QueryKey | undefined,
	input: unknown,
): CachePatch[] {
	const path = Array.isArray(key?.[0]) ? key[0].join(".") : "";
	const patches: CachePatch[] = [];
	const patch = <T>(prefix: QueryKey, update: (value: T, key: QueryKey, result?: unknown) => T) => {
		for (const [queryKey, data] of client.getQueriesData<T>({ queryKey: prefix })) {
			if (data === undefined) continue;
			patches.push({
				key: queryKey,
				update: (value, result) => update(value as T, queryKey, result),
			});
		}
	};
	const traceLists = (update: (rows: Trace[], key: QueryKey, result?: unknown) => Trace[]) => {
		patch<Trace[]>(orpc.traces.list.key(), update);
		patch<Detail>(orpc.books.get.key(), (detail, queryKey, result) => ({
			...detail,
			recentTraces: update(detail.recentTraces, queryKey, result)
				.filter((trace) => trace.kind === "memo" || trace.kind === "qa")
				.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
				.slice(0, 3),
		}));
	};
	const bookLists = (update: (rows: Book[], key: QueryKey) => Book[]) => {
		patch<Book[]>(orpc.books.list.key(), update);
		patch<{ pages: { items: Book[]; nextCursor: unknown }[] }>(
			orpc.books.listPage.key(),
			(data, queryKey) => ({
				...data,
				pages: data.pages.map((page) => ({ ...page, items: update(page.items, queryKey) })),
			}),
		);
	};
	const profile = client.getQueryData<Profile>(orpc.profile.get.queryKey());
	if (path === "traces.create") {
		const values = input as TraceInput;
		const parent =
			values.kind === "reply"
				? client
						.getQueriesData<Trace[]>({ queryKey: orpc.traces.list.key() })
						.flatMap(([, rows]) => rows ?? [])
						.find((trace) => trace.id === values.parentId)
				: undefined;
		if (values.kind === "reply" && !parent) return [];
		const anchor = values.kind === "reply" ? parent : values;
		if (!anchor) return [];
		const temporary: Trace = {
			...anchor,
			id: `optimistic:${crypto.randomUUID()}`,
			kind: values.kind,
			text: "text" in values ? values.text : null,
			q: "q" in values ? values.q : null,
			emoji: "emoji" in values ? values.emoji : null,
			data: "data" in values ? values.data : null,
			parentId: values.kind === "reply" ? values.parentId : null,
			author: { id: profile?.id ?? "", nick: profile?.nick ?? null, color: profile?.color ?? null },
			isMine: true,
			createdAt: new Date().toISOString(),
			reactions: [],
			myReaction: null,
		};
		traceLists((rows, queryKey, result) => {
			const target = inputOf(queryKey);
			if (target?.bookId !== temporary.bookId || target.libraryId !== temporary.libraryId)
				return rows;
			const trace = (result as Trace | undefined) ?? temporary;
			return [...rows.filter((row) => row.id !== trace.id && row.id !== temporary.id), trace];
		});
	} else if (path === "traces.remove") {
		const { traceId } = input as { traceId: string };
		traceLists((rows) => rows.filter((row) => row.id !== traceId && row.parentId !== traceId));
	} else if (path === "reactions.set") {
		const { traceId, emoji } = input as { traceId: string; emoji: string | null };
		traceLists((rows) =>
			rows.map((row) => {
				if (row.id !== traceId || row.myReaction === emoji) return row;
				const counts = new Map(row.reactions.map((reaction) => [reaction.emoji, reaction.count]));
				if (row.myReaction) counts.set(row.myReaction, (counts.get(row.myReaction) ?? 1) - 1);
				if (emoji) counts.set(emoji, (counts.get(emoji) ?? 0) + 1);
				return {
					...row,
					myReaction: emoji,
					reactions: [...counts]
						.filter(([, count]) => count > 0)
						.map(([reaction, count]) => ({ emoji: reaction, count })),
				};
			}),
		);
	} else if (path === "saved.set") {
		const { bookId, saved } = input as { bookId: string; saved: boolean };
		bookLists((rows, queryKey) => {
			const scope = (queryKey[1] as { input?: { scope?: string } } | undefined)?.input?.scope;
			return rows
				.map((book) => (book.id === bookId ? { ...book, saved } : book))
				.filter((book) => scope !== "saved" || book.saved)
				.filter(
					(book) => scope !== "mine" || book.saved || book.progress || book.addedBy === profile?.id,
				);
		});
		patch<Detail>(orpc.books.get.key(), (detail) =>
			detail.book.id === bookId ? { ...detail, book: { ...detail.book, saved } } : detail,
		);
	} else if (path === "books.remove") {
		const { bookId } = input as { bookId: string };
		bookLists((rows) => rows.filter((book) => book.id !== bookId));
	} else if (path === "profile.save") {
		const values = input as { nick: string; color: string };
		patch<Profile>(orpc.profile.get.key(), (row) => ({ ...row, ...values }));
		patch<Library[]>(orpc.libraries.list.key(), (rows) =>
			rows.map((library) => ({
				...library,
				members: library.members.map((member) =>
					member.id === profile?.id ? { ...member, ...values } : member,
				),
			})),
		);
		traceLists((rows) =>
			rows.map((row) => (row.isMine ? { ...row, author: { ...row.author, ...values } } : row)),
		);
	} else if (path === "libraries.leave") {
		const { libraryId } = input as { libraryId: string };
		patch<Library[]>(orpc.libraries.list.key(), (rows) =>
			rows.filter((library) => library.id !== libraryId),
		);
	}
	return patches;
}
