import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/shared/api";

export function useTodosQuery() {
	return useQuery(orpc.todo.list.queryOptions());
}
