import { expect, spyOn, test } from "bun:test";
import { Window } from "happy-dom";
import { createElement, type ReactNode } from "react";

test("saves once despite query refreshes and rerenders, debounces page changes, and cancels on unmount", async () => {
	const browser = new Window({ url: "http://localhost:3000" });
	Object.assign(globalThis, {
		window: browser,
		document: browser.document,
		navigator: browser.navigator,
		localStorage: browser.localStorage,
		IS_REACT_ACT_ENVIRONMENT: true,
	});
	const { act, renderHook } = await import("@testing-library/react/pure");
	const { QueryClientProvider, QueryObserver } = await import("@tanstack/react-query");
	const { orpc, queryClient } = await import("@/shared/api");
	const { useReadingProgress } = await import("./use-reading-progress");
	const writes: { ch: number; ratio: number; pct: number }[] = [];
	const requestHandler = async (input: RequestInfo | URL, init?: RequestInit) => {
		const request = new Request(
			typeof input === "string" ? new URL(input, browser.location.href) : input,
			init,
		);
		if (request.url.endsWith("/api/session")) return Response.json({ ready: true });
		if (!request.url.endsWith("/api/rpc/progress/save")) throw new Error(request.url);
		const { json } = (await request.json()) as { json: (typeof writes)[number] };
		writes.push(json);
		return Response.json({ json: { ...json, updatedAt: new Date().toISOString() } });
	};
	const network = spyOn(globalThis, "fetch").mockImplementation(
		Object.assign(requestHandler, { preconnect: globalThis.fetch.preconnect }),
	);
	let readerFetches = 0;
	const observer = new QueryObserver(queryClient, {
		queryKey: orpc.books.chapter.key({ input: { libraryId: "library", bookId: "book", ch: 0 } }),
		queryFn: async () => ++readerFetches,
	});
	const unsubscribe = observer.subscribe(() => {});
	const wait = () =>
		act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 1150));
		});
	const props = { bookId: "book", ch: 0, page: 0, pages: 10, pct: 10, ready: true };
	const hook = renderHook(useReadingProgress, {
		initialProps: props,
		wrapper: ({ children }: { children: ReactNode }) =>
			createElement(QueryClientProvider, { client: queryClient }, children),
	});
	try {
		await wait();
		expect(writes).toHaveLength(1);
		for (let index = 0; index < 20; index++) hook.rerender({ ...props });
		await act(async () => {
			await observer.refetch();
		});
		await wait();
		expect(writes).toHaveLength(1);
		expect(readerFetches).toBe(2);
		hook.rerender({ ...props, page: 1, pct: 20 });
		hook.rerender({ ...props, page: 2, pct: 30 });
		await wait();
		expect(writes).toHaveLength(2);
		expect(writes[1]).toMatchObject({ ch: 0, ratio: 0.2, pct: 30 });
		expect(readerFetches).toBe(2);
		hook.rerender({ ...props, page: 3, pct: 40 });
		hook.unmount();
		await wait();
		expect(writes).toHaveLength(2);
	} finally {
		hook.unmount();
		unsubscribe();
		queryClient.clear();
		network.mockRestore();
		await browser.happyDOM.close();
	}
}, 10_000);
