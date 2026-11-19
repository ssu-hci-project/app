import type { Book } from "@app/contract";
import { useActivity } from "@stackflow/react";
import { BookRow, useBookPages } from "@/entities/book";
import { CheckIcon, InfiniteLoader, LoadState, ResultSection } from "@/shared/ui";

/** Books to choose for a reading group. Tapping a row toggles it; `shelved` rows are already chosen. */
export function BookPickList({
	libraryId,
	scope,
	picked,
	onToggle,
	shelved = [],
}: {
	libraryId: string;
	scope: "catalog" | "shared";
	picked: string[];
	onToggle: (bookId: string) => void;
	shelved?: string[];
}) {
	const { isActive } = useActivity();
	const books = useBookPages(libraryId, scope, isActive);
	const rows = books.data?.pages.flatMap((page) => page.items) ?? [];
	return (
		<div className="flex flex-col">
			<LoadState pending={books.isPending} error={books.isError} retry={() => books.refetch()} />
			{books.isSuccess && rows.length === 0 && <ResultSection title="고를 수 있는 책이 없어요" />}
			{rows.map((book) => {
				const already = shelved.includes(book.id);
				const selected = already || picked.includes(book.id);
				return (
					<BookRow
						key={book.id}
						book={book}
						onClick={() => !already && onToggle(book.id)}
						detail={
							<span className={selected ? "font-semibold text-brand" : undefined}>
								{pickDetail(book, already, selected)}
							</span>
						}
						trailing={<PickMark selected={selected} />}
					/>
				);
			})}
			<InfiniteLoader
				hasMore={isActive && books.hasNextPage}
				loading={books.isFetchingNextPage}
				error={books.isFetchNextPageError}
				loadMore={() => books.fetchNextPage()}
			/>
		</div>
	);
}

function pickDetail(book: Book, already: boolean, selected: boolean) {
	if (already) return "이미 모임 서재에 있어요";
	if (selected) return "같이 읽을 책";
	if (book.readerCount) return `${book.readerCount}명이 흔적을 남겼어요`;
	return book.libraryId ? "이 모임에 올린 책" : "앱에서 읽는 작품";
}

function PickMark({ selected }: { selected: boolean }) {
	return (
		<span className="grid size-11 place-items-center">
			<span
				className={
					selected
						? "grid size-6 place-items-center rounded-full bg-primary text-primary-foreground"
						: "size-6 rounded-full border-2 border-input"
				}
			>
				{selected && <CheckIcon className="size-4" aria-hidden="true" />}
			</span>
			<span className="sr-only">{selected ? "고름" : "고르지 않음"}</span>
		</span>
	);
}
