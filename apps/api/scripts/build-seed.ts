/**
 * Builds seed.sql from the public-domain works in books/. Each work is a UTF-8 `<id>.txt` plus an
 * `<id>.json` with its title, author, source and license. A work without chapter headings is one
 * chapter; paragraphs come from the same `splitParagraphs` the 0009 migration's page split matches.
 * It also writes the sample readers and their traces (see src/lib/sample.ts).
 *
 *   bun run seed:build   # then: bun run db:seed
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { bookColor } from "../src/lib/book-color";
import { paginate } from "../src/lib/paginate";
import { splitParagraphs } from "../src/lib/paragraphs";
import { SAMPLE_BASE_TIME, SAMPLE_LIBRARY_ID } from "../src/lib/sample";

type Work = {
	id: string;
	title: string;
	author: string;
	edition: string;
	sourceUrl: string;
	license: string;
};

const root = join(import.meta.dirname, "..");
const dir = join(root, "books");
const sql = (value: string | number | null) =>
	value === null
		? "NULL"
		: typeof value === "number"
			? String(value)
			: `'${value.replaceAll("'", "''")}'`;
const row = (values: (string | number | null)[]) => `(${values.map(sql).join(", ")})`;

const paragraphsByBook = new Map<string, string[]>();
const statements = readdirSync(dir)
	.filter((file) => file.endsWith(".json"))
	.sort()
	.flatMap((file) => {
		const work = JSON.parse(readFileSync(join(dir, file), "utf8")) as Work;
		const text = readFileSync(join(dir, `${work.id}.txt`), "utf8");
		const paragraphs = splitParagraphs(text);
		paragraphsByBook.set(work.id, paragraphs);
		const pages = paginate(text);
		const chars = paragraphs.reduce((sum, paragraph) => sum + paragraph.length, 0);
		return [
			`-- ${work.title} (${work.author}) · ${work.license} · ${work.sourceUrl}`,
			`INSERT INTO books (id, title, author, edition, page_count, source_url, license, color, created_at) VALUES ${row([work.id, work.title, work.author, work.edition, pages.length, work.sourceUrl, work.license, bookColor(work.id), "2026-10-01T09:00:00.000Z"])}
	ON CONFLICT(id) DO UPDATE SET title = excluded.title, author = excluded.author, edition = excluded.edition,
	page_count = excluded.page_count, source_url = excluded.source_url, license = excluded.license, color = excluded.color;`,
			`DELETE FROM book_chapters WHERE book_id = ${sql(work.id)};`,
			`INSERT INTO book_chapters (book_id, ch, title, chars) VALUES ${row([work.id, 0, work.title, chars])};`,
			`DELETE FROM book_paragraphs WHERE book_id = ${sql(work.id)};`,
			...paragraphs.map(
				(paragraph, p) =>
					`INSERT INTO book_paragraphs (book_id, ch, p, text) VALUES ${row([work.id, 0, p, paragraph])};`,
			),
			// Legacy fixed pages for the old reader; removed with it.
			`DELETE FROM book_pages WHERE book_id = ${sql(work.id)};`,
			...pages.map(
				(page, index) =>
					`INSERT INTO book_pages (book_id, page, text) VALUES ${row([work.id, index + 1, page])};`,
			),
		];
	});

// ---- sample readers and traces on 메밀꽃 필 무렵 -------------------------------------------------
const D = 86_400_000;
const H = 3_600_000;
const at = (ago: number) => new Date(SAMPLE_BASE_TIME - ago).toISOString();
const members = [
	["seed-jiwoon", "지운", "#C2410C"],
	["seed-harin", "하린", "#6D4BC3"],
	["seed-seoyun", "서윤", "#2F3E9E"],
	["seed-minjae", "민재", "#A23B3B"],
] as const;
const book = "buckwheat";
const paragraphs = paragraphsByBook.get(book) ?? [];
/** Finds `fragment` inside paragraph `p`, failing the build if the text moved. */
function range(p: number, fragment: string) {
	const s = paragraphs[p]?.indexOf(fragment) ?? -1;
	if (s < 0) throw new Error(`sample passage not found in paragraph ${p}: ${fragment}`);
	return { p, s, e: s + fragment.length, quote: fragment };
}
const flower = [
	{
		c: "#23307A",
		w: 0.09,
		d: [
			[0.2, -1.0],
			[0.5, -1.5],
			[0.9, -1.3],
			[0.8, -0.9],
			[0.4, -0.85],
			[0.2, -1.0],
		],
	},
	{
		c: "#23307A",
		w: 0.09,
		d: [
			[0.6, -1.15],
			[0.9, -1.7],
			[1.3, -1.6],
			[1.2, -1.15],
			[0.6, -1.15],
		],
	},
	{
		c: "#23307A",
		w: 0.09,
		d: [
			[0.9, -1.05],
			[1.4, -1.2],
			[1.5, -0.8],
			[1.0, -0.75],
			[0.9, -1.05],
		],
	},
	{
		c: "#23307A",
		w: 0.09,
		d: [
			[0.75, -0.85],
			[0.75, -0.4],
			[0.8, -0.05],
		],
	},
	{
		c: "#23307A",
		w: 0.08,
		d: [
			[0.78, -0.45],
			[1.1, -0.6],
			[1.25, -0.5],
		],
	},
	{
		c: "#E5C343",
		w: 0.08,
		d: [
			[1.7, -1.6],
			[1.95, -1.85],
			[2.1, -1.6],
			[1.9, -1.4],
			[1.75, -1.55],
			[1.95, -1.25],
			[2.15, -1.3],
		],
	},
	{
		c: "#23307A",
		w: 0.07,
		d: [
			[-0.1, -0.05],
			[0.4, 0.08],
			[0.9, -0.02],
			[1.4, 0.1],
			[1.9, 0.0],
		],
	},
];
const highlight = [
	{
		c: "#DCE989",
		w: 0.55,
		hl: 1,
		d: [
			[-0.1, 0.7],
			[4, 0.66],
			[8, 0.72],
			[10.5, 0.68],
		],
	},
];
const moonSentence =
	"산허리는 온통 메밀 밭이어서 피기 시작한 꽃이 소금을 뿌린 듯이 흐붓한 달빛에 숨이 막힐 지경이다.";
const leftHand = "동이의 채찍은 왼손에 있었다.";
const question = "이 장면에서 가장 의문이었던 점은?";
type SampleTrace = {
	id: string;
	kind: string;
	author: string;
	ago: number;
	anchor?: ReturnType<typeof range>;
	text?: string;
	q?: string;
	emoji?: string;
	data?: unknown;
	parent?: string;
};
const samples: SampleTrace[] = [
	{
		id: "t1",
		kind: "memo",
		author: "seed-seoyun",
		ago: 3 * D,
		anchor: range(48, "달은 지금 긴 산허리에 걸려 있다."),
		text: "달이 걸려 있다는 말이 좋아요. 밤길이 얼마나 긴지 보이는 것 같아요.",
	},
	{
		id: "t2",
		kind: "underline",
		author: "seed-minjae",
		ago: 2 * D + 5 * H,
		anchor: range(49, moonSentence),
	},
	{
		id: "t3",
		kind: "memo",
		author: "seed-jiwoon",
		ago: 2 * D,
		anchor: range(49, moonSentence),
		text: "소금을 뿌린 듯이… 이 문장 하나 때문에 이 책을 다시 읽어요.",
	},
	{
		id: "t4",
		kind: "memo",
		author: "seed-harin",
		ago: 5 * D,
		anchor: range(25, "이십 년의 세월이 사람과 짐승을 함께 늙게 하였다."),
		text: "함께 늙어간다는 말이 이렇게 쓸쓸할 줄이야.",
	},
	{
		id: "t5",
		kind: "draw",
		author: "seed-jiwoon",
		ago: 4 * D,
		anchor: range(49, "메밀 밭"),
		data: { strokes: flower, items: [] },
	},
	{
		id: "t6",
		kind: "draw",
		author: "seed-harin",
		ago: 4 * D,
		anchor: range(48, "이지러는 졌으나 보름을 갓 지난 달은"),
		data: { strokes: highlight, items: [] },
	},
	{
		id: "t7",
		kind: "react",
		author: "seed-harin",
		ago: 1 * D,
		anchor: range(98, "달이 어지간히 기울어졌다."),
		emoji: "💚",
	},
	{
		id: "t8",
		kind: "qa",
		author: "seed-jiwoon",
		ago: 2 * D + 2 * H,
		anchor: range(96, leftHand),
		q: question,
		text: "허 생원이 왼손잡이라는 게 처음부터 복선이었을까요?",
	},
	{
		id: "t9",
		kind: "qa",
		author: "seed-harin",
		ago: 5 * D + 3 * H,
		anchor: range(96, leftHand),
		q: question,
		text: "말로 하지 않고 왼손 하나로 다 보여주는 게 좋았어요.",
	},
	{
		id: "t10",
		kind: "reply",
		author: "seed-harin",
		ago: 1 * D + 4 * H,
		parent: "t3",
		text: "저도요. 이 문장 읽고 메밀꽃 사진을 찾아봤어요.",
	},
];
const reactionRows = [
	["t3", "seed-harin", "❤️"],
	["t3", "seed-seoyun", "😂"],
	["t4", "seed-jiwoon", "❤️"],
	["t1", "seed-harin", "🌱"],
] as const;
const sampleStatements = [
	"-- 샘플 독자와 흔적. 새 개인 서재가 만들어질 때 복사됩니다(src/lib/sample.ts).",
	...members.map(
		([id, nick, color]) =>
			`INSERT INTO profiles (user_id, nick, color, updated_at) VALUES ${row([id, nick, color, at(9 * D)])} ON CONFLICT(user_id) DO UPDATE SET nick = excluded.nick, color = excluded.color;`,
	),
	`INSERT INTO libraries (id, name, invite_code, owner_id, personal, created_at) VALUES ${row([SAMPLE_LIBRARY_ID, "샘플 서재", "SAMPLE-LIBRARY", "seed", 0, at(9 * D)])} ON CONFLICT(id) DO NOTHING;`,
	`DELETE FROM traces WHERE library_id = ${sql(SAMPLE_LIBRARY_ID)};`,
	...samples.map((trace) => {
		const parent = trace.parent
			? samples.find((candidate) => candidate.id === trace.parent)
			: undefined;
		const anchor = trace.anchor ?? parent?.anchor;
		if (!anchor) throw new Error(`sample trace ${trace.id} has no passage`);
		return `INSERT INTO traces (id, library_id, book_id, ch, p, s, e, quote, kind, text, q, emoji, data, parent_id, author_id, created_at) VALUES ${row(
			[
				`sample-${trace.id}`,
				SAMPLE_LIBRARY_ID,
				book,
				0,
				anchor.p,
				anchor.s,
				anchor.e,
				anchor.quote,
				trace.kind,
				trace.text ?? null,
				trace.q ?? null,
				trace.emoji ?? null,
				trace.data ? JSON.stringify(trace.data) : null,
				trace.parent ? `sample-${trace.parent}` : null,
				trace.author,
				at(trace.ago),
			],
		)};`;
	}),
	...reactionRows.map(
		([trace, user, emoji]) =>
			`INSERT INTO reactions (trace_id, user_id, emoji) VALUES ${row([`sample-${trace}`, user, emoji])};`,
	),
];

writeFileSync(
	join(root, "seed.sql"),
	[
		"-- 생성 파일입니다. 직접 고치지 말고 books/나 scripts/build-seed.ts를 바꾼 뒤 `bun run seed:build`를 실행하세요.",
		"-- 저작권 보호기간이 끝난 작품만 넣습니다. 여러 번 실행해도 같은 결과가 됩니다.",
		...statements,
		...sampleStatements,
		"",
	].join("\n"),
);
console.log(
	`seed.sql: ${statements.filter((line) => line.startsWith("INSERT INTO books")).length} works, ${samples.length} sample traces`,
);
