import { oc } from "@orpc/contract";
import { z } from "zod";
import { booksContract, progressContract, readsContract, savedContract } from "./books";
import { groupsContract } from "./groups";
import { librariesContract } from "./libraries";
import { notesContract } from "./notes";
import { profileContract } from "./profile";
import { questionsContract } from "./questions";
import { readingContract } from "./reading";
import { reactionsContract, tracesContract } from "./traces";

export type {
	Book,
	ChapterInfo,
	PassageHit,
	ReadingProgress,
} from "./books";
export { bookUploadSchema, UPLOAD_CHUNK_CHARS, UPLOAD_PARAGRAPH_CHARS } from "./books";
export type { Person } from "./common";
export { reactionEmojis, readerColors } from "./common";
export type { ReadingGroup } from "./groups";
export { groupInputSchema } from "./groups";
export type { Library } from "./libraries";
export { libraryNameSchema } from "./libraries";
export { noteInputSchema } from "./notes";
export type { Profile } from "./profile";
export { profileInputSchema } from "./profile";
export type { Question } from "./questions";
export type { Book as LegacyBook, Bookmark } from "./reading";
export { bookmarkSchema } from "./reading";
export type { Decoration, Drawing, Stroke, Trace, TraceInput, TraceKind } from "./traces";
export { DRAWING_LIMIT, memoTextSchema, tapePatterns, traceKinds } from "./traces";

/**
 * The single source of truth for the API: every procedure's path, input and
 * output lives here. `apps/api` implements it, `apps/web` calls it — both get
 * the same types, so a change here is a type error on both sides until fixed.
 */
export const contract = {
	session: oc
		.route({ method: "GET", path: "/session", tags: ["system"] })
		.output(z.object({ ready: z.literal(true) })),
	health: oc
		.route({ method: "GET", path: "/health", summary: "Health check", tags: ["system"] })
		.output(z.object({ status: z.literal("ok") })),
	profile: profileContract,
	libraries: librariesContract,
	books: booksContract,
	saved: savedContract,
	progress: progressContract,
	reads: readsContract,
	traces: tracesContract,
	reactions: reactionsContract,
	questions: questionsContract,
	reading: readingContract,
	notes: notesContract,
	groups: groupsContract,
};

export type Contract = typeof contract;
