import { MutationCache, QueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";
import { OptimisticCache } from "./optimistic-cache";
import { optimisticPatches } from "./optimistic-mutations";

declare module "@tanstack/react-query" {
	interface Register {
		mutationMeta: { invalidates?: QueryKey[] };
	}
}

const transactions = new WeakMap<object, (success: boolean, data?: unknown) => void>();
export const queryClient: QueryClient = new QueryClient({
	// Ordinary writes refresh active queries. Frequent progress writes only refresh
	// the shelf and calendar, never the reader queries that triggered the save.
	mutationCache: new MutationCache({
		onMutate: async (variables, mutation) => {
			const patches = optimisticPatches(queryClient, mutation.options.mutationKey, variables);
			if (!patches.length) return;
			await Promise.all(
				patches.map(({ key }) => queryClient.cancelQueries({ queryKey: key, exact: true })),
			);
			transactions.set(mutation, optimistic.begin(patches));
		},
		onSuccess: (_data, _variables, _result, mutation) => {
			transactions.get(mutation)?.(true, _data);
		},
		onError: (_error, _variables, _result, mutation) => {
			const rollback = transactions.get(mutation);
			rollback?.(false);
			const path = mutation.options.mutationKey?.[0];
			if (Array.isArray(path) && path.join(".") === "traces.remove") {
				toast.error("흔적을 지우지 못했어요. 다시 시도해주세요.");
				return;
			}
			if (!rollback) return;
			toast.error("저장하지 못해 이전 상태로 되돌렸어요. 다시 시도해주세요.");
		},
		onSettled: (_data, error, _variables, _result, mutation) => {
			const changed = transactions.has(mutation);
			transactions.delete(mutation);
			if (optimistic.isPending || (error && !changed)) return;
			const keys = mutation.meta?.invalidates;
			return keys
				? Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })))
				: queryClient.invalidateQueries();
		},
	}),
	defaultOptions: {
		queries: {
			staleTime: 60 * 1000,
			retry: 1,
			refetchOnWindowFocus: false,
		},
	},
});
const optimistic = new OptimisticCache(queryClient);
