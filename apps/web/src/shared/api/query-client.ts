import { MutationCache, QueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";
import { orpc } from "./client";
import { OptimisticCache } from "./optimistic-cache";
import { optimisticPatches } from "./optimistic-mutations";

declare module "@tanstack/react-query" {
	interface Register {
		mutationMeta: { invalidates?: QueryKey[] };
	}
}

const transactions = new WeakMap<object, (success: boolean, data?: unknown) => void>();
const bookLists = [orpc.books.list.key(), orpc.books.listPage.key()];
const traceLists = [orpc.traces.list.key(), orpc.books.get.key(), orpc.books.search.key()];
const mutationInvalidations: Record<string, QueryKey[]> = {
	"traces.create": [...traceLists, ...bookLists],
	"traces.remove": [...traceLists, ...bookLists],
	"reactions.set": traceLists,
	"saved.set": [...bookLists, orpc.books.get.key(), orpc.books.search.key()],
	"books.remove": [
		orpc.books.key(),
		orpc.traces.list.key(),
		orpc.reads.month.key(),
		orpc.libraries.preview.key(),
	],
	"profile.save": [
		orpc.profile.get.key(),
		orpc.libraries.list.key(),
		orpc.libraries.preview.key(),
		...traceLists,
	],
	"libraries.create": [orpc.libraries.list.key(), ...bookLists],
	"libraries.addBooks": [orpc.libraries.list.key(), orpc.libraries.preview.key(), ...bookLists],
	"libraries.join": [orpc.libraries.list.key(), orpc.libraries.preview.key()],
	"libraries.leave": [orpc.libraries.list.key(), orpc.libraries.preview.key()],
};
const pendingInvalidations = new Map<string, QueryKey>();
let invalidateAll = false;

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
			if (!error || changed) {
				const path = mutation.options.mutationKey?.[0];
				const keys =
					mutation.meta?.invalidates ??
					(Array.isArray(path) ? mutationInvalidations[path.join(".")] : undefined);
				if (keys) {
					for (const key of keys) pendingInvalidations.set(JSON.stringify(key), key);
				} else invalidateAll = true;
			}
			if (optimistic.isPending) return;
			const keys = [...pendingInvalidations.values()];
			pendingInvalidations.clear();
			if (invalidateAll) {
				invalidateAll = false;
				return queryClient.invalidateQueries();
			}
			return Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
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
