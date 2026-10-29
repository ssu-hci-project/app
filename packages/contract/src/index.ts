import { oc } from "@orpc/contract";
import { z } from "zod";
import { groupsContract } from "./groups";
import { notesContract } from "./notes";
import { readingContract } from "./reading";

export type { ReadingGroup } from "./groups";
export { groupInputSchema } from "./groups";
export { noteInputSchema } from "./notes";
export type { Book, Bookmark } from "./reading";
export { bookmarkSchema } from "./reading";

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
	reading: readingContract,
	notes: notesContract,
	groups: groupsContract,
};

export type Contract = typeof contract;
