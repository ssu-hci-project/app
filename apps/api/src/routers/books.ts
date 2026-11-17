import type { Book, PassageHit } from "@app/contract";
import {
	and,
	asc,
	count,
	countDistinct,
	desc,
	eq,
	inArray,
	like,
	max,
	ne,
	or,
	sql,
} from "drizzle-orm";
import type { Db } from "../db";
import {
	bookChapters,
	bookParagraphs,
	books,
	type libraries,
	progress,
	reads,
	savedBooks,
	traces,
} from "../db/schema";
import { bookColor } from "../lib/book-color";
import { os } from "../orpc";
import {
	colorOf,
	people,
	requireBook,
	requireMember,
	runBatch,
	traceViews,
	visibleIn,
} from "./access";

type BookRow = typeof books.$inferSelect;
type LibraryRow = typeof libraries.$inferSelect;

/** Adds chapter totals, this library's trace counts and my own state to book rows. */
async function bookViews(
	db: Db,
	rows: BookRow[],
	library: LibraryRow,
	userId: string,
): Promise<Book[]> {
	if (!rows.length) return [];
	const ids = rows.map((row) => row.id);
	const [chapters, traceStats, saved, mine] = await Promise.all([
		db
			.select({
				bookId: bookChapters.bookId,
				count: count(),
				chars: sql<number>`sum(${bookChapters.chars})`,
			})
			.from(bookChapters)
			.where(inArray(bookChapters.bookId, ids))
			.groupBy(bookChapters.bookId),
		db
			.select({
				bookId: traces.bookId,
				count: count(),
				readers: countDistinct(traces.authorId),
				last: max(traces.createdAt),
			})
			.from(traces)
			.where(
				and(
					eq(traces.libraryId, library.id),
					inArray(traces.bookId, ids),
					ne(traces.kind, "reply"),
				),
			)
			.groupBy(traces.bookId),
		db
			.select({ bookId: savedBooks.bookId })
			.from(savedBooks)
			.where(and(eq(savedBooks.userId, userId), inArray(savedBooks.bookId, ids))),
		db
			.select()
			.from(progress)
			.where(and(eq(progress.userId, userId), inArray(progress.bookId, ids))),
	]);
	return rows.map((row) => {
		const chapter = chapters.find((entry) => entry.bookId === row.id);
		const stat = traceStats.find((entry) => entry.bookId === row.id);
		const own = mine.find((entry) => entry.bookId === row.id);
		return {
			id: row.id,
			title: row.title,
			author: row.author,
			edition: row.edition,
			sourceUrl: row.sourceUrl,
			license: row.license,
			color: colorOf(row),
			libraryId: row.libraryId,
			addedBy: row.addedBy,
			createdAt: row.createdAt,
			chapterCount: chapter?.count ?? 0,
			chars: Number(chapter?.chars ?? 0),
			canRemove: !!row.libraryId && (row.addedBy === userId || library.ownerId === userId),
			traceCount: stat?.count ?? 0,
			readerCount: stat?.readers ?? 0,
			lastTraceAt: stat?.last ?? null,
			saved: saved.some((entry) => entry.bookId === row.id),
			progress: own
				? { ch: own.ch, ratio: own.ratio, pct: own.pct, updatedAt: own.updatedAt }
				: null,
		};
	});
}

async function bookView(db: Db, row: BookRow, library: LibraryRow, userId: string) {
	const [view] = await bookViews(db, [row], library, userId);
	if (!view) throw new Error("book view missing");
	return view;
}

/** LIKE pattern that matches `text` literally. */
const contains = (text: string) => `%${text.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
const escapeLike = sql`escape '\\'`;
const likeAny = (column: Parameters<typeof like>[0], text: string) =>
	sql`${column} like ${contains(text)} ${escapeLike}`;

const PASSAGE_LIMIT = 60;
const PER_PARAGRAPH = 3;
const BEFORE = 30;
const AFTER = 30;

function passageHits(
	rows: { bookId: string; ch: number; p: number; text: string }[],
	query: string,
	titles: Map<string, { title: string; chapters: Map<number, string> }>,
): PassageHit[] {
	const needle = query.toLowerCase();
	const hits: PassageHit[] = [];
	for (const row of rows) {
		const haystack = row.text.toLowerCase();
		let index = haystack.indexOf(needle);
		let found = 0;
		while (index >= 0 && found < PER_PARAGRAPH && hits.length < PASSAGE_LIMIT) {
			const from = Math.max(0, index - BEFORE);
			const to = Math.min(row.text.length, index + query.length + AFTER);
			const book = titles.get(row.bookId);
			hits.push({
				bookId: row.bookId,
				bookTitle: book?.title ?? "",
				ch: row.ch,
				chapterTitle: book?.chapters.get(row.ch) ?? "",
				p: row.p,
				s: index,
				e: index + query.length,
				before: row.text.slice(from, index),
				match: row.text.slice(index, index + query.length),
				after: row.text.slice(index + query.length, to),
				cutBefore: from > 0,
				cutAfter: to < row.text.length,
			});
			found += 1;
			index = haystack.indexOf(needle, index + query.length);
		}
		if (hits.length >= PASSAGE_LIMIT) break;
	}
	return hits;
}

export const booksRouter = {
	list: os.books.list.handler(async ({ context, input }) => {
		const library = await requireMember(context.db, input.libraryId, context.userId);
		const rows = await context.db
			.select()
			.from(books)
			.where(visibleIn(library.id))
			.orderBy(desc(books.createdAt));
		return bookViews(context.db, rows, library, context.userId);
	}),
	get: os.books.get.handler(async ({ context, input }) => {
		const { book, library } = await requireBook(
			context.db,
			input.bookId,
			input.libraryId,
			context.userId,
		);
		const chapters = await context.db
			.select({ ch: bookChapters.ch, title: bookChapters.title, chars: bookChapters.chars })
			.from(bookChapters)
			.where(eq(bookChapters.bookId, book.id))
			.orderBy(asc(bookChapters.ch));
		const opening = await context.db
			.select({ text: bookParagraphs.text })
			.from(bookParagraphs)
			.where(eq(bookParagraphs.bookId, book.id))
			.orderBy(asc(bookParagraphs.ch), asc(bookParagraphs.p))
			.limit(2);
		const authors = await context.db
			.selectDistinct({ id: traces.authorId })
			.from(traces)
			.where(and(eq(traces.libraryId, library.id), eq(traces.bookId, book.id)));
		const recent = await context.db
			.select()
			.from(traces)
			.where(
				and(
					eq(traces.libraryId, library.id),
					eq(traces.bookId, book.id),
					inArray(traces.kind, ["memo", "qa"]),
				),
			)
			.orderBy(desc(traces.createdAt))
			.limit(3);
		const readers = await people(
			context.db,
			authors.map((author) => author.id),
		);
		return {
			book: await bookView(context.db, book, library, context.userId),
			chapters,
			opening: opening.map((row) => row.text),
			readers: [...readers.values()],
			recentTraces: await traceViews(context.db, recent, context.userId),
		};
	}),
	chapter: os.books.chapter.handler(async ({ context, input, errors }) => {
		const { book } = await requireBook(context.db, input.bookId, input.libraryId, context.userId);
		const chapter = await context.db
			.select()
			.from(bookChapters)
			.where(and(eq(bookChapters.bookId, book.id), eq(bookChapters.ch, input.ch)))
			.get();
		if (!chapter) throw errors.NOT_FOUND({ message: "장을 찾을 수 없어요" });
		const paragraphs = await context.db
			.select({ text: bookParagraphs.text })
			.from(bookParagraphs)
			.where(and(eq(bookParagraphs.bookId, book.id), eq(bookParagraphs.ch, input.ch)))
			.orderBy(asc(bookParagraphs.p));
		return {
			ch: chapter.ch,
			title: chapter.title,
			chars: chapter.chars,
			paragraphs: paragraphs.map((row) => row.text),
		};
	}),
	search: os.books.search.handler(async ({ context, input }) => {
		const library = await requireMember(context.db, input.libraryId, context.userId);
		const q = input.q;
		const visible = await context.db
			.select({ id: books.id, title: books.title, author: books.author })
			.from(books)
			.where(visibleIn(library.id));
		const ids = visible.map((book) => book.id);
		const chapters = ids.length
			? await context.db
					.select({ bookId: bookChapters.bookId, ch: bookChapters.ch, title: bookChapters.title })
					.from(bookChapters)
					.where(inArray(bookChapters.bookId, ids))
			: [];
		const titles = new Map(
			visible.map((book) => [
				book.id,
				{
					title: book.title,
					chapters: new Map(
						chapters.filter((row) => row.bookId === book.id).map((row) => [row.ch, row.title]),
					),
				},
			]),
		);
		const needle = q.toLowerCase().replace(/\s+/g, "");
		const squash = (text: string) => text.toLowerCase().replace(/\s+/g, "");
		const bookIds = visible
			.filter(
				(book) =>
					squash(book.title).includes(needle) ||
					squash(book.author).includes(needle) ||
					[...(titles.get(book.id)?.chapters.values() ?? [])].some((title) =>
						squash(title).includes(needle),
					),
			)
			.map((book) => book.id);
		// One Latin letter matches nearly every paragraph; Korean syllables are specific enough.
		const searchText = q.length >= 2 || /[가-힣]/.test(q);
		const paragraphs =
			searchText && ids.length
				? await context.db
						.select()
						.from(bookParagraphs)
						.where(and(inArray(bookParagraphs.bookId, ids), likeAny(bookParagraphs.text, q)))
						.orderBy(asc(bookParagraphs.bookId), asc(bookParagraphs.ch), asc(bookParagraphs.p))
						.limit(PASSAGE_LIMIT)
				: [];
		const traceRows = await context.db
			.select()
			.from(traces)
			.where(
				and(
					eq(traces.libraryId, library.id),
					ne(traces.kind, "underline"),
					or(likeAny(traces.text, q), likeAny(traces.q, q)),
				),
			)
			.orderBy(desc(traces.createdAt))
			.limit(60);
		return {
			bookIds,
			passages: passageHits(paragraphs, q, titles),
			traces: await traceViews(
				context.db,
				traceRows.filter((row) => titles.has(row.bookId)),
				context.userId,
			),
		};
	}),
	uploadBegin: os.books.uploadBegin.handler(async ({ context, input }) => {
		await requireMember(context.db, input.libraryId, context.userId);
		const id = crypto.randomUUID();
		await runBatch(context.db, [
			context.db.insert(books).values({
				id,
				title: input.title,
				author: input.author,
				edition: "직접 올린 책",
				pageCount: 0,
				libraryId: input.libraryId,
				addedBy: context.userId,
				color: bookColor(id),
				status: "uploading",
			}),
			...chunked(input.chapters, 20).map((part, index) =>
				context.db.insert(bookChapters).values(
					part.map((chapter, offset) => ({
						bookId: id,
						ch: index * 20 + offset,
						title: chapter.title,
						chars: chapter.chars,
					})),
				),
			),
		]);
		return { bookId: id };
	}),
	uploadChunk: os.books.uploadChunk.handler(async ({ context, input, errors }) => {
		await requireUpload(context.db, input.bookId, context.userId, errors.NOT_FOUND);
		await runBatch(
			context.db,
			chunked(input.paragraphs, 20).map((part, index) =>
				context.db
					.insert(bookParagraphs)
					.values(
						part.map((text, offset) => ({
							bookId: input.bookId,
							ch: input.ch,
							p: input.start + index * 20 + offset,
							text,
						})),
					)
					.onConflictDoUpdate({
						target: [bookParagraphs.bookId, bookParagraphs.ch, bookParagraphs.p],
						set: { text: sql`excluded.text` },
					}),
			),
		);
		return { received: input.paragraphs.length };
	}),
	uploadFinish: os.books.uploadFinish.handler(async ({ context, input, errors }) => {
		await requireUpload(context.db, input.bookId, context.userId, errors.NOT_FOUND);
		const [chapters, filled] = await Promise.all([
			context.db
				.select({ count: count() })
				.from(bookChapters)
				.where(eq(bookChapters.bookId, input.bookId))
				.get(),
			context.db
				.select({ count: countDistinct(bookParagraphs.ch) })
				.from(bookParagraphs)
				.where(eq(bookParagraphs.bookId, input.bookId))
				.get(),
		]);
		if (!chapters?.count || chapters.count !== filled?.count)
			throw errors.BAD_REQUEST({ message: "아직 올라오지 않은 장이 있어요" });
		await context.db.update(books).set({ status: "ready" }).where(eq(books.id, input.bookId));
		return { bookId: input.bookId };
	}),
	remove: os.books.remove.handler(async ({ context, input, errors }) => {
		const book = await context.db.select().from(books).where(eq(books.id, input.bookId)).get();
		if (!book?.libraryId) throw errors.NOT_FOUND();
		const library = await requireMember(context.db, book.libraryId, context.userId);
		if (book.addedBy !== context.userId && library.ownerId !== context.userId)
			throw errors.FORBIDDEN({ message: "올린 사람이나 서재 관리자만 지울 수 있어요" });
		await context.db.delete(books).where(eq(books.id, book.id));
		return { removed: true as const };
	}),
};

async function requireUpload(db: Db, bookId: string, userId: string, notFound: () => Error) {
	const book = await db
		.select()
		.from(books)
		.where(and(eq(books.id, bookId), eq(books.addedBy, userId), eq(books.status, "uploading")))
		.get();
	if (!book) throw notFound();
	return book;
}

function chunked<T>(items: T[], size: number): T[][] {
	const parts: T[][] = [];
	for (let start = 0; start < items.length; start += size)
		parts.push(items.slice(start, start + size));
	return parts;
}

export const savedRouter = {
	set: os.saved.set.handler(async ({ context, input, errors }) => {
		const book = await context.db.select().from(books).where(eq(books.id, input.bookId)).get();
		if (!book) throw errors.NOT_FOUND();
		if (input.saved)
			await context.db
				.insert(savedBooks)
				.values({ userId: context.userId, bookId: book.id, createdAt: new Date().toISOString() })
				.onConflictDoNothing();
		else
			await context.db
				.delete(savedBooks)
				.where(and(eq(savedBooks.userId, context.userId), eq(savedBooks.bookId, book.id)));
		return { saved: input.saved };
	}),
};

export const progressRouter = {
	save: os.progress.save.handler(async ({ context, input, errors }) => {
		const chapter = await context.db
			.select()
			.from(bookChapters)
			.where(and(eq(bookChapters.bookId, input.bookId), eq(bookChapters.ch, input.ch)))
			.get();
		if (!chapter) throw errors.NOT_FOUND();
		const row = {
			userId: context.userId,
			bookId: input.bookId,
			ch: input.ch,
			ratio: input.ratio,
			pct: input.pct,
			updatedAt: new Date().toISOString(),
		};
		await context.db.batch([
			context.db
				.insert(progress)
				.values(row)
				.onConflictDoUpdate({
					target: [progress.userId, progress.bookId],
					set: { ch: row.ch, ratio: row.ratio, pct: row.pct, updatedAt: row.updatedAt },
				}),
			context.db
				.insert(reads)
				.values({ userId: context.userId, date: input.date, bookId: input.bookId })
				.onConflictDoNothing(),
		]);
		return { ch: row.ch, ratio: row.ratio, pct: row.pct, updatedAt: row.updatedAt };
	}),
};

export const readsRouter = {
	month: os.reads.month.handler(async ({ context, input }) => {
		const rows = await context.db
			.select({ date: reads.date, book: books })
			.from(reads)
			.innerJoin(books, eq(books.id, reads.bookId))
			.where(and(eq(reads.userId, context.userId), like(reads.date, `${input.month}-%`)))
			.orderBy(asc(reads.date));
		const days = new Map<string, { id: string; title: string; color: string }[]>();
		for (const { date, book } of rows) {
			const list = days.get(date) ?? [];
			list.push({ id: book.id, title: book.title, color: colorOf(book) });
			days.set(date, list);
		}
		return [...days].map(([date, list]) => ({ date, books: list }));
	}),
};
