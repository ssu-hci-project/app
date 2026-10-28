import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const books = sqliteTable("books", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	title: text("title").notNull(),
	author: text("author").notNull(),
	pageCount: integer("page_count").notNull(),
	createdAt: text("created_at")
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
});

export const bookmarks = sqliteTable("bookmarks", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	bookId: text("book_id")
		.notNull()
		.references(() => books.id, { onDelete: "cascade" }),
	page: integer("page").notNull(),
	content: text("content").notNull(),
	createdAt: text("created_at")
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
});

export const questionAnswers = sqliteTable("question_answers", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	bookId: text("book_id")
		.notNull()
		.references(() => books.id, { onDelete: "cascade" }),
	page: integer("page").notNull(),
	templateId: text("template_id").notNull(),
	content: text("content").notNull(),
	createdAt: text("created_at")
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
});

export const generatedQuestions = sqliteTable("generated_questions", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	bookId: text("book_id")
		.notNull()
		.references(() => books.id, { onDelete: "cascade" }),
	page: integer("page").notNull(),
	question: text("question").notNull(),
});
