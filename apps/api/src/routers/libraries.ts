import type { GroupBook, Library } from "@app/contract";
import { and, asc, eq, inArray, ne, or, sql } from "drizzle-orm";
import type { Db } from "../db";
import { books, libraries, libraryBooks, libraryMembers } from "../db/schema";
import { createInviteCode, normaliseInviteCode } from "../lib/invite-code";
import { SAMPLE_LIBRARY_ID } from "../lib/sample";
import { os } from "../orpc";
import { colorOf, ensurePersonalLibrary, people, requireMember, visibleIn } from "./access";

type LibraryRow = typeof libraries.$inferSelect;

async function views(db: Db, rows: LibraryRow[], userId: string): Promise<Library[]> {
	if (!rows.length) return [];
	const members = await db
		.select()
		.from(libraryMembers)
		.where(
			inArray(
				libraryMembers.libraryId,
				rows.map((row) => row.id),
			),
		)
		.orderBy(asc(libraryMembers.joinedAt));
	const shelves = await groupShelves(
		db,
		rows.filter((row) => !row.personal).map((row) => row.id),
	);
	const profiles = await people(db, [
		...members.map((member) => member.userId),
		...rows.map((row) => row.ownerId),
	]);
	return rows.map((row) => {
		const isOwner = row.ownerId === userId;
		const owner = profiles.get(row.ownerId);
		return {
			id: row.id,
			name: row.personal && !isOwner ? `${owner?.nick ?? "독자"}의 서재` : row.name,
			inviteCode: row.inviteCode,
			personal: row.personal,
			isOwner,
			books: shelves.get(row.id) ?? [],
			createdAt: row.createdAt,
			members: members
				.filter((member) => member.libraryId === row.id)
				.map(
					(member) => profiles.get(member.userId) ?? { id: member.userId, nick: null, color: null },
				),
		};
	});
}

/** Each group's shelf, oldest first. */
async function groupShelves(db: Db, ids: string[]): Promise<Map<string, GroupBook[]>> {
	const shelves = new Map<string, GroupBook[]>();
	if (!ids.length) return shelves;
	const rows = await db
		.select({
			libraryId: libraryBooks.libraryId,
			id: books.id,
			title: books.title,
			author: books.author,
			color: books.color,
		})
		.from(libraryBooks)
		.innerJoin(books, eq(books.id, libraryBooks.bookId))
		.where(and(inArray(libraryBooks.libraryId, ids), eq(books.status, "ready")))
		.orderBy(asc(libraryBooks.addedAt), asc(books.title));
	for (const { libraryId, ...book } of rows) {
		const shelf = shelves.get(libraryId) ?? [];
		shelf.push({ ...book, color: colorOf(book) });
		shelves.set(libraryId, shelf);
	}
	return shelves;
}

/** Puts books readable in the group on its shelf. Returns false if any of them is not readable. */
async function shelve(db: Db, library: LibraryRow, bookIds: string[], userId: string) {
	const ids = [...new Set(bookIds)];
	if (!ids.length) return true;
	const found = await db
		.select({ id: books.id })
		.from(books)
		.where(and(inArray(books.id, ids), visibleIn(library.id)));
	if (found.length !== ids.length) return false;
	const addedAt = new Date().toISOString();
	await db
		.insert(libraryBooks)
		.values(
			ids.map((bookId, index) => ({
				libraryId: library.id,
				bookId,
				addedBy: userId,
				// Keeps the chosen order when several books are added at once.
				addedAt: new Date(Date.parse(addedAt) + index).toISOString(),
			})),
		)
		.onConflictDoNothing();
	return true;
}

/** Old group invites are lowercase UUIDs; newer codes match regardless of case. */
async function findByCode(db: Db, input: string) {
	const code = normaliseInviteCode(input);
	if (!code) return undefined;
	return db
		.select()
		.from(libraries)
		.where(
			and(
				or(eq(libraries.inviteCode, code), eq(libraries.inviteCode, code.toUpperCase())),
				ne(libraries.id, SAMPLE_LIBRARY_ID),
			),
		)
		.get();
}

export const librariesRouter = {
	list: os.libraries.list.handler(async ({ context }) => {
		const memberships = () =>
			context.db
				.select({ library: libraries })
				.from(libraryMembers)
				.innerJoin(libraries, eq(libraries.id, libraryMembers.libraryId))
				.where(eq(libraryMembers.userId, context.userId))
				.orderBy(asc(libraryMembers.joinedAt));
		let rows = await memberships();
		if (!rows.some(({ library }) => library.personal && library.ownerId === context.userId)) {
			await ensurePersonalLibrary(context.db, context.userId);
			rows = await memberships();
		}
		const list = rows.map((row) => row.library);
		// My own personal library first.
		list.sort(
			(a, b) =>
				Number(b.personal && b.ownerId === context.userId) -
				Number(a.personal && a.ownerId === context.userId),
		);
		return views(context.db, list, context.userId);
	}),
	create: os.libraries.create.handler(async ({ context, input, errors }) => {
		const library = {
			id: crypto.randomUUID(),
			name: input.name,
			inviteCode: createInviteCode(),
			ownerId: context.userId,
			personal: false,
			createdAt: new Date().toISOString(),
		};
		// A new group can read only public-domain books until someone uploads one to it.
		if (input.bookIds.length) {
			const found = await context.db
				.select({ id: books.id })
				.from(books)
				.where(and(inArray(books.id, input.bookIds), visibleIn(library.id)));
			if (found.length !== new Set(input.bookIds).size) throw errors.NOT_FOUND();
		}
		await context.db.batch([
			context.db.insert(libraries).values(library),
			context.db
				.insert(libraryMembers)
				.values({ libraryId: library.id, userId: context.userId, joinedAt: library.createdAt }),
		]);
		await shelve(context.db, library, input.bookIds, context.userId);
		const [view] = await views(context.db, [library], context.userId);
		if (!view) throw new Error("library view missing");
		return view;
	}),
	preview: os.libraries.preview.handler(async ({ context, input, errors }) => {
		const library = await findByCode(context.db, input.code);
		if (!library) throw errors.NOT_FOUND();
		const [view] = await views(context.db, [library], context.userId);
		const bookCount = await context.db
			.select({ count: sql<number>`count(*)` })
			.from(books)
			.where(and(eq(books.libraryId, library.id), eq(books.status, "ready")))
			.get();
		return {
			id: library.id,
			name: view?.name ?? library.name,
			memberCount: view?.members.length ?? 0,
			bookCount: bookCount?.count ?? 0,
			books: view?.books ?? [],
			joined: !!view?.members.some((member) => member.id === context.userId),
		};
	}),
	addBooks: os.libraries.addBooks.handler(async ({ context, input, errors }) => {
		const library = await requireMember(context.db, input.libraryId, context.userId);
		if (library.personal) throw errors.BAD_REQUEST();
		if (!(await shelve(context.db, library, input.bookIds, context.userId)))
			throw errors.NOT_FOUND();
		const [view] = await views(context.db, [library], context.userId);
		if (!view) throw new Error("library view missing");
		return view;
	}),
	join: os.libraries.join.handler(async ({ context, input, errors }) => {
		const library = await findByCode(context.db, input.code);
		if (!library) throw errors.NOT_FOUND();
		await context.db
			.insert(libraryMembers)
			.values({
				libraryId: library.id,
				userId: context.userId,
				joinedAt: new Date().toISOString(),
			})
			.onConflictDoNothing();
		const [view] = await views(context.db, [library], context.userId);
		if (!view) throw new Error("library view missing");
		return view;
	}),
	leave: os.libraries.leave.handler(async ({ context, input, errors }) => {
		const library = await requireMember(context.db, input.libraryId, context.userId);
		if (library.personal && library.ownerId === context.userId) throw errors.BAD_REQUEST();
		await context.db
			.delete(libraryMembers)
			.where(
				and(
					eq(libraryMembers.libraryId, input.libraryId),
					eq(libraryMembers.userId, context.userId),
				),
			);
		return { left: true as const };
	}),
};
