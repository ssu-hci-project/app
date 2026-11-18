import { env } from "cloudflare:workers";
import { safe } from "@orpc/client";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { createDb } from "../src/db";
import {
	bookChapters,
	bookParagraphs,
	books,
	libraries,
	reactions,
	traces,
} from "../src/db/schema";
import { SAMPLE_BASE_TIME, SAMPLE_LIBRARY_ID } from "../src/lib/sample";
import { createReader } from "./reader";

const db = createDb(env.DB);
const paragraphs = [
	"첫 문단이에요. 둘째 문장이에요.",
	"정원에 물을 주었다. 계절은 묵묵히 제 일을 했다.",
];

/** A public-domain book every library can read. */
async function publicBook(id = crypto.randomUUID()) {
	await db
		.insert(books)
		.values({ id, title: `공용 ${id.slice(0, 4)}`, author: "작가", pageCount: 0 });
	await db.insert(bookChapters).values({ bookId: id, ch: 0, title: "봄", chars: 40 });
	await db
		.insert(bookParagraphs)
		.values(paragraphs.map((text, p) => ({ bookId: id, ch: 0, p, text })));
	return id;
}

async function personal(reader: ReturnType<typeof createReader>) {
	const [library] = await reader.libraries.list();
	if (!library) throw new Error("no personal library");
	return library;
}

describe("profile", () => {
	it("starts without a name and saves one", async () => {
		const reader = createReader();
		expect(await reader.profile.get()).toMatchObject({ nick: null, color: null });
		await reader.profile.save({ nick: " 지운 ", color: "#C2410C" });
		expect(await reader.profile.get()).toMatchObject({ nick: "지운", color: "#C2410C" });
		const [invalid] = await safe(reader.profile.save({ nick: "", color: "#C2410C" }));
		expect(invalid).toMatchObject({ code: "BAD_REQUEST" });
	});
});

describe("libraries", () => {
	it("creates one personal library, invites, joins and leaves", async () => {
		const alice = createReader();
		const bob = createReader();
		await alice.profile.save({ nick: "앨리스", color: "#285C48" });
		const mine = await personal(alice);
		expect(mine).toMatchObject({ name: "나의 서재", personal: true, isOwner: true });
		expect(await alice.libraries.list()).toHaveLength(1);
		expect(mine.inviteCode).toMatch(/^[A-HJ-KM-NP-Z2-9]{8}$/);

		const preview = await bob.libraries.preview({ code: mine.inviteCode.toLowerCase() });
		expect(preview).toMatchObject({ id: mine.id, name: "앨리스의 서재", joined: false });
		const joined = await bob.libraries.join({
			code: `https://example.com/invite/${mine.inviteCode}`,
		});
		expect(joined.members.map((member) => member.nick)).toEqual(["앨리스", null]);
		expect((await bob.libraries.list()).map((library) => library.id)).toContain(mine.id);

		const [ownerLeave] = await safe(alice.libraries.leave({ libraryId: mine.id }));
		expect(ownerLeave).toMatchObject({ code: "BAD_REQUEST" });
		await bob.libraries.leave({ libraryId: mine.id });
		const [gone] = await safe(bob.books.list({ libraryId: mine.id }));
		expect(gone).toMatchObject({ code: "FORBIDDEN" });

		const club = await alice.libraries.create({ name: "목요 독서회" });
		expect(club).toMatchObject({ personal: false, isOwner: true });
		const [missing] = await safe(bob.libraries.preview({ code: "NOPE2345" }));
		expect(missing).toMatchObject({ code: "NOT_FOUND" });
	});

	it("creates a reading group with books chosen together", async () => {
		const alice = createReader();
		const bob = createReader();
		const first = await publicBook();
		const second = await publicBook();
		const mine = await personal(alice);
		expect(mine.books).toEqual([]);
		const [personalShelf] = await safe(
			alice.libraries.addBooks({ libraryId: mine.id, bookIds: [first] }),
		);
		expect(personalShelf).toMatchObject({ code: "BAD_REQUEST" });

		const [missing] = await safe(alice.libraries.create({ name: "봄 모임", bookIds: ["nope"] }));
		expect(missing).toMatchObject({ code: "NOT_FOUND" });
		const club = await alice.libraries.create({ name: "봄 모임", bookIds: [first] });
		expect(club.books.map((book) => book.id)).toEqual([first]);

		const preview = await bob.libraries.preview({ code: club.inviteCode });
		expect(preview.books.map((book) => book.id)).toEqual([first]);
		await bob.libraries.join({ code: club.inviteCode });
		// Any member picks the next book; adding twice keeps one copy.
		const added = await bob.libraries.addBooks({ libraryId: club.id, bookIds: [second, first] });
		expect(added.books.map((book) => book.id)).toEqual([first, second]);

		// The group's shelf holds only its books; the catalog still has every readable book.
		const shelf = await bob.books.listPage({ libraryId: club.id, scope: "group" });
		expect(shelf.items.map((book) => book.id).sort()).toEqual([first, second].sort());
		expect(shelf.items.find((book) => book.id === first)?.readIn).toEqual([
			{ id: club.id, name: "봄 모임" },
		]);

		// A book uploaded to the group lands on its shelf; another library's upload cannot.
		const upload = async (libraryId: string, title: string) => {
			const { bookId } = await alice.books.uploadBegin({
				libraryId,
				title,
				author: "",
				chapters: [{ title: "하나", chars: 3, paragraphs: 1 }],
			});
			await alice.books.uploadChunk({ bookId, ch: 0, start: 0, paragraphs: ["가나다"] });
			await alice.books.uploadFinish({ bookId });
			return bookId;
		};
		const own = await upload(mine.id, "내 책");
		const [elsewhere] = await safe(
			alice.libraries.addBooks({ libraryId: club.id, bookIds: [own] }),
		);
		expect(elsewhere).toMatchObject({ code: "NOT_FOUND" });
		const shared = await upload(club.id, "모임 책");
		expect(
			(await alice.libraries.list()).find((library) => library.id === club.id)?.books.at(-1)?.id,
		).toBe(shared);
		await alice.books.remove({ bookId: shared });
		expect(
			(await alice.libraries.list())
				.find((library) => library.id === club.id)
				?.books.map((book) => book.id),
		).toEqual([first, second]);
	});

	it("keeps 내 서재 across every library I read in", async () => {
		const alice = createReader();
		const bookId = await publicBook();
		const mine = await personal(alice);
		const club = await alice.libraries.create({ name: "목요 독서회" });
		const { bookId: groupUpload } = await alice.books.uploadBegin({
			libraryId: club.id,
			title: "모임에만 있는 책",
			author: "",
			chapters: [{ title: "하나", chars: 3, paragraphs: 1 }],
		});
		await alice.books.uploadChunk({ bookId: groupUpload, ch: 0, start: 0, paragraphs: ["가나다"] });
		await alice.books.uploadFinish({ bookId: groupUpload });
		await alice.progress.save({ bookId, ch: 0, ratio: 0.5, pct: 50, date: "2026-11-18" });
		await alice.traces.create({
			libraryId: club.id,
			bookId,
			ch: 0,
			p: 0,
			s: 0,
			e: 3,
			quote: "첫 문",
			kind: "underline",
		});

		// The same shelf from either library: the group's upload and my traces made in the group.
		for (const libraryId of [mine.id, club.id]) {
			const { items } = await alice.books.listPage({ libraryId, scope: "mine" });
			expect(items.map((book) => book.id)).toEqual(expect.arrayContaining([bookId, groupUpload]));
			expect(items.find((book) => book.id === bookId)?.traceCount).toBe(1);
		}
		// The personal catalog still cannot open the group's upload.
		const { items: catalog } = await alice.books.listPage({ libraryId: mine.id });
		expect(catalog.map((book) => book.id)).not.toContain(groupUpload);
	});

	it("copies the sample readers' traces into a new personal library", async () => {
		const bookId = await publicBook();
		await db
			.insert(libraries)
			.values({ id: SAMPLE_LIBRARY_ID, name: "샘플", inviteCode: "SAMPLE-X", ownerId: "seed" })
			.onConflictDoNothing();
		const base = new Date(SAMPLE_BASE_TIME - 3_600_000).toISOString();
		const anchor = { libraryId: SAMPLE_LIBRARY_ID, bookId, ch: 0, p: 1, s: 0, e: 10 };
		await db.insert(traces).values([
			{
				...anchor,
				id: "sample-a",
				quote: "정원에 물을 주었다.",
				kind: "memo",
				text: "좋아요",
				authorId: "seed-a",
				createdAt: base,
			},
			{
				...anchor,
				id: "sample-b",
				quote: "정원에 물을 주었다.",
				kind: "reply",
				text: "저도요",
				parentId: "sample-a",
				authorId: "seed-b",
				createdAt: base,
			},
		]);
		await db.insert(reactions).values({ traceId: "sample-a", userId: "seed-b", emoji: "❤️" });

		const reader = createReader();
		const library = await personal(reader);
		const list = await reader.traces.list({ libraryId: library.id, bookId });
		expect(list.map((trace) => trace.kind)).toEqual(["memo", "reply"]);
		expect(list[1]?.parentId).toBe(list[0]?.id);
		expect(list[0]?.reactions).toEqual([{ emoji: "❤️", count: 1 }]);
		// Shifted so the sample reads "an hour ago" from now.
		expect(Date.now() - Date.parse(list[0]?.createdAt ?? "")).toBeLessThan(2 * 3_600_000);
		const [sample] = await safe(reader.libraries.join({ code: "SAMPLE-X" }));
		expect(sample).toMatchObject({ code: "NOT_FOUND" });
		await db.delete(libraries).where(eq(libraries.id, SAMPLE_LIBRARY_ID));
	});
});

describe("books", () => {
	it("lists, opens and reads public-domain books by chapter", async () => {
		const bookId = await publicBook();
		const reader = createReader();
		const library = await personal(reader);
		const list = await reader.books.list({ libraryId: library.id });
		expect(list.find((book) => book.id === bookId)).toMatchObject({
			chapterCount: 1,
			chars: 40,
			canRemove: false,
			saved: false,
			progress: null,
		});
		const detail = await reader.books.get({ libraryId: library.id, bookId });
		expect(detail.chapters).toEqual([{ ch: 0, title: "봄", chars: 40 }]);
		expect(detail.opening).toEqual(paragraphs);
		const chapter = await reader.books.chapter({ libraryId: library.id, bookId, ch: 0 });
		expect(chapter.paragraphs).toEqual(paragraphs);
		const [noChapter] = await safe(reader.books.chapter({ libraryId: library.id, bookId, ch: 3 }));
		expect(noChapter).toMatchObject({ code: "NOT_FOUND" });
		const [noBook] = await safe(reader.books.get({ libraryId: library.id, bookId: "missing" }));
		expect(noBook).toMatchObject({ code: "NOT_FOUND" });
		const stranger = createReader();
		const [forbidden] = await safe(stranger.books.list({ libraryId: library.id }));
		expect(forbidden).toMatchObject({ code: "FORBIDDEN" });
	});

	it("uploads a book in chunks into one library only", async () => {
		const alice = createReader();
		const bob = createReader();
		const library = await personal(alice);
		const other = await personal(bob);
		const { bookId } = await alice.books.uploadBegin({
			libraryId: library.id,
			title: "올린 책",
			author: "",
			chapters: [
				{ title: "하나", chars: 6, paragraphs: 2 },
				{ title: "둘", chars: 3, paragraphs: 1 },
			],
		});
		// Hidden until finished.
		expect(
			(await alice.books.list({ libraryId: library.id })).map((book) => book.id),
		).not.toContain(bookId);
		await alice.books.uploadChunk({ bookId, ch: 0, start: 0, paragraphs: ["가나다", "라마바"] });
		const [early] = await safe(alice.books.uploadFinish({ bookId }));
		expect(early).toMatchObject({ code: "BAD_REQUEST" });
		const [notMine] = await safe(
			bob.books.uploadChunk({ bookId, ch: 1, start: 0, paragraphs: ["x"] }),
		);
		expect(notMine).toMatchObject({ code: "NOT_FOUND" });
		await alice.books.uploadChunk({ bookId, ch: 1, start: 0, paragraphs: ["사아자"] });
		await alice.books.uploadFinish({ bookId });

		const book = (await alice.books.list({ libraryId: library.id })).find(
			(entry) => entry.id === bookId,
		);
		expect(book).toMatchObject({
			chapterCount: 2,
			chars: 9,
			canRemove: true,
			libraryId: library.id,
		});
		expect(
			(await alice.books.chapter({ libraryId: library.id, bookId, ch: 1 })).paragraphs,
		).toEqual(["사아자"]);
		expect((await bob.books.list({ libraryId: other.id })).map((entry) => entry.id)).not.toContain(
			bookId,
		);
		const [hidden] = await safe(bob.books.get({ libraryId: other.id, bookId }));
		expect(hidden).toMatchObject({ code: "NOT_FOUND" });

		const [tooBig] = await safe(
			alice.books.uploadChunk({ bookId, ch: 0, start: 0, paragraphs: ["가".repeat(7000)] }),
		);
		expect(tooBig).toMatchObject({ code: "BAD_REQUEST" });

		await bob.libraries.join({ code: library.inviteCode });
		const [cannot] = await safe(bob.books.remove({ bookId }));
		expect(cannot).toMatchObject({ code: "FORBIDDEN" });
		await alice.traces.create({
			libraryId: library.id,
			bookId,
			ch: 0,
			p: 0,
			s: 0,
			e: 3,
			quote: "가나다",
			kind: "underline",
		});
		await alice.books.remove({ bookId });
		expect(
			(await alice.books.list({ libraryId: library.id })).map((entry) => entry.id),
		).not.toContain(bookId);
		const leftovers = await db.select().from(traces).where(eq(traces.bookId, bookId));
		expect(leftovers).toEqual([]);
	});

	it("searches titles, paragraphs and traces in the library", async () => {
		const bookId = await publicBook();
		const reader = createReader();
		const library = await personal(reader);
		await reader.traces.create({
			libraryId: library.id,
			bookId,
			ch: 0,
			p: 1,
			s: 0,
			e: 10,
			quote: "정원에 물을 주었다.",
			kind: "memo",
			text: "정원 이야기가 좋아요",
		});
		const result = await reader.books.search({ libraryId: library.id, q: "정원" });
		const hit = result.passages.find((passage) => passage.bookId === bookId);
		expect(hit).toMatchObject({ ch: 0, p: 1, s: 0, e: 2, match: "정원", chapterTitle: "봄" });
		expect(result.traces.map((trace) => trace.text)).toContain("정원 이야기가 좋아요");
		expect(result.titles).toEqual({ [bookId]: `공용 ${bookId.slice(0, 4)}` });
		const byTitle = await reader.books.search({
			libraryId: library.id,
			q: `공용${bookId.slice(0, 2)}`,
		});
		expect(byTitle.bookIds).toContain(bookId);
		expect((await reader.books.search({ libraryId: library.id, q: "a" })).passages).toEqual([]);
	});
});

describe("saved, progress and reads", () => {
	it("keeps my shelf, position and reading days to myself", async () => {
		const bookId = await publicBook();
		const reader = createReader();
		const other = createReader();
		const library = await personal(reader);
		await reader.saved.set({ bookId, saved: true });
		await reader.saved.set({ bookId, saved: true });
		const saved = await reader.progress.save({
			bookId,
			ch: 0,
			ratio: 0.5,
			pct: 42,
			date: "2026-11-17",
		});
		expect(saved).toMatchObject({ ch: 0, ratio: 0.5, pct: 42 });
		await reader.progress.save({ bookId, ch: 0, ratio: 0.6, pct: 50, date: "2026-11-17" });
		const book = (await reader.books.list({ libraryId: library.id })).find(
			(entry) => entry.id === bookId,
		);
		expect(book).toMatchObject({ saved: true, progress: { ch: 0, pct: 50 } });
		const month = await reader.reads.month({ month: "2026-11" });
		expect(month.find((day) => day.date === "2026-11-17")?.books.map((entry) => entry.id)).toEqual([
			bookId,
		]);
		expect(await other.reads.month({ month: "2026-11" })).toEqual([]);
		await reader.saved.set({ bookId, saved: false });
		expect((await reader.books.get({ libraryId: library.id, bookId })).book.saved).toBe(false);
		const [badChapter] = await safe(
			reader.progress.save({ bookId, ch: 9, ratio: 0, pct: 0, date: "2026-11-17" }),
		);
		expect(badChapter).toMatchObject({ code: "NOT_FOUND" });
	});
});

describe("traces and reactions", () => {
	it("shares traces inside a library, with replies and one reaction per person", async () => {
		const bookId = await publicBook();
		const alice = createReader();
		const bob = createReader();
		const outsider = createReader();
		await alice.profile.save({ nick: "앨리스", color: "#285C48" });
		const library = await personal(alice);
		await bob.libraries.join({ code: library.inviteCode });
		const anchor = {
			libraryId: library.id,
			bookId,
			ch: 0,
			p: 1,
			s: 12,
			e: 28,
			quote: "계절은 묵묵히 제 일을 했다.",
		};
		const memo = await alice.traces.create({ ...anchor, kind: "memo", text: "좋은 문장" });
		expect(memo).toMatchObject({
			isMine: true,
			author: { nick: "앨리스" },
			quote: "계절은 묵묵히 제 일을 했다.",
		});
		await alice.traces.create({ ...anchor, kind: "underline" });
		await alice.traces.create({ ...anchor, kind: "qa", q: "왜일까요?", text: "그냥" });
		await alice.traces.create({ ...anchor, kind: "react", emoji: "🌱" });
		await alice.traces.create({
			...anchor,
			kind: "draw",
			data: {
				strokes: [
					{
						c: "#23307A",
						w: 0.09,
						d: [
							[0, 0],
							[1, 1],
						],
					},
				],
				items: [{ t: "stk", x: 1, y: 1, s: "🌷", z: 1.8, r: 4 }],
			},
		});
		const reply = await bob.traces.create({ kind: "reply", parentId: memo.id, text: "저도요" });
		expect(reply).toMatchObject({ parentId: memo.id, p: 1, s: 12, isMine: true });

		await bob.reactions.set({ traceId: memo.id, emoji: "❤️" });
		await alice.reactions.set({ traceId: memo.id, emoji: "😂" });
		await bob.reactions.set({ traceId: memo.id, emoji: "😂" });
		const list = await alice.traces.list({ libraryId: library.id, bookId });
		expect(list).toHaveLength(6);
		const card = list.find((trace) => trace.id === memo.id);
		expect(card?.reactions).toEqual([{ emoji: "😂", count: 2 }]);
		expect(card?.myReaction).toBe("😂");
		expect(list.find((trace) => trace.kind === "draw")?.data?.items[0]).toMatchObject({ s: "🌷" });
		await alice.reactions.set({ traceId: memo.id, emoji: null });
		expect(
			(await bob.traces.list({ libraryId: library.id, bookId })).find(
				(trace) => trace.id === memo.id,
			)?.reactions,
		).toEqual([{ emoji: "😂", count: 1 }]);

		const [outside] = await safe(outsider.traces.list({ libraryId: library.id, bookId }));
		expect(outside).toMatchObject({ code: "FORBIDDEN" });
		const [outsideReply] = await safe(
			outsider.traces.create({ kind: "reply", parentId: memo.id, text: "몰래" }),
		);
		expect(outsideReply).toMatchObject({ code: "FORBIDDEN" });
		const [badRange] = await safe(
			alice.traces.create({ ...anchor, s: 0, e: 400, kind: "underline" }),
		);
		expect(badRange).toMatchObject({ code: "BAD_REQUEST" });
		const [badEmoji] = await safe(
			alice.traces.create({ ...anchor, kind: "react", emoji: "🔥" as "❤️" }),
		);
		expect(badEmoji).toMatchObject({ code: "BAD_REQUEST" });

		const [notAuthor] = await safe(bob.traces.remove({ traceId: memo.id }));
		expect(notAuthor).toMatchObject({ code: "NOT_FOUND" });
		await alice.traces.remove({ traceId: memo.id });
		const after = await alice.traces.list({ libraryId: library.id, bookId });
		expect(after.map((trace) => trace.kind).sort()).toEqual(["draw", "qa", "react", "underline"]);

		const otherLibrary = await personal(bob);
		expect(await bob.traces.list({ libraryId: otherLibrary.id, bookId })).toEqual([]);
		const detail = await bob.books.get({ libraryId: library.id, bookId });
		expect(detail.readers.map((person) => person.nick)).toEqual(["앨리스"]);
		expect(detail.recentTraces.map((trace) => trace.kind)).toEqual(["qa"]);
	});
});

describe("questions", () => {
	it("falls back to built-in questions without a Gemini key", async () => {
		const bookId = await publicBook();
		const reader = createReader({ GEMINI_API_KEY: "" });
		const library = await personal(reader);
		const first = await reader.questions.generate({
			libraryId: library.id,
			bookId,
			ch: 0,
			quote: "정원",
		});
		expect(first.source).toBe("fallback");
		expect(first.questions).toHaveLength(3);
		const again = await reader.questions.generate({
			libraryId: library.id,
			bookId,
			ch: 0,
			quote: "정원",
			again: true,
		});
		expect(again.questions[0]?.q).not.toBe(first.questions[0]?.q);
		const [missing] = await safe(
			reader.questions.generate({ libraryId: library.id, bookId: "missing", ch: 0, quote: "x" }),
		);
		expect(missing).toMatchObject({ code: "NOT_FOUND" });
	});
});
