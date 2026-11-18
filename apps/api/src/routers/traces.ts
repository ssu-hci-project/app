import type { TraceInput } from "@app/contract";
import { and, asc, eq } from "drizzle-orm";
import type { Db } from "../db";
import { bookParagraphs, reactions, traces } from "../db/schema";
import { os } from "../orpc";
import { requireBook, requireMember, traceViews } from "./access";

export const tracesRouter = {
	list: os.traces.list.handler(async ({ context, input }) => {
		const { library } = await requireBook(
			context.db,
			input.bookId,
			input.libraryId,
			context.userId,
		);
		const rows = await context.db
			.select()
			.from(traces)
			.where(and(eq(traces.libraryId, library.id), eq(traces.bookId, input.bookId)))
			.orderBy(asc(traces.createdAt));
		return traceViews(context.db, rows, context.userId);
	}),
	create: os.traces.create.handler(async ({ context, input, errors }) => {
		const row =
			input.kind === "reply"
				? await replyRow(context.db, context.userId, input)
				: await passageRow(context.db, context.userId, input);
		if (!row) throw input.kind === "reply" ? errors.NOT_FOUND() : errors.BAD_REQUEST();
		const [saved] = await context.db.insert(traces).values(row).returning();
		if (!saved) throw new Error("Insert returned no row");
		const [view] = await traceViews(context.db, [saved], context.userId);
		if (!view) throw new Error("trace view missing");
		return view;
	}),
	remove: os.traces.remove.handler(async ({ context, input, errors }) => {
		const trace = await context.db
			.select()
			.from(traces)
			.where(and(eq(traces.id, input.traceId), eq(traces.authorId, context.userId)))
			.get();
		if (!trace) throw errors.NOT_FOUND();
		await context.db.delete(traces).where(eq(traces.id, trace.id));
		return { removed: true as const };
	}),
};

export const reactionsRouter = {
	set: os.reactions.set.handler(async ({ context, input, errors }) => {
		const trace = await context.db.select().from(traces).where(eq(traces.id, input.traceId)).get();
		if (!trace) throw errors.NOT_FOUND();
		await requireMember(context.db, trace.libraryId, context.userId);
		if (input.emoji)
			await context.db
				.insert(reactions)
				.values({ traceId: trace.id, userId: context.userId, emoji: input.emoji })
				.onConflictDoUpdate({
					target: [reactions.traceId, reactions.userId],
					set: { emoji: input.emoji },
				});
		else
			await context.db
				.delete(reactions)
				.where(and(eq(reactions.traceId, trace.id), eq(reactions.userId, context.userId)));
		return { emoji: input.emoji };
	}),
};

type Row = typeof traces.$inferInsert;

async function replyRow(
	db: Db,
	userId: string,
	input: Extract<TraceInput, { kind: "reply" }>,
): Promise<Row | undefined> {
	const parent = await db.select().from(traces).where(eq(traces.id, input.parentId)).get();
	if (!parent || parent.kind === "reply") return undefined;
	await requireMember(db, parent.libraryId, userId);
	const { id: _id, createdAt: _at, ...anchor } = parent;
	return {
		...anchor,
		kind: "reply",
		text: input.text,
		q: null,
		emoji: null,
		data: null,
		parentId: parent.id,
		authorId: userId,
		createdAt: new Date().toISOString(),
	};
}

async function passageRow(
	db: Db,
	userId: string,
	input: Exclude<TraceInput, { kind: "reply" }>,
): Promise<Row | undefined> {
	await requireBook(db, input.bookId, input.libraryId, userId);
	const paragraph = await db
		.select()
		.from(bookParagraphs)
		.where(
			and(
				eq(bookParagraphs.bookId, input.bookId),
				eq(bookParagraphs.ch, input.ch),
				eq(bookParagraphs.p, input.p),
			),
		)
		.get();
	if (!paragraph || input.s >= input.e || input.e > paragraph.text.length) return undefined;
	return {
		libraryId: input.libraryId,
		bookId: input.bookId,
		ch: input.ch,
		p: input.p,
		s: input.s,
		e: input.e,
		// The stored quote is always the real passage, whatever the client sent.
		quote: paragraph.text.slice(input.s, input.e),
		kind: input.kind,
		text: "text" in input ? input.text : null,
		q: "q" in input ? input.q : null,
		emoji: "emoji" in input ? input.emoji : null,
		data: "data" in input ? JSON.stringify(input.data) : null,
		authorId: userId,
		createdAt: new Date().toISOString(),
	};
}
