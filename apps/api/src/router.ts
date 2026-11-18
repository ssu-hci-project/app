import { os } from "./orpc";
import { booksRouter, progressRouter, readsRouter, savedRouter } from "./routers/books";
import { librariesRouter } from "./routers/libraries";
import { profileRouter } from "./routers/profile";
import { questionsRouter } from "./routers/questions";
import { reactionsRouter, tracesRouter } from "./routers/traces";

export const router = os.router({
	session: os.session.handler(() => ({ ready: true as const })),
	health: os.health.handler(() => ({ status: "ok" as const })),
	profile: profileRouter,
	libraries: librariesRouter,
	books: booksRouter,
	saved: savedRouter,
	progress: progressRouter,
	reads: readsRouter,
	traces: tracesRouter,
	reactions: reactionsRouter,
	questions: questionsRouter,
});
