import { and, asc, eq } from "drizzle-orm";
import { bookChapters, bookParagraphs } from "../db/schema";
import { passageContext } from "../lib/question-context";
import { os } from "../orpc";
import { requireBook } from "./access";
import { generateQuestions } from "./generate-questions";

/** Shown when Gemini is unavailable: the first three, or the other three for "다른 질문 보기". */
export const fallbackQuestions = [
	{ chip: "가장 의문이었던 점은?", q: "이 장면에서 가장 의문이었던 점은 무엇인가요?" },
	{ chip: "마음에 남은 이유는?", q: "이 문장이 마음에 남은 이유는 무엇인가요?" },
	{ chip: "다르게 볼 수 있다면?", q: "이 장면을 다르게 본다면 어떻게 볼 수 있을까요?" },
	{ chip: "인물의 마음은?", q: "이 순간 인물의 마음은 어땠을까요?" },
	{ chip: "내 경험과 닮은 점은?", q: "이 구절에서 내 경험과 닮은 점이 있나요?" },
	{ chip: "이 말을 듣는다면?", q: "내가 이 장면 속에 있었다면 무슨 말을 했을까요?" },
];

export const questionsRouter = {
	generate: os.questions.generate.handler(async ({ context, input }) => {
		const { book } = await requireBook(context.db, input.bookId, input.libraryId, context.userId);
		const fallback = {
			source: "fallback" as const,
			questions: fallbackQuestions.slice(input.again ? 3 : 0, input.again ? 6 : 3),
		};
		if (!context.geminiApiKey) return fallback;
		const chapter = await context.db
			.select()
			.from(bookChapters)
			.where(and(eq(bookChapters.bookId, book.id), eq(bookChapters.ch, input.ch)))
			.get();
		const paragraphs = await context.db
			.select({ text: bookParagraphs.text })
			.from(bookParagraphs)
			.where(and(eq(bookParagraphs.bookId, book.id), eq(bookParagraphs.ch, input.ch)))
			.orderBy(asc(bookParagraphs.p));
		try {
			const questions = await generateQuestions(
				context.geminiApiKey,
				passageContext({
					title: book.title,
					author: book.author,
					chapterTitle: chapter?.title ?? "",
					chapter: paragraphs.map((row) => row.text).join("\n\n"),
					quote: input.quote,
					again: input.again,
				}),
			);
			return { source: "ai" as const, questions };
		} catch (error) {
			// Readers still get the built-in questions; the log tells us why Gemini was skipped.
			console.error("Gemini question generation failed", error);
			return fallback;
		}
	}),
};
