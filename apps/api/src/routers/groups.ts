import { and, asc, eq, gt, ne, or, sql } from "drizzle-orm";
import { bookmarks, books, groups, memberships, seenNotes } from "../db/schema";
import { os } from "../orpc";
import { noteView, requireGroup } from "./reading-access";

// 8 characters without look-alikes (0/O, 1/I/L) so a code can be read aloud.
const inviteAlphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function createInviteCode() {
	return Array.from(
		crypto.getRandomValues(new Uint8Array(8)),
		(byte) => inviteAlphabet[byte % inviteAlphabet.length],
	).join("");
}
// Older invites are lowercase UUIDs; new codes are matched regardless of case.
const inviteCodeIs = (code: string) =>
	or(eq(groups.inviteCode, code.trim()), eq(groups.inviteCode, code.trim().toUpperCase()));

export const groupsRouter = {
	list: os.groups.list.handler(async ({ context }) => {
		const rows = await context.db
			.select({ group: groups })
			.from(groups)
			.innerJoin(memberships, eq(groups.id, memberships.groupId))
			.where(eq(memberships.userId, context.userId));
		return Promise.all(
			rows.map(async ({ group }) => {
				const unread = await context.db
					.select({ page: bookmarks.page })
					.from(bookmarks)
					.leftJoin(
						seenNotes,
						and(eq(seenNotes.noteId, bookmarks.id), eq(seenNotes.userId, context.userId)),
					)
					.where(
						and(
							eq(bookmarks.groupId, group.id),
							eq(bookmarks.visibility, "group"),
							ne(bookmarks.userId, context.userId),
							gt(bookmarks.sharedVersion, sql`coalesce(${seenNotes.version}, 0)`),
						),
					);
				const members = await context.db
					.select({ count: sql<number>`count(*)` })
					.from(memberships)
					.where(eq(memberships.groupId, group.id))
					.get();
				return {
					...group,
					unreadCount: unread.length,
					memberCount: members?.count ?? 1,
					unreadPages: [...new Set(unread.map((note) => note.page))].sort((a, b) => a - b),
				};
			}),
		);
	}),
	create: os.groups.create.handler(async ({ context, input, errors }) => {
		const book = await context.db.select().from(books).where(eq(books.id, input.bookId)).get();
		if (!book) throw errors.NOT_FOUND();
		const group = {
			...input,
			id: crypto.randomUUID(),
			inviteCode: createInviteCode(),
			createdAt: new Date().toISOString(),
		};
		await context.db.batch([
			context.db.insert(groups).values(group),
			context.db.insert(memberships).values({ groupId: group.id, userId: context.userId }),
		]);
		return { ...group, unreadCount: 0, memberCount: 1, unreadPages: [] };
	}),
	previewInvite: os.groups.previewInvite.handler(async ({ context, input, errors }) => {
		const group = await context.db.select().from(groups).where(inviteCodeIs(input.code)).get();
		if (!group) throw errors.NOT_FOUND();
		const book = await context.db.select().from(books).where(eq(books.id, group.bookId)).get();
		if (!book) throw errors.NOT_FOUND();
		const member = await context.db
			.select()
			.from(memberships)
			.where(and(eq(memberships.groupId, group.id), eq(memberships.userId, context.userId)))
			.get();
		return { groupId: group.id, name: group.name, book, joined: !!member };
	}),
	join: os.groups.join.handler(async ({ context, input, errors }) => {
		const group = await context.db.select().from(groups).where(inviteCodeIs(input.code)).get();
		if (!group) throw errors.NOT_FOUND();
		await context.db
			.insert(memberships)
			.values({ groupId: group.id, userId: context.userId })
			.onConflictDoNothing();
		return { groupId: group.id, bookId: group.bookId };
	}),
	leave: os.groups.leave.handler(async ({ context, input }) => {
		await requireGroup(context.db, input.groupId, context.userId);
		await context.db.batch([
			context.db
				.update(bookmarks)
				.set({ visibility: "private", groupId: null, sharedVersion: 0 })
				.where(and(eq(bookmarks.groupId, input.groupId), eq(bookmarks.userId, context.userId))),
			context.db
				.delete(memberships)
				.where(and(eq(memberships.groupId, input.groupId), eq(memberships.userId, context.userId))),
		]);
		return { left: true as const };
	}),
	page: os.groups.page.handler(async ({ context, input, errors }) => {
		const group = await requireGroup(context.db, input.groupId, context.userId);
		const book = await context.db.select().from(books).where(eq(books.id, group.bookId)).get();
		if (!book || input.page > book.pageCount) throw errors.BAD_REQUEST();
		return (
			await context.db
				.select()
				.from(bookmarks)
				.where(
					and(
						eq(bookmarks.groupId, group.id),
						eq(bookmarks.visibility, "group"),
						eq(bookmarks.page, input.page),
					),
				)
				.orderBy(asc(bookmarks.sharedVersion))
		).map((note) => noteView(note, context.userId));
	}),
	markSeen: os.groups.markSeen.handler(async ({ context, input, errors }) => {
		await requireGroup(context.db, input.groupId, context.userId);
		const note = await context.db
			.select()
			.from(bookmarks)
			.where(
				and(
					eq(bookmarks.id, input.noteId),
					eq(bookmarks.groupId, input.groupId),
					eq(bookmarks.visibility, "group"),
				),
			)
			.get();
		if (!note || note.sharedVersion < input.version) throw errors.BAD_REQUEST();
		await context.db
			.insert(seenNotes)
			.values({ userId: context.userId, noteId: note.id, version: input.version })
			.onConflictDoUpdate({
				target: [seenNotes.userId, seenNotes.noteId],
				set: { version: sql`max(${seenNotes.version}, ${input.version})` },
			});
		return { seen: true as const };
	}),
};
