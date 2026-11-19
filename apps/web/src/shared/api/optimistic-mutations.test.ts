import { expect, test } from "bun:test";
import type { Trace } from "@app/contract";
import { QueryClient } from "@tanstack/react-query";
import { Window } from "happy-dom";
import { OptimisticCache } from "./optimistic-cache";

test("reaction changes and failures update counts consistently across trace and book caches", async () => {
	if (typeof window === "undefined")
		Object.assign(globalThis, { window: new Window({ url: "http://localhost:3000" }) });
	const { orpc } = await import("./client");
	const { optimisticPatches } = await import("./optimistic-mutations");
	const client = new QueryClient();
	const cache = new OptimisticCache(client);
	const trace: Trace = {
		id: "trace",
		libraryId: "library",
		bookId: "book",
		ch: 0,
		p: 0,
		s: 0,
		e: 1,
		quote: "글",
		kind: "memo",
		text: "생각",
		q: null,
		emoji: null,
		data: null,
		parentId: null,
		author: { id: "author", nick: "이름", color: null },
		isMine: false,
		createdAt: "2026-11-17T00:00:00.000Z",
		reactions: [{ emoji: "❤️", count: 2 }],
		myReaction: "❤️",
	};
	const listKey = orpc.traces.list.queryKey({ input: { libraryId: "library", bookId: "book" } });
	const detailKey = orpc.books.get.queryKey({ input: { libraryId: "library", bookId: "book" } });
	client.setQueryData(listKey, [trace]);
	client.setQueryData(detailKey, {
		book: {
			id: "book",
			title: "책",
			author: "작가",
			edition: "판본",
			sourceUrl: null,
			license: null,
			color: "#285C48",
			libraryId: null,
			addedBy: null,
			createdAt: trace.createdAt,
			chapterCount: 1,
			chars: 1,
			canRemove: false,
			traceCount: 1,
			readerCount: 1,
			lastTraceAt: trace.createdAt,
			saved: false,
			progress: null,
			readIn: [],
		},
		chapters: [],
		opening: [],
		readers: [trace.author],
		recentTraces: [trace],
	});
	const mutationKey = orpc.reactions.set.mutationOptions().mutationKey;
	const first = cache.begin(
		optimisticPatches(client, mutationKey, { traceId: "trace", emoji: "🌱" }),
	);
	expect(client.getQueryData(listKey)?.[0]?.reactions).toEqual([
		{ emoji: "❤️", count: 1 },
		{ emoji: "🌱", count: 1 },
	]);
	const second = cache.begin(
		optimisticPatches(client, mutationKey, { traceId: "trace", emoji: "😂" }),
	);
	first(false);
	expect(client.getQueryData(listKey)?.[0]?.reactions).toEqual([
		{ emoji: "❤️", count: 1 },
		{ emoji: "😂", count: 1 },
	]);
	expect(client.getQueryData(detailKey)?.recentTraces[0]?.myReaction).toBe("😂");
	second(false);
	expect(client.getQueryData(listKey)?.[0]).toEqual(trace);
	client.clear();
});

test("creates a memo immediately, commits its real ID, and rolls back a failed deletion with its replies", async () => {
	if (typeof window === "undefined")
		Object.assign(globalThis, { window: new Window({ url: "http://localhost:3000" }) });
	const { orpc } = await import("./client");
	const { optimisticPatches } = await import("./optimistic-mutations");
	const client = new QueryClient();
	const cache = new OptimisticCache(client);
	const key = orpc.traces.list.queryKey({ input: { libraryId: "library", bookId: "book" } });
	client.setQueryData(key, []);
	const create = cache.begin(
		optimisticPatches(client, orpc.traces.create.mutationOptions().mutationKey, {
			libraryId: "library",
			bookId: "book",
			ch: 0,
			p: 0,
			s: 0,
			e: 1,
			quote: "글",
			kind: "memo",
			text: "생각",
		}),
	);
	const temporary = client.getQueryData(key)?.[0];
	expect(temporary?.id.startsWith("optimistic:")).toBe(true);
	if (!temporary) throw new Error("no optimistic memo");
	create(true, { ...temporary, id: "server-id" });
	expect(client.getQueryData(key)?.map((trace) => trace.id)).toEqual(["server-id"]);
	const reply = { ...temporary, id: "reply", kind: "reply" as const, parentId: "server-id" };
	client.setQueryData(key, [{ ...temporary, id: "server-id" }, reply]);
	const remove = cache.begin(
		optimisticPatches(client, orpc.traces.remove.mutationOptions().mutationKey, {
			traceId: "server-id",
		}),
	);
	expect(client.getQueryData(key)).toHaveLength(0);
	remove(false);
	expect(client.getQueryData(key)?.map((trace) => trace.id)).toEqual(["server-id", "reply"]);
	client.clear();
});
