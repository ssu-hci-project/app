import { delay } from "es-toolkit/promise";
import type { Todo } from "../model/types";

let mockTodos: Todo[] = [
	{
		id: "1",
		title: "발표 슬라이드 준비",
		completed: false,
		createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
	},
	{
		id: "2",
		title: "데모 시나리오 리허설",
		completed: true,
		createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
	},
];

const MOCK_LATENCY_MS = 300;

export async function mockFetchTodos(): Promise<Todo[]> {
	await delay(MOCK_LATENCY_MS);
	return [...mockTodos];
}

export async function mockCreateTodo(title: string): Promise<Todo> {
	await delay(MOCK_LATENCY_MS);
	const todo: Todo = {
		id: crypto.randomUUID(),
		title,
		completed: false,
		createdAt: new Date().toISOString(),
	};
	mockTodos = [...mockTodos, todo];
	return todo;
}
