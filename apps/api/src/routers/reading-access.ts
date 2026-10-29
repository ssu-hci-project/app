import { ORPCError } from "@orpc/server";
import { and, eq, sql } from "drizzle-orm";
import type { Db } from "../db";
import { bookmarks, groups, memberships, shareEvents } from "../db/schema";

export function noteView(
	{ userId: author, ...note }: typeof bookmarks.$inferSelect,
	userId: string,
) {
	return { ...note, updatedAt: note.updatedAt ?? note.createdAt, isMine: author === userId };
}
export async function requireGroup(db: Db, groupId: string, userId: string) {
	const membership = await db
		.select()
		.from(memberships)
		.where(and(eq(memberships.groupId, groupId), eq(memberships.userId, userId)))
		.get();
	if (!membership) throw new ORPCError("FORBIDDEN", { message: "이 모임에 먼저 참여해주세요" });
	const group = await db.select().from(groups).where(eq(groups.id, groupId)).get();
	if (!group) throw new ORPCError("NOT_FOUND");
	return group;
}
export async function ownedNote(db: Db, noteId: string, userId: string) {
	const note = await db
		.select()
		.from(bookmarks)
		.where(and(eq(bookmarks.id, noteId), eq(bookmarks.userId, userId)))
		.get();
	if (!note) throw new ORPCError("NOT_FOUND", { message: "기록을 찾을 수 없습니다" });
	return note;
}

// The event and updated record commit together so a read receipt cannot overtake publication.
export async function writeSharedNote(
	db: Db,
	noteId: string,
	userId: string,
	values: Partial<typeof bookmarks.$inferInsert>,
) {
	const key = crypto.randomUUID();
	await db.batch([
		db.insert(shareEvents).values({ key }),
		db
			.update(bookmarks)
			.set({
				...values,
				updatedAt: new Date().toISOString(),
				sharedVersion: sql`(select id from share_events where key = ${key})`,
			})
			.where(
				and(
					eq(bookmarks.id, noteId),
					eq(bookmarks.userId, userId),
					values.groupId
						? sql`exists (select 1 from memberships where group_id = ${values.groupId} and user_id = ${userId})`
						: undefined,
				),
			),
	]);
	const saved = await ownedNote(db, noteId, userId);
	if (values.groupId && saved.groupId !== values.groupId) throw new ORPCError("FORBIDDEN");
	return noteView(saved, userId);
}
