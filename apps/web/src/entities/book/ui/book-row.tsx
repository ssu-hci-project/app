import type { Book } from "@app/contract";
import type { ReactNode } from "react";
import { ListButton } from "@/shared/ui";
import { BookCover } from "./book-cover";

/** A tappable list row: small cover, title, author and an optional detail line. */
export function BookRow({
	book,
	detail,
	onClick,
	trailing,
}: {
	book: Pick<Book, "title" | "author" | "color">;
	detail?: ReactNode;
	onClick: () => void;
	/** e.g. a ⋯ button. Rendered beside the row, not inside its button. */
	trailing?: ReactNode;
}) {
	return (
		<ListButton
			onClick={onClick}
			leading={<BookCover book={book} size="sm" />}
			trailing={trailing}
			title={<span className="truncate">{book.title}</span>}
			detail={
				<>
					<span className="block truncate">{book.author || "작자 미상"}</span>
					{detail && <span className="mt-1.5 block">{detail}</span>}
				</>
			}
		/>
	);
}
