import { oc } from "@orpc/contract";
import { z } from "zod";

export const bookSchema = z.object({
	id: z.string(),
	title: z.string().trim().min(1, "책 제목을 입력해주세요").max(200),
	author: z.string().trim().min(1, "저자를 입력해주세요").max(200),
	pageCount: z.number().int().positive().max(100000),
	createdAt: z.iso.datetime(),
});

export const bookmarkSchema = z.object({
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
const invalidPage = { BAD_REQUEST: { message: "책의 페이지 범위를 벗어났습니다" } };

export const readingContract = {
	listBooks: oc
		.route({ method: "GET", path: "/books", tags: ["reading"] })
		.output(z.array(bookSchema)),
	createBook: oc
		.route({ method: "POST", path: "/books", tags: ["reading"] })
		.input(bookSchema.pick({ title: true, author: true, pageCount: true }))
		.output(bookSchema),
	listBookmarks: oc
		.route({ method: "GET", path: "/books/{bookId}/bookmarks", tags: ["reading"] })
		.errors(notFound)
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
				context: z.string().trim().min(1).max(2000),
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
