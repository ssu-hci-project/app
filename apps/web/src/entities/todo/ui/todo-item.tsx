import type { ReactNode } from "react";
import { cn, dayjs } from "@/shared/lib";
import type { Todo } from "../model/types";

type TodoItemProps = {
	todo: Todo;
	/** Slot for leading controls (e.g. a toggle) supplied by features. */
	leading?: ReactNode;
	/** Slot for trailing controls (e.g. delete) supplied by features. */
	actions?: ReactNode;
};

export function TodoItem({ todo, leading, actions }: TodoItemProps) {
	return (
		<li className="flex items-center gap-3 rounded-md border px-3 py-2">
			{leading}
			<div className="flex min-w-0 flex-1 flex-col">
				<span className={cn("truncate", todo.completed && "text-muted-foreground line-through")}>
					{todo.title}
				</span>
				<span className="text-xs text-muted-foreground">{dayjs(todo.createdAt).fromNow()}</span>
			</div>
			{actions}
		</li>
	);
}
