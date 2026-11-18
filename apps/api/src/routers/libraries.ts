import type { Library } from "@app/contract";
import { and, asc, eq, inArray, ne, or, sql } from "drizzle-orm";
import type { Db } from "../db";
import { books, libraries, libraryMembers } from "../db/schema";
import { createInviteCode, normaliseInviteCode } from "../lib/invite-code";
import { SAMPLE_LIBRARY_ID } from "../lib/sample";
import { os } from "../orpc";
import { ensurePersonalLibrary, people, requireMember } from "./access";

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
			createdAt: row.createdAt,
			members: members
				.filter((member) => member.libraryId === row.id)
				.map(
					(member) => profiles.get(member.userId) ?? { id: member.userId, nick: null, color: null },
				),
		};
	});
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
	create: os.libraries.create.handler(async ({ context, input }) => {
		const library = {
			id: crypto.randomUUID(),
			name: input.name,
			inviteCode: createInviteCode(),
			ownerId: context.userId,
			personal: false,
			createdAt: new Date().toISOString(),
		};
		await context.db.batch([
			context.db.insert(libraries).values(library),
			context.db
				.insert(libraryMembers)
				.values({ libraryId: library.id, userId: context.userId, joinedAt: library.createdAt }),
		]);
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
			joined: !!view?.members.some((member) => member.id === context.userId),
		};
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
