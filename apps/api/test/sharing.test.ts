import { env } from "cloudflare:workers";
import { safe } from "@orpc/client";
import { describe, expect, it } from "vitest";
import { createDb } from "../src/db";
import { bookmarks } from "../src/db/schema";
import app from "../src/index";
import { createReader } from "./reader";

describe("private records and explicit group sharing", () => {
	it("starts a HttpOnly anonymous session without exposing its identifier", async () => {
		const response = await app.request("/api/session", {}, env);
		expect(await response.json()).toEqual({ ready: true });
		expect(response.headers.get("set-cookie")).toContain("HttpOnly");
	});
	it("keeps new notes private and rejects another reader's read, edit, delete and publication", async () => {
		const alice = createReader();
		const bob = createReader();
		const book = await alice.reading.createBook({
			title: "개인 기록",
			author: "저자",
			pageCount: 30,
			edition: "1판",
		});
		const note = await alice.notes.create({
			bookId: book.id,
			page: 3,
			quote: "문장",
			content: "개인적인 생각",
		});
		expect(note).toMatchObject({ visibility: "private", groupId: null, isMine: true });
		expect(await alice.notes.listMine()).toContainEqual(note);
		expect(await bob.notes.listMine()).not.toContainEqual(note);
		expect(await bob.reading.listBookmarks({ bookId: book.id, page: 3 })).toEqual([]);
		for (const result of [
			await safe(bob.notes.get({ noteId: note.id })),
			await safe(bob.notes.update({ noteId: note.id, quote: "", content: "변조" })),
			await safe(bob.notes.remove({ noteId: note.id })),
			await safe(bob.notes.setVisibility({ noteId: note.id, groupId: null })),
		])
			expect(result[0]).toMatchObject({ code: "NOT_FOUND" });
		const edited = await alice.notes.update({
			noteId: note.id,
			quote: "새 문장",
			content: "새로운 생각",
		});
		expect(edited.content).toBe("새로운 생각");
		await alice.notes.remove({ noteId: note.id });
		expect((await safe(alice.notes.get({ noteId: note.id })))[0]).toMatchObject({
			code: "NOT_FOUND",
		});
		expect(
			(
				await safe(alice.notes.create({ bookId: book.id, page: 31, quote: "", content: "범위 밖" }))
			)[0],
		).toMatchObject({ code: "BAD_REQUEST" });
	});
	it("requires explicit joining and publication, counts visible versions, and withdraws access", async () => {
		const alice = createReader();
		const bob = createReader();
		const outsider = createReader();
		const book = await alice.reading.createBook({ title: "함께", author: "저자", pageCount: 20 });
		const group = await alice.groups.create({ bookId: book.id, name: "느긋한 모임" });
		const note = await alice.notes.create({
			bookId: book.id,
			page: 5,
			quote: "",
			content: "같이 나눌 생각",
		});
		expect(await alice.groups.page({ groupId: group.id, page: 5 })).toEqual([]);
		expect((await bob.groups.previewInvite({ code: group.inviteCode })).joined).toBe(false);
		expect((await safe(bob.groups.page({ groupId: group.id, page: 5 })))[0]).toMatchObject({
			code: "FORBIDDEN",
		});
		const shared = await alice.notes.setVisibility({ noteId: note.id, groupId: group.id });
		expect(shared.sharedVersion).toBeGreaterThan(0);
		expect((await safe(bob.notes.get({ noteId: note.id })))[0]).toMatchObject({
			code: "FORBIDDEN",
		});
		await bob.groups.join({ code: group.inviteCode });
		await bob.groups.join({ code: group.inviteCode });
		expect((await bob.groups.list()).find((item) => item.id === group.id)).toMatchObject({
			memberCount: 2,
			unreadCount: 1,
			unreadPages: [5],
		});
		expect((await bob.groups.page({ groupId: group.id, page: 5 }))[0]?.isMine).toBe(false);
		await bob.reading.getBook({ bookId: book.id });
		expect((await bob.groups.list()).find((item) => item.id === group.id)?.unreadCount).toBe(1);
		expect(
			(
				await safe(
					outsider.groups.markSeen({
						groupId: group.id,
						noteId: note.id,
						version: shared.sharedVersion,
					}),
				)
			)[0],
		).toMatchObject({ code: "FORBIDDEN" });
		expect(
			(
				await safe(
					bob.groups.markSeen({
						groupId: group.id,
						noteId: note.id,
						version: shared.sharedVersion + 1,
					}),
				)
			)[0],
		).toMatchObject({ code: "BAD_REQUEST" });
		await bob.groups.markSeen({
			groupId: group.id,
			noteId: note.id,
			version: shared.sharedVersion,
		});
		expect((await bob.groups.list()).find((item) => item.id === group.id)?.unreadCount).toBe(0);
		const revised = await alice.notes.update({
			noteId: note.id,
			quote: "",
			content: "수정한 공유 생각",
		});
		expect(revised.sharedVersion).toBeGreaterThan(shared.sharedVersion);
		await bob.groups.markSeen({
			groupId: group.id,
			noteId: note.id,
			version: shared.sharedVersion,
		});
		expect((await bob.groups.list()).find((item) => item.id === group.id)?.unreadCount).toBe(1);
		await alice.reading.saveProgress({ bookId: book.id, page: 5, groupId: group.id });
		expect((await alice.reading.getBook({ bookId: book.id })).lastGroupId).toBe(group.id);
		await alice.notes.setVisibility({ noteId: note.id, groupId: null });
		expect(await bob.groups.page({ groupId: group.id, page: 5 })).toEqual([]);
		expect((await bob.groups.list()).find((item) => item.id === group.id)?.unreadCount).toBe(0);
		expect((await safe(bob.notes.get({ noteId: note.id })))[0]).toMatchObject({
			code: "NOT_FOUND",
		});
		await alice.notes.setVisibility({ noteId: note.id, groupId: group.id });
		await alice.groups.leave({ groupId: group.id });
		expect((await alice.notes.get({ noteId: note.id })).visibility).toBe("private");
		expect((await alice.reading.getBook({ bookId: book.id })).lastGroupId).toBeNull();
		expect((await safe(alice.groups.page({ groupId: group.id, page: 5 })))[0]).toMatchObject({
			code: "FORBIDDEN",
		});
		expect(await bob.groups.page({ groupId: group.id, page: 5 })).toEqual([]);
	});
	it("rejects sharing to another book and preserves ownerless legacy records without adopting them", async () => {
		const alice = createReader();
		const bob = createReader();
		const first = await alice.reading.createBook({ title: "1판", author: "저자", pageCount: 10 });
		const second = await alice.reading.createBook({ title: "2판", author: "저자", pageCount: 20 });
		const group = await alice.groups.create({ bookId: second.id, name: "다른 판본" });
		const note = await alice.notes.create({
			bookId: first.id,
			page: 1,
			quote: "",
			content: "판본별 기록",
		});
		expect(
			(await safe(alice.notes.setVisibility({ noteId: note.id, groupId: group.id })))[0],
		).toMatchObject({ code: "BAD_REQUEST" });
		const [legacy] = await createDb(env.DB)
			.insert(bookmarks)
			.values({ bookId: first.id, page: 1, content: "이전 공용 기록" })
			.returning();
		if (!legacy) throw new Error("Missing legacy record");
		expect(await bob.reading.listBookmarks({ bookId: first.id, page: 1 })).toMatchObject([
			{ id: legacy.id, visibility: "legacy", isMine: false },
		]);
		expect(
			(
				await safe(
					alice.notes.update({ noteId: legacy.id, quote: "", content: "소유자 변경 시도" }),
				)
			)[0],
		).toMatchObject({ code: "NOT_FOUND" });
	});
	it("counts other readers' notes on a page without exposing them, and accepts short invite codes", async () => {
		const alice = createReader();
		const bob = createReader();
		const book = await alice.reading.createBook({
			title: "세어 보기",
			author: "저자",
			pageCount: 10,
		});
		const group = await alice.groups.create({ bookId: book.id, name: "짧은 코드" });
		expect(group.inviteCode).toMatch(/^[A-HJKMNP-Z2-9]{8}$/);
		await bob.groups.join({ code: ` ${group.inviteCode.toLowerCase()} ` });
		const mine = await alice.notes.create({
			bookId: book.id,
			page: 4,
			quote: "",
			content: "내 생각",
		});
		await alice.notes.setVisibility({ noteId: mine.id, groupId: group.id });
		const theirs = await bob.notes.create({
			bookId: book.id,
			page: 4,
			quote: "",
			content: "밥의 생각",
		});
		const input = { bookId: book.id, page: 4, groupId: group.id };
		expect(await alice.reading.pageNoteCount(input)).toEqual({ count: 0 });
		await bob.notes.setVisibility({ noteId: theirs.id, groupId: group.id });
		expect(await alice.reading.pageNoteCount(input)).toEqual({ count: 1 });
		expect(await bob.reading.pageNoteCount(input)).toEqual({ count: 1 });
		expect(await alice.reading.pageNoteCount({ bookId: book.id, page: 4 })).toEqual({ count: 0 });
		expect((await safe(createReader().reading.pageNoteCount(input)))[0]).toMatchObject({
			code: "FORBIDDEN",
		});
		expect((await safe(alice.reading.pageNoteCount({ ...input, page: 11 })))[0]).toMatchObject({
			code: "BAD_REQUEST",
		});
	});
	it("lists recently opened books with the reader's own page and a group they still belong to", async () => {
		const alice = createReader();
		const first = await alice.reading.createBook({ title: "먼저", author: "저자", pageCount: 50 });
		const second = await alice.reading.createBook({ title: "나중", author: "저자", pageCount: 50 });
		expect(await alice.reading.listRecent()).toEqual([]);
		await alice.reading.saveProgress({ bookId: first.id, page: 7 });
		const group = await alice.groups.create({ bookId: second.id, name: "최근 모임" });
		await alice.reading.saveProgress({ bookId: second.id, page: 12, groupId: group.id });
		const recent = await alice.reading.listRecent();
		expect(recent.map((item) => [item.book.id, item.currentPage, item.lastGroupId])).toEqual([
			[second.id, 12, group.id],
			[first.id, 7, null],
		]);
		expect(await createReader().reading.listRecent()).toEqual([]);
		await alice.groups.leave({ groupId: group.id });
		expect((await alice.reading.listRecent())[0]?.lastGroupId).toBeNull();
	});
});
