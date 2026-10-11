import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { orpc } from "@/shared/api";

/**
 * Optimistic: the checkbox flips instantly, rolls back if the request fails,
 * and the global mutation cache refetches the list once it settles.
 */
export function useToggleTodo() {
	const queryClient = useQueryClient();
	const listKey = orpc.todo.list.queryKey();

	return useMutation(
		orpc.todo.update.mutationOptions({
			onMutate: async ({ id, ...changes }) => {
				await queryClient.cancelQueries({ queryKey: listKey });
				const previous = queryClient.getQueryData(listKey);
				queryClient.setQueryData(listKey, (todos) =>
					todos?.map((todo) => (todo.id === id ? { ...todo, ...changes } : todo)),
				);
				return { previous };
			},
			onError: (_error, _input, result) => {
				queryClient.setQueryData(listKey, result?.previous);
				toast.error("변경에 실패했어요. 잠시 후 다시 시도해주세요.");
			},
		}),
	);
}
