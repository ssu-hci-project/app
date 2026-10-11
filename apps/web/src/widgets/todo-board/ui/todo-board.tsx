import { TodoItem, useTodosQuery } from "@/entities/todo";
import { AddTodoForm } from "@/features/add-todo";

export function TodoBoard() {
	const { data: todos, isLoading, isError } = useTodosQuery();

	return (
		<section className="mx-auto flex w-full max-w-md flex-col gap-4">
			<AddTodoForm />
			{isLoading && <p className="text-sm text-slate-400">불러오는 중...</p>}
			{isError && (
				<p className="text-sm text-red-500">
					목록을 불러오지 못했어요. VITE_API_BASE_URL이 가리키는 백엔드가 켜져 있는지 확인하세요.
				</p>
			)}
			{todos && (
				<ul className="flex flex-col gap-2">
					{todos.map((todo) => (
						<TodoItem key={todo.id} todo={todo} />
					))}
				</ul>
			)}
		</section>
	);
}
