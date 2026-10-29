import { and, asc, eq, or } from "drizzle-orm";
import { schema } from "../db";
import { os } from "../orpc";
import { generateQuestions } from "./generate-questions";
import { noteView, requireGroup } from "./reading-access";

const { books, bookmarks, questionAnswers, generatedQuestions, readingProgress } = schema;

const questionTemplates = [
	{ id: "question", question: "이 부분에서 가장 궁금했던 점은 무엇인가요?" },
	{ id: "emotion", question: "이 부분을 읽으며 어떤 감정이 들었나요?" },
	{ id: "perspective", question: "다른 인물의 입장에서는 이 장면이 어떻게 보일까요?" },
	{ id: "connection", question: "이 부분은 어떤 경험이나 생각을 떠올리게 하나요?" },
] as const;

export const readingRouter = {
	getBook: os.reading.getBook.handler(async ({ context, input, errors }) => {
		const book = await context.db.select().from(books).where(eq(books.id, input.bookId)).get();
		if (!book) throw errors.NOT_FOUND();
		const progress = await context.db
			.select()
			.from(readingProgress)
			.where(
				and(eq(readingProgress.bookId, input.bookId), eq(readingProgress.userId, context.userId)),
			)
			.get();
		const member = progress?.groupId
			? await context.db
					.select()
					.from(schema.memberships)
					.where(
						and(
							eq(schema.memberships.groupId, progress.groupId),
							eq(schema.memberships.userId, context.userId),
						),
					)
					.get()
			: undefined;
		return {
			book,
			currentPage: progress?.page ?? 1,
			lastOpenedAt: progress?.lastOpenedAt ?? null,
			lastGroupId: member ? (progress?.groupId ?? null) : null,
		};
	}),
	saveProgress: os.reading.saveProgress.handler(async ({ context, input, errors }) => {
		const book = await context.db.select().from(books).where(eq(books.id, input.bookId)).get();
		if (!book) throw errors.NOT_FOUND();
		if (input.page > book.pageCount) throw errors.BAD_REQUEST();
		if (input.groupId) {
			const group = await requireGroup(context.db, input.groupId, context.userId);
			if (group.bookId !== input.bookId) throw errors.BAD_REQUEST();
		}
		const values = {
			groupId: input.groupId ?? null,
			userId: context.userId,
			bookId: input.bookId,
			page: input.page,
			lastOpenedAt: new Date().toISOString(),
		};
		await context.db
			.insert(readingProgress)
			.values(values)
			.onConflictDoUpdate({
				target: [readingProgress.userId, readingProgress.bookId],
				set: { page: values.page, lastOpenedAt: values.lastOpenedAt, groupId: values.groupId },
			});
		return { page: input.page };
	}),
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
		if (input.page > book.pageCount) throw errors.BAD_REQUEST();
		return context.db
			.select()
			.from(bookmarks)
			.where(
				and(
					eq(bookmarks.bookId, input.bookId),
					eq(bookmarks.page, input.page),
					or(eq(bookmarks.userId, context.userId), eq(bookmarks.visibility, "legacy")),
				),
			)
			.orderBy(asc(bookmarks.createdAt))
			.then((rows) => rows.map((row) => noteView(row, context.userId)));
	}),
	createBookmark: os.reading.createBookmark.handler(async ({ context, input, errors }) => {
		const book = await context.db.select().from(books).where(eq(books.id, input.bookId)).get();
		if (!book) throw errors.NOT_FOUND();
		if (input.page > book.pageCount) throw errors.BAD_REQUEST();
		const [bookmark] = await context.db
			.insert(bookmarks)
			.values({ ...input, userId: context.userId, visibility: "private" })
			.returning();
		if (!bookmark) throw new Error("Insert returned no row");
		return noteView(bookmark, context.userId);
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
						eq(questionAnswers.userId, context.userId),
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
			const [answer] = await context.db
				.insert(questionAnswers)
				.values({ ...input, userId: context.userId })
				.returning();
			if (!answer) throw new Error("Insert returned no row");
			return answer;
		},
	),
};
