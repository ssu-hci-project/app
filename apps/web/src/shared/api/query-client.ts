import { MutationCache, QueryClient } from "@tanstack/react-query";

export const queryClient: QueryClient = new QueryClient({
	// Any settled mutation refetches every active query, so a mutation hook
	// never has to remember which keys it touched. Returning the promise keeps
	// the mutation pending until fresh data has arrived (no stale flash).
	mutationCache: new MutationCache({
		onSettled: () => queryClient.invalidateQueries(),
	}),
	defaultOptions: {
		queries: {
			staleTime: 60 * 1000,
			retry: 1,
			refetchOnWindowFocus: false,
		},
	},
});
