import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { orpc } from "@/shared/api";

export function useToggleTodo() {
	const queryClient = useQueryClient();

	return useMutation(
		orpc.todo.update.mutationOptions({
			onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.todo.key() }),
			onError: () => toast.error("변경에 실패했어요. 잠시 후 다시 시도해주세요."),
		}),
	);
}
