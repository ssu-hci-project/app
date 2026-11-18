import { oc } from "@orpc/contract";
import { z } from "zod";
import { libraryInput, personSchema, reactionEmojiSchema, textLimits } from "./common";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);
/** Drawing coordinates are em units from the first letter of the passage, so they follow font size. */
const em = z.number().min(-200).max(400);

const strokeSchema = z.object({
	c: hex,
	w: z.number().positive().max(2),
	hl: z.literal(1).optional(),
	d: z
		.array(z.tuple([em, em]))
		.min(1)
		.max(2000),
});
export const tapePatterns = ["stripe", "dot", "grid", "kraft", "lemon"] as const;
const decorationSchema = z.discriminatedUnion("t", [
	z.object({
		t: z.literal("note"),
		x: em,
		y: em,
		w: z.number().positive().max(40),
		c: hex,
		r: z.number().min(-15).max(15),
		text: z.string().trim().min(1).max(textLimits.note),
	}),
	z.object({
		t: z.literal("tape"),
		x1: em,
		y1: em,
		x2: em,
		y2: em,
		p: z.enum(tapePatterns),
	}),
	z.object({
		t: z.literal("stk"),
		x: em,
		y: em,
		s: z.string().min(1).max(8),
		z: z.number().positive().max(5),
		r: z.number().min(-45).max(45),
	}),
]);
/** Saved drawings stay small enough to load with the chapter. */
export const DRAWING_LIMIT = 150_000;
const drawingSchema = z
	.object({
		strokes: z.array(strokeSchema).max(300),
		items: z.array(decorationSchema).max(100),
	})
	.refine((value) => value.strokes.length + value.items.length > 0, "그린 것이 없어요")
	.refine((value) => JSON.stringify(value).length <= DRAWING_LIMIT, "그림이 너무 커요");
export type Drawing = z.infer<typeof drawingSchema>;
export type Stroke = z.infer<typeof strokeSchema>;
export type Decoration = z.infer<typeof decorationSchema>;

export const traceKinds = ["underline", "memo", "qa", "react", "draw", "reply"] as const;
export type TraceKind = (typeof traceKinds)[number];

export const traceSchema = z.object({
	id: z.string(),
	libraryId: z.string(),
	bookId: z.string(),
	ch: z.number().int().nonnegative(),
	p: z.number().int().nonnegative(),
	/** Character range inside the paragraph, end exclusive. */
	s: z.number().int().nonnegative(),
	e: z.number().int().nonnegative(),
	quote: z.string(),
	kind: z.enum(traceKinds),
	text: z.string().nullable(),
	q: z.string().nullable(),
	emoji: z.string().nullable(),
	data: drawingSchema.nullable(),
	parentId: z.string().nullable(),
	author: personSchema,
	isMine: z.boolean(),
	createdAt: z.iso.datetime(),
	reactions: z.array(z.object({ emoji: z.string(), count: z.number().int().positive() })),
	myReaction: z.string().nullable(),
});
export type Trace = z.infer<typeof traceSchema>;

const anchor = libraryInput.extend({
	bookId: z.string(),
	ch: z.number().int().nonnegative().max(5000),
	p: z.number().int().nonnegative().max(100000),
	s: z.number().int().nonnegative().max(100000),
	e: z.number().int().positive().max(100000),
	quote: z.string().trim().min(1).max(2000),
});

export const memoTextSchema = z
	.string()
	.trim()
	.min(1, "생각을 적어주세요")
	.max(textLimits.memo, `${textLimits.memo}자 이내로 적어주세요`);

const traceInputSchema = z.discriminatedUnion("kind", [
	anchor.extend({ kind: z.literal("underline") }),
	anchor.extend({ kind: z.literal("memo"), text: memoTextSchema }),
	anchor.extend({
		kind: z.literal("qa"),
		q: z.string().trim().min(1).max(200),
		text: memoTextSchema,
	}),
	anchor.extend({ kind: z.literal("react"), emoji: reactionEmojiSchema }),
	anchor.extend({ kind: z.literal("draw"), data: drawingSchema }),
	z.object({
		kind: z.literal("reply"),
		parentId: z.string(),
		text: z
			.string()
			.trim()
			.min(1, "생각을 적어주세요")
			.max(textLimits.reply, `${textLimits.reply}자 이내로 적어주세요`),
	}),
]);
export type TraceInput = z.infer<typeof traceInputSchema>;

const errors = {
	NOT_FOUND: { message: "흔적을 찾을 수 없어요" },
	FORBIDDEN: { message: "이 서재에 먼저 참여해주세요" },
	BAD_REQUEST: { message: "구절 위치를 확인해주세요" },
};

export const tracesContract = {
	/** Every trace in a book for this library, replies included, oldest first. */
	list: oc
		.route({
			method: "GET",
			path: "/libraries/{libraryId}/books/{bookId}/traces",
			tags: ["traces"],
		})
		.errors(errors)
		.input(libraryInput.extend({ bookId: z.string() }))
		.output(z.array(traceSchema)),
	create: oc
		.route({ method: "POST", path: "/traces", tags: ["traces"] })
		.errors(errors)
		.input(traceInputSchema)
		.output(traceSchema),
	remove: oc
		.route({ method: "DELETE", path: "/traces/{traceId}", tags: ["traces"] })
		.errors(errors)
		.input(z.object({ traceId: z.string() }))
		.output(z.object({ removed: z.literal(true) })),
};

export const reactionsContract = {
	/** Sets or clears (null) my reaction on a trace card. */
	set: oc
		.route({ method: "PUT", path: "/traces/{traceId}/reaction", tags: ["traces"] })
		.errors(errors)
		.input(z.object({ traceId: z.string(), emoji: reactionEmojiSchema.nullable() }))
		.output(z.object({ emoji: z.string().nullable() })),
};
