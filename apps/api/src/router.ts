import { os } from "./orpc";
import { todoRouter } from "./routers/todo";

export const router = os.router({
	health: os.health.handler(() => ({ status: "ok" as const })),
	todo: todoRouter,
});
