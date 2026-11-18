import type { Drawing, Person, Trace } from "@app/contract";
import { ORPCError } from "@orpc/server";
import { and, eq, inArray, isNull, or } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import type { Db } from "../db";
import { books, libraries, libraryMembers, profiles, reactions, traces } from "../db/schema";
import { bookColor } from "../lib/book-color";
import { createInviteCode } from "../lib/invite-code";
import { SAMPLE_BASE_TIME, SAMPLE_LIBRARY_ID } from "../lib/sample";

export async function requireMember(db: Db, libraryId: string, userId: string) {
	const row = await db
		.select({ library: libraries })
		.from(libraryMembers)
		.innerJoin(libraries, eq(libraries.id, libraryMembers.libraryId))
		.where(and(eq(libraryMembers.libraryId, libraryId), eq(libraryMembers.userId, userId)))
		.get();
	if (!row) throw new ORPCError("FORBIDDEN", { message: "이 서재에 먼저 참여해주세요" });
	return row.library;
}

/** Books this library can read: public-domain ones and the ones uploaded to it. */
export const visibleIn = (libraryId: string) =>
	and(or(isNull(books.libraryId), eq(books.libraryId, libraryId)), eq(books.status, "ready"));

/** A ready book the reader may open through `libraryId`. */
export async function requireBook(db: Db, bookId: string, libraryId: string, userId: string) {
	const row = await db
		.select({ library: libraries, book: books })
		.from(libraryMembers)
		.innerJoin(libraries, eq(libraries.id, libraryMembers.libraryId))
		.leftJoin(books, and(eq(books.id, bookId), visibleIn(libraryId)))
		.where(and(eq(libraryMembers.libraryId, libraryId), eq(libraryMembers.userId, userId)))
		.get();
	if (!row) throw new ORPCError("FORBIDDEN", { message: "이 서재에 먼저 참여해주세요" });
	if (!row.book) throw new ORPCError("NOT_FOUND", { message: "책을 찾을 수 없어요" });
	return { book: row.book, library: row.library };
}

export const colorOf = (book: { id: string; color: string | null }) =>
	book.color ?? bookColor(book.id);

export async function people(db: Db, ids: string[]): Promise<Map<string, Person>> {
	const unique = [...new Set(ids)];
	const rows: (typeof profiles.$inferSelect)[] = [];
	for (let start = 0; start < unique.length; start += 90)
		rows.push(
			...(await db
				.select()
				.from(profiles)
				.where(inArray(profiles.userId, unique.slice(start, start + 90)))),
		);
	const byId = new Map(rows.map((profile) => [profile.userId, profile]));
	return new Map(
		unique.map((id) => {
			const row = byId.get(id);
			return [id, { id, nick: row?.nick ?? null, color: row?.color ?? null }];
		}),
	);
}

/** Adds authors and reaction counts to trace rows. */
export async function traceViews(
	db: Db,
	rows: (typeof traces.$inferSelect)[],
	userId: string,
): Promise<Trace[]> {
	if (!rows.length) return [];
	const ids = rows.map((row) => row.id);
	const reactionRows: (typeof reactions.$inferSelect)[] = [];
	// D1 binds at most 100 parameters per statement.
	for (let start = 0; start < ids.length; start += 90) {
		reactionRows.push(
			...(await db
				.select()
				.from(reactions)
				.where(inArray(reactions.traceId, ids.slice(start, start + 90)))),
		);
	}
	const authors = await people(
		db,
		rows.map((row) => row.authorId),
	);
	const byTrace = new Map<string, (typeof reactionRows)[number][]>();
	for (const reaction of reactionRows) {
		const group = byTrace.get(reaction.traceId);
		if (group) group.push(reaction);
		else byTrace.set(reaction.traceId, [reaction]);
	}
	return rows.map(({ authorId, data, ...row }) => {
		const mine = byTrace.get(row.id) ?? [];
		const counts = new Map<string, number>();
		for (const reaction of mine) counts.set(reaction.emoji, (counts.get(reaction.emoji) ?? 0) + 1);
		return {
			...row,
			data: data ? (JSON.parse(data) as Drawing) : null,
			author: authors.get(authorId) ?? { id: authorId, nick: null, color: null },
			isMine: authorId === userId,
			reactions: [...counts].map(([emoji, count]) => ({ emoji, count })),
			myReaction: mine.find((reaction) => reaction.userId === userId)?.emoji ?? null,
		};
	});
}

/**
 * Every reader has a one-person library. The first call creates it and copies the sample
 * readers' traces into it, so the built-in books are not empty.
 */
export async function ensurePersonalLibrary(db: Db, userId: string) {
	const existing = await db
		.select()
		.from(libraries)
		.where(and(eq(libraries.ownerId, userId), eq(libraries.personal, true)))
		.get();
	if (existing) return existing;
	const now = new Date();
	const library = {
		id: crypto.randomUUID(),
		name: "나의 서재",
		inviteCode: createInviteCode(),
		ownerId: userId,
		personal: true,
		createdAt: now.toISOString(),
	};
	await db.batch([
		db.insert(libraries).values(library),
		db
			.insert(libraryMembers)
			.values({ libraryId: library.id, userId, joinedAt: library.createdAt }),
	]);
	await copySamples(db, library.id, now.getTime());
	return library;
}

async function copySamples(db: Db, libraryId: string, now: number) {
	const rows = await db.select().from(traces).where(eq(traces.libraryId, SAMPLE_LIBRARY_ID));
	if (!rows.length) return;
	const copyId = (id: string) => `${libraryId}:${id}`;
	const sampleReactions = await db
		.select()
		.from(reactions)
		.where(
			inArray(
				reactions.traceId,
				rows.map((row) => row.id),
			),
		);
	// Parents first, so a reply's parent exists when it is inserted.
	const ordered = [...rows].sort((a, b) => Number(!!a.parentId) - Number(!!b.parentId));
	await runBatch(db, [
		...ordered.map((row) =>
			db.insert(traces).values({
				...row,
				id: copyId(row.id),
				libraryId,
				parentId: row.parentId ? copyId(row.parentId) : null,
				createdAt: new Date(now - (SAMPLE_BASE_TIME - Date.parse(row.createdAt))).toISOString(),
			}),
		),
		...sampleReactions.map((reaction) =>
			db.insert(reactions).values({ ...reaction, traceId: copyId(reaction.traceId) }),
		),
	]);
}

/** `db.batch` for a list that may be empty. Statements commit together. */
export async function runBatch(db: Db, items: BatchItem<"sqlite">[]) {
	const [first, ...rest] = items;
	if (first) await db.batch([first, ...rest]);
}
