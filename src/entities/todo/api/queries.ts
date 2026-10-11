import { useQuery } from "@tanstack/react-query";
import { fetchTodos } from "./todo-api";

/** Query key factory — keeps invalidation call sites (in features) typo-proof. */
export const todoKeys = {
	all: ["todos"] as const,
};

export function useTodosQuery() {
	return useQuery({
		queryKey: todoKeys.all,
		queryFn: fetchTodos,
	});
}
