import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { orpc } from "@/shared/api";

export function useCreateTodo() {
	const queryClient = useQueryClient();

	return useMutation(
		orpc.todo.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: orpc.todo.key() });
				toast.success("할 일을 추가했어요");
			},
			onError: () => {
				toast.error("추가에 실패했어요. 잠시 후 다시 시도해주세요.");
			},
		}),
	);
}
