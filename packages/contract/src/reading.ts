import { oc } from "@orpc/contract";
import { z } from "zod";

export const bookSchema = z.object({
	id: z.string(),
	title: z.string().trim().min(1, "책 제목을 입력해주세요").max(200),
	author: z.string().trim().min(1, "저자를 입력해주세요").max(200),
	edition: z.string(),
	pageCount: z.number().int().positive().max(100000),
	/** Source of the in-app text and the reason it may be redistributed. */
	sourceUrl: z.string().nullable(),
	license: z.string().nullable(),
	createdAt: z.iso.datetime(),
});

export const bookmarkSchema = z.object({
	visibility: z.enum(["private", "group", "legacy"]),
	groupId: z.string().nullable(),
	quote: z.string().max(200, "구절은 200자 이내로 입력해주세요"),
	prompt: z.string().max(200).nullable(),
	updatedAt: z.iso.datetime(),
	sharedVersion: z.number().int().nonnegative(),
	isMine: z.boolean(),
	id: z.string(),
	bookId: z.string(),
	page: z.number().int().positive(),
	content: z.string().trim().min(1, "감상을 입력해주세요").max(500),
	createdAt: z.iso.datetime(),
});

export const questionTemplateSchema = z.object({
	id: z.string().min(1).max(100),
	question: z.string(),
});

export const questionAnswerSchema = z.object({
	id: z.string(),
	bookId: z.string(),
	page: z.number().int().positive(),
	templateId: questionTemplateSchema.shape.id,
	content: z.string().trim().min(1, "답변을 입력해주세요").max(500),
	createdAt: z.iso.datetime(),
});

const notFound = { NOT_FOUND: { message: "책을 찾을 수 없습니다" } };
export type Book = z.infer<typeof bookSchema>;
export type Bookmark = z.infer<typeof bookmarkSchema>;
const invalidPage = { BAD_REQUEST: { message: "책의 페이지 범위를 벗어났습니다" } };

export const readingContract = {
	getBook: oc
		.route({ method: "GET", path: "/books/{bookId}", tags: ["reading"] })
		.errors(notFound)
		.input(z.object({ bookId: z.string() }))
		.output(
			z.object({
				book: bookSchema,
				currentPage: z.number().int().positive(),
				lastOpenedAt: z.iso.datetime().nullable(),
				lastGroupId: z.string().nullable(),
			}),
		),
	saveProgress: oc
		.route({ method: "PUT", path: "/books/{bookId}/progress", tags: ["reading"] })
		.errors({ ...notFound, ...invalidPage, FORBIDDEN: { message: "이 모임에 먼저 참여해주세요" } })
		.input(
			bookmarkSchema
				.pick({ bookId: true, page: true })
				.extend({ groupId: z.string().nullable().optional() }),
		)
		.output(z.object({ page: z.number().int().positive() })),
	listBooks: oc
		.route({ method: "GET", path: "/books", tags: ["reading"] })
		.output(z.array(bookSchema)),
	listRecent: oc.route({ method: "GET", path: "/reading/recent", tags: ["reading"] }).output(
		z.array(
			z.object({
				book: bookSchema,
				currentPage: z.number().int().positive(),
				lastOpenedAt: z.iso.datetime(),
				lastGroupId: z.string().nullable(),
			}),
		),
	),
	pageNoteCount: oc
		.route({ method: "GET", path: "/books/{bookId}/pages/{page}/count", tags: ["reading"] })
		.errors({ ...notFound, ...invalidPage, FORBIDDEN: { message: "이 모임에 먼저 참여해주세요" } })
		.input(
			bookmarkSchema
				.pick({ bookId: true, page: true })
				.extend({ groupId: z.string().nullable().optional() }),
		)
		.output(z.object({ count: z.number().int().nonnegative() })),
	createBook: oc
		.route({ method: "POST", path: "/books", tags: ["reading"] })
		.input(
			bookSchema
				.pick({ title: true, author: true })
				.extend({
					edition: z.string().trim().min(1).max(100).default("판본 미확인"),
					/** Required without `text`; derived from the pages when `text` is given. */
					pageCount: bookSchema.shape.pageCount.optional(),
					/** Full text of a work free to redistribute. The server cuts it into fixed pages. */
					text: z.string().trim().min(1).max(500000).optional(),
					sourceUrl: z.url().optional(),
					license: z.string().trim().min(1).max(100).optional(),
				})
				.refine((input) => input.text || input.pageCount, {
					message: "쪽 수나 본문을 입력해주세요",
				}),
		)
		.output(bookSchema),
	getPage: oc
		.route({ method: "GET", path: "/books/{bookId}/pages/{page}", tags: ["reading"] })
		.errors({ ...notFound, ...invalidPage })
		.input(bookmarkSchema.pick({ bookId: true, page: true }))
		.output(
			z.object({
				page: z.number().int().positive(),
				pageCount: z.number().int().positive(),
				text: z.string(),
			}),
		),
	listBookmarks: oc
		.route({ method: "GET", path: "/books/{bookId}/bookmarks", tags: ["reading"] })
		.errors({ ...notFound, ...invalidPage })
		.input(bookmarkSchema.pick({ bookId: true, page: true }))
		.output(z.array(bookmarkSchema)),
	createBookmark: oc
		.route({ method: "POST", path: "/books/{bookId}/bookmarks", tags: ["reading"] })
		.errors({ ...notFound, ...invalidPage })
		.input(bookmarkSchema.pick({ bookId: true, page: true, content: true }))
		.output(bookmarkSchema),
	listQuestionTemplates: oc
		.route({ method: "GET", path: "/question-templates", tags: ["reading"] })
		.output(z.array(questionTemplateSchema)),
	generateQuestions: oc
		.route({ method: "POST", path: "/books/{bookId}/questions/generate", tags: ["reading"] })
		.errors({ ...notFound, ...invalidPage })
		.input(
			z.object({
				bookId: z.string(),
				page: z.number().int().positive(),
				/** A passage the reader picked on this page. The server adds the page text itself. */
				quote: z.string().trim().max(200).optional(),
			}),
		)
		.output(
			z.object({ source: z.enum(["ai", "fallback"]), questions: z.array(questionTemplateSchema) }),
		),
	listQuestionAnswers: oc
		.route({ method: "GET", path: "/books/{bookId}/question-answers", tags: ["reading"] })
		.errors({ ...notFound, ...invalidPage })
		.input(questionAnswerSchema.pick({ bookId: true, page: true, templateId: true }))
		.output(z.array(questionAnswerSchema)),
	createQuestionAnswer: oc
		.route({ method: "POST", path: "/books/{bookId}/question-answers", tags: ["reading"] })
		.errors({ ...notFound, ...invalidPage })
		.input(questionAnswerSchema.pick({ bookId: true, page: true, templateId: true, content: true }))
		.output(questionAnswerSchema),
};
