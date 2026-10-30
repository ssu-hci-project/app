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
	return [book.author, editionLabel(book)].filter(Boolean).join(" · ");
}
