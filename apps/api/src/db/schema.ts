import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const sessions = sqliteTable("sessions", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull(),
	expiresAt: text("expires_at").notNull(),
});

export const books = sqliteTable("books", {
	edition: text("edition").notNull().default("판본 미확인"),
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
	visibility: text("visibility", { enum: ["private", "group", "legacy"] })
		.notNull()
		.default("legacy"),
	groupId: text("group_id").references(() => groups.id),
	quote: text("quote").notNull().default(""),
	updatedAt: text("updated_at"),
	sharedVersion: integer("shared_version").notNull().default(0),
	userId: text("user_id"),
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
	userId: text("user_id"),
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

export const readingProgress = sqliteTable(
	"reading_progress",
	{
		groupId: text("group_id").references(() => groups.id),
		userId: text("user_id").notNull(),
		bookId: text("book_id")
			.notNull()
			.references(() => books.id, { onDelete: "cascade" }),
		page: integer("page").notNull(),
		lastOpenedAt: text("last_opened_at").notNull(),
	},
	(table) => [primaryKey({ columns: [table.userId, table.bookId] })],
);

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

export const groups = sqliteTable("reading_groups", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	bookId: text("book_id")
		.notNull()
		.references(() => books.id),
	name: text("name").notNull(),
	inviteCode: text("invite_code")
		.notNull()
		.unique()
		.$defaultFn(() => crypto.randomUUID()),
	createdAt: text("created_at")
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
});
export const memberships = sqliteTable(
	"memberships",
	{
		groupId: text("group_id")
			.notNull()
			.references(() => groups.id),
		userId: text("user_id").notNull(),
	},
	(table) => [primaryKey({ columns: [table.groupId, table.userId] })],
);
export const shareEvents = sqliteTable("share_events", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	key: text("key").notNull().unique(),
});
export const seenNotes = sqliteTable(
	"seen_notes",
	{
		userId: text("user_id").notNull(),
		noteId: text("note_id")
			.notNull()
			.references(() => bookmarks.id, { onDelete: "cascade" }),
		version: integer("version").notNull(),
	},
	(table) => [primaryKey({ columns: [table.userId, table.noteId] })],
);
