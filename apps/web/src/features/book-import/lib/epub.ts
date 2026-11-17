import { ImportError } from "./import-error";
import { extractBlocks, parseMarkup, resolvePath } from "./markup";
import type { ParsedBook, ParsedChapter } from "./parsed-book";
import { clean } from "./parsed-book";
import { unzip } from "./unzip";

/** Encrypted entries other than embedded fonts (font obfuscation is not DRM). */
export function isDrmEncryption(xml: string | null) {
	if (!xml || !/EncryptedData/.test(xml)) return false;
	const withoutFonts = xml.replace(/<[^>]*URI="[^"]*\.(?:ttf|otf|woff2?)"[^>]*>/gi, "");
	return /URI="/i.test(withoutFonts);
}

/** Reads an EPUB: OPF metadata and spine order, chapter titles from nav or NCX. */
export async function parseEpub(
	buffer: ArrayBuffer,
	onProgress: (done: number, total: number) => void,
): Promise<ParsedBook> {
	const zip = await unzip(buffer);
	if (isDrmEncryption(await zip.text("META-INF/encryption.xml"))) throw new ImportError("drm");
	const container = await zip.text("META-INF/container.xml");
	const opfPath = container?.match(/full-path="([^"]+)"/)?.[1];
	const opfText = opfPath ? await zip.text(opfPath) : null;
	if (!opfPath || !opfText) throw new ImportError("read");
	const opf = new DOMParser().parseFromString(opfText, "application/xml");
	const meta = (name: string) =>
		opf.getElementsByTagNameNS("*", name)[0]?.textContent?.trim() ?? "";
	const manifest = new Map<string, { href: string; type: string; props: string }>();
	for (const item of opf.getElementsByTagNameNS("*", "item"))
		manifest.set(item.getAttribute("id") ?? "", {
			href: resolvePath(opfPath, item.getAttribute("href") ?? ""),
			type: item.getAttribute("media-type") ?? "",
			props: item.getAttribute("properties") ?? "",
		});
	const spine = [...opf.getElementsByTagNameNS("*", "itemref")]
		.map((ref) => manifest.get(ref.getAttribute("idref") ?? ""))
		.filter((item) => item && /html|xml/.test(item.type || "html")) as { href: string }[];
	const toc = await readToc(zip, manifest, opf);
	const chapters: ParsedChapter[] = [];
	for (const [index, item] of spine.entries()) {
		onProgress(index + 1, spine.length);
		const raw = await zip.text(item.href);
		if (!raw) continue;
		const doc = parseMarkup(raw);
		const blocks = extractBlocks(doc.body ?? doc.documentElement);
		if (!blocks.length) continue;
		const headingIndex = blocks.findIndex((block) => block.heading);
		let title = toc.get(item.href) ?? "";
		if (!title && headingIndex >= 0 && headingIndex < 3) title = blocks[headingIndex]?.text ?? "";
		const paragraphs = blocks
			.filter(
				(block, at) =>
					!(block.heading && (block.text === title || (at === headingIndex && headingIndex < 3))),
			)
			.map((block) => block.text);
		if (paragraphs.join("").length < 2) continue;
		chapters.push({ title: title.slice(0, 60), paragraphs });
	}
	return { title: meta("title"), author: meta("creator"), chapters };
}

async function readToc(
	zip: Awaited<ReturnType<typeof unzip>>,
	manifest: Map<string, { href: string; props: string }>,
	opf: Document,
) {
	const toc = new Map<string, string>();
	try {
		const nav = [...manifest.values()].find((item) => /\bnav\b/.test(item.props));
		const navText = nav ? await zip.text(nav.href) : null;
		if (nav && navText)
			for (const link of parseMarkup(navText).querySelectorAll("a[href]")) {
				const key = resolvePath(nav.href, link.getAttribute("href") ?? "");
				if (!toc.has(key)) toc.set(key, clean(link.textContent ?? ""));
			}
		const ncxId = opf.getElementsByTagNameNS("*", "spine")[0]?.getAttribute("toc");
		const ncx = ncxId ? manifest.get(ncxId) : undefined;
		const ncxText = ncx ? await zip.text(ncx.href) : null;
		if (ncx && ncxText) {
			const doc = new DOMParser().parseFromString(ncxText, "application/xml");
			for (const point of doc.getElementsByTagNameNS("*", "navPoint")) {
				const content = point.getElementsByTagNameNS("*", "content")[0];
				const label = point.getElementsByTagNameNS("*", "text")[0];
				if (!content || !label) continue;
				const key = resolvePath(ncx.href, content.getAttribute("src") ?? "");
				if (!toc.has(key)) toc.set(key, clean(label.textContent ?? ""));
			}
		}
	} catch {
		// A broken table of contents only costs chapter titles.
	}
	return toc;
}
