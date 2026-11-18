import {
	type AnySQLiteColumn,
	index,
	integer,
	primaryKey,
	real,
	sqliteTable,
	text,
} from "drizzle-orm/sqlite-core";

export const sessions = sqliteTable("sessions", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull(),
	expiresAt: text("expires_at").notNull(),
});

export const books = sqliteTable("books", {
	edition: text("edition").notNull().default("판본 미확인"),
	/** Where the in-app text came from, and why it may be redistributed. */
	sourceUrl: text("source_url"),
	license: text("license"),
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	title: text("title").notNull(),
	author: text("author").notNull(),
	/** Archived fixed-page count. New books use chapter chars and store 0 here. */
	pageCount: integer("page_count").notNull(),
	/** null: a public-domain book every library shares. Otherwise the library it was uploaded to. */
	libraryId: text("library_id").references(() => libraries.id, { onDelete: "cascade" }),
	addedBy: text("added_by"),
	color: text("color"),
	/** "uploading" until every chunk has arrived; such books are hidden. */
	status: text("status", { enum: ["ready", "uploading"] })
		.notNull()
		.default("ready"),
	createdAt: text("created_at")
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
});

// Read-only archives for the 0009/0010 data migrations. No runtime API uses these tables.
export const bookmarks = sqliteTable("bookmarks", {
	visibility: text("visibility", { enum: ["private", "group", "legacy"] })
		.notNull()
		.default("legacy"),
	groupId: text("group_id").references(() => groups.id),
	quote: text("quote").notNull().default(""),
	/** The question the reader chose to answer, if any. */
	prompt: text("prompt"),
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

/** Fixed pages cut once at import, so every reader and group sees the same page numbers. */
export const bookPages = sqliteTable(
	"book_pages",
	{
		bookId: text("book_id")
			.notNull()
			.references(() => books.id, { onDelete: "cascade" }),
		page: integer("page").notNull(),
		text: text("text").notNull(),
	},
	(table) => [primaryKey({ columns: [table.bookId, table.page] })],
);

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

// ---------------------------------------------------------------------------------------------
// 교환독서: 서재(library) 단위로 흔적을 나누고, 본문은 장·문단으로 저장합니다.

export const profiles = sqliteTable("profiles", {
	userId: text("user_id").primaryKey(),
	nick: text("nick").notNull(),
	color: text("color").notNull(),
	updatedAt: text("updated_at").notNull(),
});

export const libraries = sqliteTable("libraries", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text("name").notNull(),
	inviteCode: text("invite_code").notNull().unique(),
	ownerId: text("owner_id").notNull(),
	/** The one-person library created on a reader's first visit. */
	personal: integer("personal", { mode: "boolean" }).notNull().default(false),
	createdAt: text("created_at")
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
});

export const libraryMembers = sqliteTable(
	"library_members",
	{
		libraryId: text("library_id")
			.notNull()
			.references(() => libraries.id, { onDelete: "cascade" }),
		userId: text("user_id").notNull(),
		joinedAt: text("joined_at").notNull(),
	},
	(table) => [
		primaryKey({ columns: [table.libraryId, table.userId] }),
		index("library_members_user").on(table.userId),
	],
);

export const bookChapters = sqliteTable(
	"book_chapters",
	{
		bookId: text("book_id")
			.notNull()
			.references(() => books.id, { onDelete: "cascade" }),
		ch: integer("ch").notNull(),
		title: text("title").notNull(),
		chars: integer("chars").notNull(),
	},
	(table) => [primaryKey({ columns: [table.bookId, table.ch] })],
);

/** Paragraphs are the stable anchor of every trace: (ch, p) plus a character range. */
export const bookParagraphs = sqliteTable(
	"book_paragraphs",
	{
		bookId: text("book_id")
			.notNull()
			.references(() => books.id, { onDelete: "cascade" }),
		ch: integer("ch").notNull(),
		p: integer("p").notNull(),
		text: text("text").notNull(),
	},
	(table) => [primaryKey({ columns: [table.bookId, table.ch, table.p] })],
);

export const traces = sqliteTable(
	"traces",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		libraryId: text("library_id")
			.notNull()
			.references(() => libraries.id, { onDelete: "cascade" }),
		bookId: text("book_id")
			.notNull()
			.references(() => books.id, { onDelete: "cascade" }),
		ch: integer("ch").notNull(),
		p: integer("p").notNull(),
		s: integer("s").notNull(),
		e: integer("e").notNull(),
		quote: text("quote").notNull(),
		kind: text("kind", {
			enum: ["underline", "memo", "qa", "react", "draw", "reply"],
		}).notNull(),
		text: text("text"),
		q: text("q"),
		emoji: text("emoji"),
		/** Drawing strokes and decorations as JSON (kind = draw). */
		data: text("data"),
		parentId: text("parent_id").references((): AnySQLiteColumn => traces.id, {
			onDelete: "cascade",
		}),
		authorId: text("author_id").notNull(),
		createdAt: text("created_at")
			.notNull()
			.$defaultFn(() => new Date().toISOString()),
	},
	(table) => [index("traces_book").on(table.libraryId, table.bookId)],
);

export const reactions = sqliteTable(
	"reactions",
	{
		traceId: text("trace_id")
			.notNull()
			.references(() => traces.id, { onDelete: "cascade" }),
		userId: text("user_id").notNull(),
		emoji: text("emoji").notNull(),
	},
	(table) => [primaryKey({ columns: [table.traceId, table.userId] })],
);

/** Days a reader opened a book, in the reader's local date. */
export const reads = sqliteTable(
	"reads",
	{
		userId: text("user_id").notNull(),
		date: text("date").notNull(),
		bookId: text("book_id")
			.notNull()
			.references(() => books.id, { onDelete: "cascade" }),
	},
	(table) => [primaryKey({ columns: [table.userId, table.date, table.bookId] })],
);

export const progress = sqliteTable(
	"progress",
	{
		userId: text("user_id").notNull(),
		bookId: text("book_id")
			.notNull()
			.references(() => books.id, { onDelete: "cascade" }),
		ch: integer("ch").notNull(),
		ratio: real("ratio").notNull(),
		pct: integer("pct").notNull(),
		updatedAt: text("updated_at").notNull(),
	},
	(table) => [primaryKey({ columns: [table.userId, table.bookId] })],
);

export const savedBooks = sqliteTable(
	"saved_books",
	{
		userId: text("user_id").notNull(),
		bookId: text("book_id")
			.notNull()
			.references(() => books.id, { onDelete: "cascade" }),
		createdAt: text("created_at").notNull(),
	},
	(table) => [primaryKey({ columns: [table.userId, table.bookId] })],
);
