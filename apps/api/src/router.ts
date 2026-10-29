import { os } from "./orpc";
import { groupsRouter } from "./routers/groups";
import { notesRouter } from "./routers/notes";
import { readingRouter } from "./routers/reading";

export const router = os.router({
	session: os.session.handler(() => ({ ready: true as const })),
	health: os.health.handler(() => ({ status: "ok" as const })),
	reading: readingRouter,
	notes: notesRouter,
	groups: groupsRouter,
});
