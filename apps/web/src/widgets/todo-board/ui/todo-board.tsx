import { TodoItem, useTodosQuery } from "@/entities/todo";
import { AddTodoForm } from "@/features/todo/add";
import { DeleteTodoButton } from "@/features/todo/delete";
import { ToggleTodoButton } from "@/features/todo/toggle";

export function TodoBoard() {
	const { data: todos, isLoading, isError } = useTodosQuery();

	return (
		<section className="mx-auto flex w-full max-w-md flex-col gap-4">
			<AddTodoForm />
			{isLoading && <p className="text-sm text-slate-400">불러오는 중...</p>}
			{isError && (
				<p className="text-sm text-red-500">
					목록을 불러오지 못했어요. API 서버가 켜져 있는지 확인하세요 (루트에서 bun dev).
				</p>
			)}
			{todos && (
				<ul className="flex flex-col gap-2">
					{todos.map((todo) => (
						<TodoItem
							key={todo.id}
							todo={todo}
							leading={<ToggleTodoButton todo={todo} />}
							actions={<DeleteTodoButton todo={todo} />}
						/>
					))}
				</ul>
			)}
		</section>
	);
}
