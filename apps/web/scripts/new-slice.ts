#!/usr/bin/env bun
/**
 * Scaffold a new FSD slice with the segment folders + index.ts public API
 * this template's conventions expect, so nobody (human or AI) has to retype
 * the same boilerplate per slice.
 *
 * Usage: bun run new:slice -- --layer=features --name=delete-todo
 */
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const LAYERS = ["entities", "features", "widgets", "pages"] as const;
type Layer = (typeof LAYERS)[number];

const SEGMENTS_BY_LAYER: Record<Layer, string[]> = {
	entities: ["model", "api", "ui"],
	features: ["model", "ui"],
	widgets: ["ui"],
	pages: ["ui"],
};

function toPascalCase(kebab: string): string {
	return kebab.replace(/(^\w|-\w)/g, (chunk) => chunk.replace("-", "").toUpperCase());
}

function parseArgs() {
	const args = process.argv.slice(2);
	const layer = args.find((a) => a.startsWith("--layer="))?.split("=")[1] as Layer | undefined;
	const name = args.find((a) => a.startsWith("--name="))?.split("=")[1];

	if (!layer || !LAYERS.includes(layer)) {
		console.error(`--layer must be one of: ${LAYERS.join(", ")}`);
		process.exit(1);
	}
	if (!name || !/^[a-z][a-z0-9-]*$/.test(name)) {
		console.error("--name must be kebab-case, e.g. add-todo");
		process.exit(1);
	}
	return { layer, name };
}

async function main() {
	const { layer, name } = parseArgs();
	const root = path.resolve(import.meta.dir, "..", "src", layer, name);

	if (existsSync(root)) {
		console.error(`${root} already exists`);
		process.exit(1);
	}

	const segments = SEGMENTS_BY_LAYER[layer];
	const exportLines: string[] = [];

	for (const segment of segments) {
		await mkdir(path.join(root, segment), { recursive: true });
	}

	if (segments.includes("ui")) {
		const pascalName = toPascalCase(name);
		await writeFile(
			path.join(root, "ui", `${name}.tsx`),
			`export function ${pascalName}() {\n\treturn <div>${pascalName}</div>;\n}\n`,
		);
		exportLines.push(`export { ${pascalName} } from "./ui/${name}";`);
	}

	await writeFile(path.join(root, "index.ts"), `${exportLines.join("\n")}\n`);

	console.log(`Created src/${layer}/${name}/ (${segments.join(", ")})`);
	console.log(`Public API: src/${layer}/${name}/index.ts — import only from this path.`);
}

main();
