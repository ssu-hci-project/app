import { cn, dayjs } from "@/shared/lib";
import type { Todo } from "../model/types";

export function TodoItem({ todo }: { todo: Todo }) {
	return (
		<li className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
			<span className={cn(todo.completed && "text-slate-400 line-through")}>{todo.title}</span>
			<span className="text-xs text-slate-400">{dayjs(todo.createdAt).fromNow()}</span>
		</li>
	);
}
