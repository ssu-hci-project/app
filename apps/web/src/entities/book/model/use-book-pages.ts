import { useInfiniteQuery } from "@tanstack/react-query";
import { orpc } from "@/shared/api";

export function useBookPages(
	libraryId: string,
	scope: "catalog" | "group" | "shared" | "mine" | "saved" | "uploaded",
	enabled = true,
) {
	return useInfiniteQuery(
		orpc.books.listPage.infiniteOptions({
			input: (cursor: { createdAt: string; id: string } | null) => ({
				libraryId,
				scope,
				cursor,
				limit: 20,
			}),
			initialPageParam: null,
			getNextPageParam: (last) => last.nextCursor,
			enabled: !!libraryId && enabled,
		}),
	);
}
