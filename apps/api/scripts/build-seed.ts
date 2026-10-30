/**
 * Builds seed.sql from the public-domain works in books/. Each work is a UTF-8 `<id>.txt` plus an
 * `<id>.json` with its title, author, source and license. Pages are cut with the same `paginate`
 * the API uses, so seeded and uploaded works page identically.
 *
 *   bun run seed:build   # then: bun run db:seed
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { paginate } from "../src/lib/paginate";

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
const sql = (value: string | number) =>
	typeof value === "number" ? String(value) : `'${value.replaceAll("'", "''")}'`;

const statements = readdirSync(dir)
	.filter((file) => file.endsWith(".json"))
	.sort()
	.flatMap((file) => {
		const work = JSON.parse(readFileSync(join(dir, file), "utf8")) as Work;
		const pages = paginate(readFileSync(join(dir, `${work.id}.txt`), "utf8"));
		const values = [
			work.id,
			work.title,
			work.author,
			work.edition,
			pages.length,
			work.sourceUrl,
			work.license,
			"2026-10-01T09:00:00.000Z",
		].map(sql);
		return [
			`-- ${work.title} (${work.author}) · ${work.license} · ${work.sourceUrl}`,
			`INSERT INTO books (id, title, author, edition, page_count, source_url, license, created_at) VALUES (${values.join(", ")})
	ON CONFLICT(id) DO UPDATE SET title = excluded.title, author = excluded.author, edition = excluded.edition,
	page_count = excluded.page_count, source_url = excluded.source_url, license = excluded.license;`,
			`DELETE FROM book_pages WHERE book_id = ${sql(work.id)};`,
			...pages.map(
				(text, index) =>
					`INSERT INTO book_pages (book_id, page, text) VALUES (${sql(work.id)}, ${index + 1}, ${sql(text)});`,
			),
		];
	});

writeFileSync(
	join(root, "seed.sql"),
	[
		"-- 생성 파일입니다. 직접 고치지 말고 books/를 바꾼 뒤 `bun run seed:build`를 실행하세요.",
		"-- 저작권 보호기간이 끝난 작품만 넣습니다. 여러 번 실행해도 같은 결과가 됩니다.",
		...statements,
		"",
	].join("\n"),
);
console.log(
	`seed.sql: ${statements.filter((line) => line.startsWith("INSERT INTO books")).length} works`,
);
