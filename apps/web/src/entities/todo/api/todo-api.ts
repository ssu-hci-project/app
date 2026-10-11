import { z } from "zod";
import { apiClient } from "@/shared/api";
import { env } from "@/shared/config";
import { type Todo, todoSchema } from "../model/types";
import { mockCreateTodo, mockFetchTodos } from "./mock";

export async function fetchTodos(): Promise<Todo[]> {
	if (env.VITE_USE_MOCK) {
		return mockFetchTodos();
	}
	const { data } = await apiClient.get("/todos");
	return z.array(todoSchema).parse(data);
}

export async function createTodo(title: string): Promise<Todo> {
	if (env.VITE_USE_MOCK) {
		return mockCreateTodo(title);
	}
	const { data } = await apiClient.post("/todos", { title });
	return todoSchema.parse(data);
}
