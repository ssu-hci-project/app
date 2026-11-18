import { Glob } from "bun";

const banned = [
	{
		pattern: /(?<![\w-])text-\[\d+(\.\d+)?(px|rem)\]/g,
		hint: "text-[Npx] 대신 TDS 단계(text-t5 등)",
	},
	{
		pattern: /(?<![\w-])text-(xs|sm|base|lg|xl|[2-9]xl)(?![\w-])/g,
		hint: "Tailwind 기본 크기 대신 TDS 단계",
	},
];
const problems: string[] = [];
for (const path of new Glob("src/**/*.{ts,tsx}").scanSync(".")) {
	const lines = (await Bun.file(path).text()).split("\n");
	lines.forEach((line, index) => {
		for (const { pattern, hint } of banned) {
			for (const match of line.matchAll(pattern)) {
				problems.push(`${path}:${index + 1}  ${match[0]} → ${hint}`);
			}
		}
	});
}
if (problems.length > 0) {
	console.error(`TDS 타이포그래피 위반 ${problems.length}건\n${problems.join("\n")}`);
	process.exit(1);
}
