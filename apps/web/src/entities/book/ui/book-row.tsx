import type { Book } from "@app/contract";
import type { ReactNode } from "react";
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
		<div className="flex items-center">
			<button
				type="button"
				onClick={onClick}
				className="flex min-w-0 flex-1 items-center gap-4 py-3 pl-5 text-left outline-none last:pr-5 focus-visible:bg-muted active:bg-muted"
			>
				<BookCover book={book} size="sm" />
				<span className="flex min-w-0 flex-1 flex-col">
					<span className="truncate text-base leading-6 font-semibold">{book.title}</span>
					<span className="truncate text-[13px] leading-[19px] text-muted-foreground">
						{book.author || "작자 미상"}
					</span>
					{detail && (
						<span className="mt-1.5 text-[13px] leading-[19px] text-muted-foreground">
							{detail}
						</span>
					)}
				</span>
			</button>
			{trailing && <div className="shrink-0 pr-3 pl-1">{trailing}</div>}
		</div>
	);
}
