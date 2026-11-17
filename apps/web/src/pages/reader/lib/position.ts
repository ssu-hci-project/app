/** Page gutter on each side; the gap between CSS columns is twice that. */
export const GUTTER = 24;
export const GAP = GUTTER * 2;

/** Rough book-wide progress: characters before this chapter plus the pages read in it. */
export function bookPercent(chapterChars: number[], ch: number, page: number, pages: number) {
	const total = chapterChars.reduce((sum, chars) => sum + chars, 0);
	if (!total) return 0;
	const before = chapterChars.slice(0, ch).reduce((sum, chars) => sum + chars, 0);
	const within = (chapterChars[ch] ?? 0) * ((page + 1) / Math.max(1, pages));
	return Math.min(100, Math.max(0, Math.round(((before + within) / total) * 100)));
}

/** Reads the (ch, p, s, e) target from string route params. */
export function parseTarget(params: { ch?: string; p?: string; s?: string; e?: string }) {
	const number = (value?: string) =>
		value !== undefined && /^\d+$/.test(value) ? Number(value) : undefined;
	const ch = number(params.ch);
	const p = number(params.p);
	const s = number(params.s);
	const e = number(params.e);
	return {
		ch,
		passage:
			p !== undefined && s !== undefined && e !== undefined && e > s ? { p, s, e } : undefined,
	};
}

const LOCAL_KEY = "exchange-reading:position:";
export function readLocalPosition(
	bookId: string,
): { ch: number; ratio: number; at: string } | null {
	try {
		const value = JSON.parse(localStorage.getItem(LOCAL_KEY + bookId) ?? "null");
		return value && typeof value.ch === "number" && typeof value.ratio === "number" ? value : null;
	} catch {
		return null;
	}
}
export function saveLocalPosition(bookId: string, ch: number, ratio: number) {
	try {
		localStorage.setItem(
			LOCAL_KEY + bookId,
			JSON.stringify({ ch, ratio, at: new Date().toISOString() }),
		);
	} catch {
		// Private mode: the server copy still works.
	}
}
