import { Trash2 } from "lucide-react";
import type { Todo } from "@/entities/todo";
import { Button } from "@/shared/ui";
import { useDeleteTodo } from "../model/use-delete-todo";

export function DeleteTodoButton({ todo }: { todo: Todo }) {
	const { mutate, isPending } = useDeleteTodo();

	return (
		<Button
			variant="ghost"
			size="icon-sm"
			aria-label={`${todo.title} 삭제`}
			disabled={isPending}
			onClick={() => mutate({ id: todo.id })}
		>
			<Trash2 />
		</Button>
	);
}
