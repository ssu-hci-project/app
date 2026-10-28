import { and, asc, eq } from "drizzle-orm";
import { schema } from "../db";
import { os } from "../orpc";
import { generateQuestions } from "./generate-questions";

const { books, bookmarks, questionAnswers, generatedQuestions } = schema;

const questionTemplates = [
	{ id: "question", question: "이 부분에서 가장 궁금했던 점은 무엇인가요?" },
	{ id: "emotion", question: "이 부분을 읽으며 어떤 감정이 들었나요?" },
	{ id: "perspective", question: "다른 인물의 입장에서는 이 장면이 어떻게 보일까요?" },
	{ id: "connection", question: "이 부분은 어떤 경험이나 생각을 떠올리게 하나요?" },
] as const;

export const readingRouter = {
	listBooks: os.reading.listBooks.handler(({ context }) =>
		context.db.select().from(books).orderBy(asc(books.createdAt)),
	),
	createBook: os.reading.createBook.handler(async ({ context, input }) => {
		const [book] = await context.db.insert(books).values(input).returning();
		if (!book) throw new Error("Insert returned no row");
		return book;
	}),
	listBookmarks: os.reading.listBookmarks.handler(async ({ context, input, errors }) => {
		const book = await context.db.select().from(books).where(eq(books.id, input.bookId)).get();
		if (!book) throw errors.NOT_FOUND();
		return context.db
			.select()
			.from(bookmarks)
			.where(and(eq(bookmarks.bookId, input.bookId), eq(bookmarks.page, input.page)))
			.orderBy(asc(bookmarks.createdAt));
	}),
	createBookmark: os.reading.createBookmark.handler(async ({ context, input, errors }) => {
		const book = await context.db.select().from(books).where(eq(books.id, input.bookId)).get();
		if (!book) throw errors.NOT_FOUND();
		if (input.page > book.pageCount) throw errors.BAD_REQUEST();
		const [bookmark] = await context.db.insert(bookmarks).values(input).returning();
		if (!bookmark) throw new Error("Insert returned no row");
		return bookmark;
	}),
	listQuestionTemplates: os.reading.listQuestionTemplates.handler(() => [...questionTemplates]),
	generateQuestions: os.reading.generateQuestions.handler(async ({ context, input, errors }) => {
		const book = await context.db.select().from(books).where(eq(books.id, input.bookId)).get();
		if (!book) throw errors.NOT_FOUND();
		if (input.page > book.pageCount) throw errors.BAD_REQUEST();
		if (!context.geminiApiKey)
			return { source: "fallback" as const, questions: [...questionTemplates] };
		let questions: string[];
		try {
			questions = await generateQuestions(context.geminiApiKey, input.context);
		} catch {
			return { source: "fallback" as const, questions: [...questionTemplates] };
		}
		const saved = await context.db
			.insert(generatedQuestions)
			.values(questions.map((question) => ({ bookId: input.bookId, page: input.page, question })))
			.returning();
		return {
			source: "ai" as const,
			questions: saved.map(({ id, question }) => ({ id, question })),
		};
	}),
	listQuestionAnswers: os.reading.listQuestionAnswers.handler(
		async ({ context, input, errors }) => {
			const book = await context.db.select().from(books).where(eq(books.id, input.bookId)).get();
			if (!book) throw errors.NOT_FOUND();
			if (input.page > book.pageCount) throw errors.BAD_REQUEST();
			return context.db
				.select()
				.from(questionAnswers)
				.where(
					and(
						eq(questionAnswers.bookId, input.bookId),
						eq(questionAnswers.page, input.page),
						eq(questionAnswers.templateId, input.templateId),
					),
				)
				.orderBy(asc(questionAnswers.createdAt));
		},
	),
	createQuestionAnswer: os.reading.createQuestionAnswer.handler(
		async ({ context, input, errors }) => {
			const book = await context.db.select().from(books).where(eq(books.id, input.bookId)).get();
			if (!book) throw errors.NOT_FOUND();
			if (input.page > book.pageCount) throw errors.BAD_REQUEST();
			if (!questionTemplates.some((template) => template.id === input.templateId)) {
				const question = await context.db
					.select()
					.from(generatedQuestions)
					.where(
						and(
							eq(generatedQuestions.id, input.templateId),
							eq(generatedQuestions.bookId, input.bookId),
							eq(generatedQuestions.page, input.page),
						),
					)
					.get();
				if (!question) throw errors.BAD_REQUEST({ message: "질문을 찾을 수 없습니다" });
			}
			const [answer] = await context.db.insert(questionAnswers).values(input).returning();
			if (!answer) throw new Error("Insert returned no row");
			return answer;
		},
	),
};
