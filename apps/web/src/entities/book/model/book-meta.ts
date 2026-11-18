import type { Book } from "@app/contract";

/** The API's placeholder when nobody has confirmed the edition yet. */
const UNKNOWN_EDITION = "판본 미확인";

/**
 * Edition to show, or `null` when it tells the reader nothing: still unconfirmed, or a work read in
 * the app, where everyone reads the same text and the source is shown in 책 정보 instead.
 */
export function editionLabel(book: Pick<Book, "edition" | "sourceUrl">) {
	return book.sourceUrl || book.edition === UNKNOWN_EDITION ? null : book.edition;
}

/** "저자 · 판본" line for list details and headers. */
export function bookByline(book: Pick<Book, "author" | "edition" | "sourceUrl">) {
	return [book.author || "작자 미상", editionLabel(book)].filter(Boolean).join(" · ");
}

/** "03장" */
export const chapterNumber = (ch: number) => `${String(ch + 1).padStart(2, "0")}장`;

/** "03장 작은 정원" — a chapter without its own title shows just the number. */
export function chapterLabel(ch: number, title: string) {
	return title ? `${chapterNumber(ch)} ${title}` : chapterNumber(ch);
}

/** Rough reading time at ~500 Korean characters a minute. */
export function readingTime(chars: number) {
	const minutes = Math.max(1, Math.round(chars / 500));
	return minutes < 60 ? `약 ${minutes}분` : `약 ${Math.round(minutes / 6) / 10}시간`;
}
