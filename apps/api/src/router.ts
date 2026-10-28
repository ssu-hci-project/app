import { os } from "./orpc";
import { readingRouter } from "./routers/reading";
import { todoRouter } from "./routers/todo";

export const router = os.router({
	health: os.health.handler(() => ({ status: "ok" as const })),
	todo: todoRouter,
	reading: readingRouter,
});
