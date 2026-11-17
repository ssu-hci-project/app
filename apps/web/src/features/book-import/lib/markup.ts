import { clean } from "./parsed-book";

const BLOCK = new Set(
	"P DIV H1 H2 H3 H4 H5 H6 LI BLOCKQUOTE PRE DD DT FIGCAPTION TD TH SECTION ARTICLE ASIDE HEADER FOOTER UL OL TABLE TR TBODY DL FIGURE NAV MAIN CENTER HR ADDRESS".split(
		" ",
	),
);
const SKIP = new Set(["RT", "RP", "SCRIPT", "STYLE"]);

export type Block = { heading: boolean; text: string };

function inlineText(element: Element): string {
	let text = "";
	for (const node of element.childNodes) {
		if (node.nodeType === Node.TEXT_NODE) text += (node as Text).data;
		else if (node.nodeType === Node.ELEMENT_NODE) {
			const tag = (node as Element).tagName.toUpperCase();
			if (tag === "BR") text += "\n";
			else if (!SKIP.has(tag)) text += inlineText(node as Element);
		}
	}
	return text;
}

/** Block-level text in reading order; headings are flagged so they can become chapter titles. */
export function extractBlocks(root: Element): Block[] {
	const blocks: Block[] = [];
	const walk = (element: Element) => {
		const tag = element.tagName.toUpperCase();
		const hasBlock = [...element.children].some((child) => BLOCK.has(child.tagName.toUpperCase()));
		if (!hasBlock) {
			const text = clean(inlineText(element));
			if (text) blocks.push({ heading: /^H[1-6]$/.test(tag), text });
			return;
		}
		let buffer = "";
		const flush = () => {
			const text = clean(buffer);
			if (text) blocks.push({ heading: false, text });
			buffer = "";
		};
		for (const node of element.childNodes) {
			if (node.nodeType === Node.TEXT_NODE) buffer += (node as Text).data;
			else if (node.nodeType === Node.ELEMENT_NODE) {
				const child = node as Element;
				const childTag = child.tagName.toUpperCase();
				if (childTag === "SCRIPT" || childTag === "STYLE") continue;
				if (BLOCK.has(childTag)) {
					flush();
					walk(child);
				} else if (childTag === "BR") buffer += "\n";
				else buffer += inlineText(child);
			}
		}
		flush();
	};
	walk(root);
	return blocks;
}

/** Parses XHTML strictly first (EPUB), falling back to the forgiving HTML parser. */
export function parseMarkup(text: string, type: DOMParserSupportedType = "application/xhtml+xml") {
	const strict = new DOMParser().parseFromString(text, type);
	return strict.querySelector("parsererror")
		? new DOMParser().parseFromString(text, "text/html")
		: strict;
}

/** Resolves `href` against the file at `base` inside the archive. */
export function resolvePath(base: string, href: string) {
	const parts = [
		...(base ? base.split("/").slice(0, -1) : []),
		...(href.split("#")[0] ?? "").split("/"),
	];
	const out: string[] = [];
	for (const part of parts) {
		if (part === "..") out.pop();
		else if (part !== "." && part !== "") out.push(part);
	}
	return out.join("/");
}
