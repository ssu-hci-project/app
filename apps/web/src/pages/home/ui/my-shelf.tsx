import type { Book } from "@app/contract";
import { useFlow } from "@stackflow/react";
import type { UseQueryResult } from "@tanstack/react-query";
import { EllipsisVerticalIcon, HeartIcon } from "lucide-react";
import { useState } from "react";
import { BookRow, ProgressBar } from "@/entities/book";
import { AppBarIconButton, Button, LoadState, ResultSection, Segmented } from "@/shared/ui";

type Filter = "all" | "saved" | "uploaded";
const empty: Record<Filter, [string, string]> = {
	all: ["아직 읽거나 담은 책이 없어요", "홈이나 찾기에서 책을 골라보세요."],
	saved: ["담은 책이 없어요", "책 정보에서 ♡를 눌러 담아보세요."],
	uploaded: ["올린 책이 없어요", "EPUB이나 TXT 파일을 끌어다 놓거나 아래 버튼으로 올려보세요."],
};

/** 내 서재: books I opened, saved or uploaded. */
export function MyShelf({
	books,
	myId,
	onMenu,
	onImport,
}: {
	books: UseQueryResult<Book[]>;
	myId: string | undefined;
	onMenu: (bookId: string) => void;
	onImport: () => void;
}) {
	const flow = useFlow();
	const [filter, setFilter] = useState<Filter>("all");
	const uploaded = (book: Book) => !!myId && book.addedBy === myId;
	const rows = (books.data ?? [])
		.filter((book) =>
			filter === "saved"
				? book.saved
				: filter === "uploaded"
					? uploaded(book)
					: book.saved || !!book.progress || uploaded(book),
		)
		.sort((a, b) => (b.progress?.updatedAt ?? "").localeCompare(a.progress?.updatedAt ?? ""));
	const [title, description] = empty[filter];
	return (
		<div className="flex flex-col">
			<h1 className="px-5 pt-[calc(14px+env(safe-area-inset-top))] text-[22px] leading-[30px] font-bold">
				내 서재
			</h1>
			<Segmented
				label="내 서재 보기"
				value={filter}
				onValueChange={setFilter}
				className="mx-5 mt-3 mb-2"
				options={[
					{ value: "all", label: "전체" },
					{ value: "saved", label: "담은 책" },
					{ value: "uploaded", label: "올린 책" },
				]}
			/>
			<LoadState pending={books.isPending} error={books.isError} retry={() => books.refetch()} />
			{books.isSuccess && rows.length === 0 && (
				<ResultSection title={title} description={description} />
			)}
			{rows.map((book) => (
				<BookRow
					key={book.id}
					book={book}
					onClick={() => flow.push("BookPage", { bookId: book.id })}
					detail={
						<span className="flex items-center gap-2">
							<ProgressBar value={book.progress?.pct ?? 0} className="w-24 shrink-0" />
							<span>
								{book.progress ? `${book.progress.pct}%` : "읽기 전"} · 흔적 {book.traceCount}
							</span>
							{book.saved && (
								<HeartIcon
									className="size-3.5 fill-destructive text-destructive"
									aria-label="담은 책"
								/>
							)}
						</span>
					}
					trailing={
						book.canRemove ? (
							<AppBarIconButton
								className="size-11"
								aria-label={`${book.title} 메뉴`}
								onClick={() => onMenu(book.id)}
							>
								<EllipsisVerticalIcon />
							</AppBarIconButton>
						) : undefined
					}
				/>
			))}
			<div className="px-5 pt-4">
				<Button variant="outline" size="lg" className="w-full" onClick={onImport}>
					전자책 올리기
				</Button>
			</div>
		</div>
	);
}
