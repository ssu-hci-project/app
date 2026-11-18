import { expect, test } from "bun:test";
import { QueryClient } from "@tanstack/react-query";
import { OptimisticCache } from "./optimistic-cache";

test("rolling back overlapping writes keeps the latest successful change", () => {
	const client = new QueryClient();
	const key = ["reactions"];
	client.setQueryData(key, { emoji: null });
	const cache = new OptimisticCache(client);
	const first = cache.begin([{ key, update: () => ({ emoji: "❤️" }) }]);
	const second = cache.begin([{ key, update: () => ({ emoji: "🌱" }) }]);
	expect<unknown>(client.getQueryData<unknown>(key)).toEqual({ emoji: "🌱" });
	first(false);
	expect<unknown>(client.getQueryData<unknown>(key)).toEqual({ emoji: "🌱" });
	second(true);
	expect<unknown>(client.getQueryData<unknown>(key)).toEqual({ emoji: "🌱" });
	expect(cache.isPending).toBe(false);
	client.clear();
});

test("two failed writes restore the server state rather than an earlier optimistic value", () => {
	const client = new QueryClient();
	const key = ["saved"];
	client.setQueryData(key, false);
	const cache = new OptimisticCache(client);
	const first = cache.begin([{ key, update: () => true }]);
	const second = cache.begin([{ key, update: () => false }]);
	first(false);
	second(false);
	expect<unknown>(client.getQueryData<unknown>(key)).toBe(false);
	client.clear();
});

test("replaces temporary creations with server results without losing another pending creation", () => {
	const client = new QueryClient();
	const key = ["traces"];
	client.setQueryData(key, []);
	const cache = new OptimisticCache(client);
	const add = (id: string) => [
		{ key, update: (rows: unknown, result?: unknown) => [...(rows as string[]), result ?? id] },
	];
	const first = cache.begin(add("temporary-a"));
	const second = cache.begin(add("temporary-b"));
	first(true, "server-a");
	expect<unknown>(client.getQueryData<unknown>(key)).toEqual(["server-a", "temporary-b"]);
	second(false);
	expect<unknown>(client.getQueryData<unknown>(key)).toEqual(["server-a"]);
	client.clear();
});
