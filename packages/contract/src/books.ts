import { oc } from "@orpc/contract";
import { z } from "zod";
import { libraryInput, personSchema, textLimits } from "./common";
import { traceSchema } from "./traces";

const progressSchema = z.object({
	ch: z.number().int().nonnegative(),
	/** Position inside the chapter, 0–1, so a different font size reopens at the same place. */
	ratio: z.number().min(0).max(1),
	/** Whole-book progress by characters read. */
	pct: z.number().int().min(0).max(100),
	updatedAt: z.iso.datetime(),
});
export type ReadingProgress = z.infer<typeof progressSchema>;

const bookSchema = z.object({
	id: z.string(),
	title: z.string(),
	author: z.string(),
	edition: z.string(),
	/** Source of a public-domain text and why it may be redistributed. */
	sourceUrl: z.string().nullable(),
	license: z.string().nullable(),
	color: z.string(),
	/** null: a public-domain book every library shares. */
	libraryId: z.string().nullable(),
	addedBy: z.string().nullable(),
	createdAt: z.iso.datetime(),
	chapterCount: z.number().int().nonnegative(),
	chars: z.number().int().nonnegative(),
	/** I uploaded it, or I own the library it lives in. */
	canRemove: z.boolean(),
	traceCount: z.number().int().nonnegative(),
	readerCount: z.number().int().nonnegative(),
	lastTraceAt: z.iso.datetime().nullable(),
	saved: z.boolean(),
	progress: progressSchema.nullable(),
	/** My reading groups whose shelf has this book. */
	readIn: z.array(z.object({ id: z.string(), name: z.string() })),
});
export type Book = z.infer<typeof bookSchema>;

const chapterInfoSchema = z.object({
	ch: z.number().int().nonnegative(),
	title: z.string(),
	chars: z.number().int().nonnegative(),
});
export type ChapterInfo = z.infer<typeof chapterInfoSchema>;

const passageHitSchema = z.object({
	bookId: z.string(),
	bookTitle: z.string(),
	ch: z.number().int().nonnegative(),
	chapterTitle: z.string(),
	p: z.number().int().nonnegative(),
	s: z.number().int().nonnegative(),
	e: z.number().int().nonnegative(),
	before: z.string(),
	match: z.string(),
	after: z.string(),
	/** The snippet was cut before/after the shown text. */
	cutBefore: z.boolean(),
	cutAfter: z.boolean(),
});
export type PassageHit = z.infer<typeof passageHitSchema>;

/** At most this many paragraphs and characters per upload request (~180KB of UTF-8 Korean). */
export const UPLOAD_CHUNK_CHARS = 60_000;
export const UPLOAD_PARAGRAPH_CHARS = 6_000;

const errors = {
	NOT_FOUND: { message: "책을 찾을 수 없어요" },
	FORBIDDEN: { message: "이 서재에 먼저 참여해주세요" },
	BAD_REQUEST: { message: "책 내용을 확인해주세요" },
};
const bookInput = libraryInput.extend({ bookId: z.string() });
const bookCursor = z.object({ createdAt: z.string(), id: z.string() });

export const bookUploadSchema = libraryInput.extend({
	title: z.string().trim().min(1, "책 제목이 없어요").max(120),
	author: z.string().trim().max(80),
	chapters: z
		.array(
			z.object({
				title: z.string().trim().max(120),
				chars: z.number().int().nonnegative(),
				paragraphs: z.number().int().positive().max(20000),
			}),
		)
		.min(1)
		.max(2000),
});

export const booksContract = {
	/**
	 * `catalog`: every book readable in the library. `group`: the group's shelf. `shared`: public-domain
	 * books only. `mine`/`saved`/`uploaded` are 내 서재: my books across every library I belong to,
	 * with my own trace counts.
	 */
	listPage: oc
		.route({ method: "GET", path: "/libraries/{libraryId}/book-pages", tags: ["books"] })
		.errors(errors)
		.input(
			libraryInput.extend({
				scope: z
					.enum(["catalog", "group", "shared", "mine", "saved", "uploaded"])
					.default("catalog"),
				cursor: bookCursor.nullable().default(null),
				limit: z.number().int().min(1).max(40).default(20),
			}),
		)
		.output(z.object({ items: z.array(bookSchema), nextCursor: bookCursor.nullable() })),
	/** Public-domain books plus the ones uploaded to this library, with my progress. */
	list: oc
		.route({ method: "GET", path: "/libraries/{libraryId}/books", tags: ["books"] })
		.errors(errors)
		.input(libraryInput)
		.output(z.array(bookSchema)),
	get: oc
		.route({ method: "GET", path: "/libraries/{libraryId}/books/{bookId}", tags: ["books"] })
		.errors(errors)
		.input(bookInput)
		.output(
			z.object({
				book: bookSchema,
				chapters: z.array(chapterInfoSchema),
				/** The first two paragraphs of the first chapter with text. */
				opening: z.array(z.string()),
				readers: z.array(personSchema),
				recentTraces: z.array(traceSchema),
			}),
		),
	chapter: oc
		.route({
			method: "GET",
			path: "/libraries/{libraryId}/books/{bookId}/chapters/{ch}",
			tags: ["books"],
		})
		.errors(errors)
		.input(bookInput.extend({ ch: z.coerce.number().int().nonnegative() }))
		.output(chapterInfoSchema.extend({ paragraphs: z.array(z.string()) })),
	search: oc
		.route({ method: "GET", path: "/libraries/{libraryId}/search", tags: ["books"] })
		.errors(errors)
		.input(libraryInput.extend({ q: z.string().trim().min(1).max(textLimits.search) }))
		.output(
			z.object({
				bookIds: z.array(z.string()),
				books: z.array(bookSchema),
				/** Book titles for the returned trace matches. */
				titles: z.record(z.string(), z.string()),
				/** Up to 60 matches, at most 3 per paragraph. Empty when the query is too short. */
				passages: z.array(passageHitSchema),
				traces: z.array(traceSchema),
			}),
		),
	uploadBegin: oc
		.route({ method: "POST", path: "/libraries/{libraryId}/uploads", tags: ["books"] })
		.errors(errors)
		.input(bookUploadSchema)
		.output(z.object({ bookId: z.string() })),
	uploadChunk: oc
		.route({ method: "POST", path: "/uploads/{bookId}/chunks", tags: ["books"] })
		.errors(errors)
		.input(
			z
				.object({
					bookId: z.string(),
					ch: z.number().int().nonnegative(),
					/** Index of the first paragraph in this chunk. */
					start: z.number().int().nonnegative(),
					paragraphs: z
						.array(z.string().trim().min(1).max(UPLOAD_PARAGRAPH_CHARS))
						.min(1)
						.max(2000),
				})
				.refine(
					(input) =>
						input.paragraphs.reduce((sum, text) => sum + text.length, 0) <= UPLOAD_CHUNK_CHARS,
					"한 번에 올릴 수 있는 양을 넘었어요",
				),
		)
		.output(z.object({ received: z.number().int() })),
	uploadFinish: oc
		.route({ method: "POST", path: "/uploads/{bookId}/finish", tags: ["books"] })
		.errors(errors)
		.input(z.object({ bookId: z.string() }))
		.output(z.object({ bookId: z.string() })),
	remove: oc
		.route({ method: "DELETE", path: "/books/{bookId}", tags: ["books"] })
		.errors(errors)
		.input(z.object({ bookId: z.string() }))
		.output(z.object({ removed: z.literal(true) })),
};

export const savedContract = {
	/** 내 서재에 담기 / 빼기. */
	set: oc
		.route({ method: "PUT", path: "/saved/{bookId}", tags: ["books"] })
		.errors(errors)
		.input(z.object({ bookId: z.string(), saved: z.boolean() }))
		.output(z.object({ saved: z.boolean() })),
};

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const progressContract = {
	/** Saves where I am and marks `date` (the reader's local day) as a reading day. */
	save: oc
		.route({ method: "PUT", path: "/progress/{bookId}", tags: ["reading"] })
		.errors(errors)
		.input(progressSchema.omit({ updatedAt: true }).extend({ bookId: z.string(), date: day }))
		.output(progressSchema),
};

export const readsContract = {
	/** The days of a month I opened books, with each book's title and cover colour. */
	month: oc
		.route({ method: "GET", path: "/reads/{month}", tags: ["reading"] })
		.input(z.object({ month: z.string().regex(/^\d{4}-\d{2}$/) }))
		.output(
			z.array(
				z.object({
					date: day,
					books: z.array(z.object({ id: z.string(), title: z.string(), color: z.string() })),
				}),
			),
		),
};
