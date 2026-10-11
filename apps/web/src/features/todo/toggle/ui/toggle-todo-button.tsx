import { Check } from "lucide-react";
import type { Todo } from "@/entities/todo";
import { cn } from "@/shared/lib";
import { useToggleTodo } from "../model/use-toggle-todo";

export function ToggleTodoButton({ todo }: { todo: Todo }) {
	const { mutate, isPending } = useToggleTodo();

	return (
		<button
			type="button"
			aria-label={todo.completed ? "완료 취소" : "완료로 표시"}
			aria-pressed={todo.completed}
			disabled={isPending}
			onClick={() => mutate({ id: todo.id, completed: !todo.completed })}
			className={cn(
				"flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
				todo.completed
					? "border-primary bg-primary text-primary-foreground"
					: "border-input hover:border-muted-foreground",
			)}
		>
			{todo.completed && <Check className="size-4" />}
		</button>
	);
}
