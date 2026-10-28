import { os } from "./orpc";
import { readingRouter } from "./routers/reading";

export const router = os.router({
	health: os.health.handler(() => ({ status: "ok" as const })),
	reading: readingRouter,
});
