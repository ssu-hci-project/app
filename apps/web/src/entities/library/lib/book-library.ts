import type { Book, Library } from "@app/contract";

/**
 * Where to open a book from 내 서재, which spans libraries: the library it was uploaded to, else
 * the current group if it reads the book, else the first group reading it, else my personal library.
 */
export function bookLibrary(
	book: Pick<Book, "libraryId" | "readIn">,
	libraries: Library[],
	currentId: string | undefined,
): string | undefined {
	if (book.libraryId) return book.libraryId;
	if (book.readIn.some((group) => group.id === currentId)) return currentId;
	return book.readIn[0]?.id ?? libraries.find((library) => library.personal && library.isOwner)?.id;
}
