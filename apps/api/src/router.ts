import { os } from "./orpc";
import { booksRouter, progressRouter, readsRouter, savedRouter } from "./routers/books";
import { groupsRouter } from "./routers/groups";
import { librariesRouter } from "./routers/libraries";
import { notesRouter } from "./routers/notes";
import { profileRouter } from "./routers/profile";
import { questionsRouter } from "./routers/questions";
import { readingRouter } from "./routers/reading";
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
	reading: readingRouter,
	notes: notesRouter,
	groups: groupsRouter,
});
