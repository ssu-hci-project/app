import { and, desc, eq } from "drizzle-orm";
import { bookmarks, books } from "../db/schema";
import { os } from "../orpc";
import { noteView, ownedNote, requireGroup, writeSharedNote } from "./reading-access";

export const notesRouter = {
	listMine: os.notes.listMine.handler(async ({ context }) =>
		(
			await context.db
				.select()
				.from(bookmarks)
				.where(eq(bookmarks.userId, context.userId))
				.orderBy(desc(bookmarks.createdAt))
		).map((note) => noteView(note, context.userId)),
	),
	get: os.notes.get.handler(async ({ context, input, errors }) => {
		const note = await context.db
			.select()
			.from(bookmarks)
			.where(eq(bookmarks.id, input.noteId))
			.get();
		if (!note) throw errors.NOT_FOUND();
		if (note.userId !== context.userId && note.visibility !== "legacy") {
			if (note.visibility !== "group" || !note.groupId) throw errors.NOT_FOUND();
			await requireGroup(context.db, note.groupId, context.userId);
		}
		return noteView(note, context.userId);
	}),
	create: os.notes.create.handler(async ({ context, input, errors }) => {
		const book = await context.db.select().from(books).where(eq(books.id, input.bookId)).get();
		if (!book) throw errors.NOT_FOUND();
		if (input.page > book.pageCount) throw errors.BAD_REQUEST();
		const [note] = await context.db
			.insert(bookmarks)
			.values({
				...input,
				userId: context.userId,
				visibility: "private",
				updatedAt: new Date().toISOString(),
			})
			.returning();
		if (!note) throw new Error("Insert returned no row");
		return noteView(note, context.userId);
	}),
	update: os.notes.update.handler(async ({ context, input }) => {
		const note = await ownedNote(context.db, input.noteId, context.userId);
		if (note.visibility === "group" && note.groupId) {
			await requireGroup(context.db, note.groupId, context.userId);
			return writeSharedNote(context.db, note.id, context.userId, {
				content: input.content,
				quote: input.quote,
				prompt: input.prompt ?? null,
			});
		}
		await context.db
			.update(bookmarks)
			.set({
				content: input.content,
				quote: input.quote,
				prompt: input.prompt ?? null,
				updatedAt: new Date().toISOString(),
			})
			.where(and(eq(bookmarks.id, note.id), eq(bookmarks.userId, context.userId)));
		return noteView(await ownedNote(context.db, note.id, context.userId), context.userId);
	}),
	remove: os.notes.remove.handler(async ({ context, input }) => {
		await ownedNote(context.db, input.noteId, context.userId);
		await context.db
			.delete(bookmarks)
			.where(and(eq(bookmarks.id, input.noteId), eq(bookmarks.userId, context.userId)));
		return { removed: true as const };
	}),
	setVisibility: os.notes.setVisibility.handler(async ({ context, input, errors }) => {
		const note = await ownedNote(context.db, input.noteId, context.userId);
		if (input.groupId) {
			const group = await requireGroup(context.db, input.groupId, context.userId);
			if (group.bookId !== note.bookId) throw errors.BAD_REQUEST();
			return writeSharedNote(context.db, note.id, context.userId, {
				visibility: "group",
				groupId: group.id,
			});
		}
		await context.db
			.update(bookmarks)
			.set({
				visibility: "private",
				groupId: null,
				sharedVersion: 0,
				updatedAt: new Date().toISOString(),
			})
			.where(and(eq(bookmarks.id, note.id), eq(bookmarks.userId, context.userId)));
		return noteView(await ownedNote(context.db, note.id, context.userId), context.userId);
	}),
};
