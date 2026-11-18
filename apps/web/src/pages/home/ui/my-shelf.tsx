import { useActivity, useFlow } from "@stackflow/react";
import { useState } from "react";
import { BookRow, ProgressBar, useBookPages } from "@/entities/book";
import { BookMenuSheet } from "@/features/book-menu";
import {
	AppBarIconButton,
	Button,
	EllipsisVerticalIcon,
	HeartIcon,
	InfiniteLoader,
	LoadState,
	ResultSection,
	Segmented,
	useStepOverlay,
} from "@/shared/ui";

type Filter = "all" | "saved" | "uploaded";
const empty: Record<Filter, [string, string]> = {
	all: ["아직 읽거나 담은 책이 없어요", "홈이나 찾기에서 책을 골라보세요."],
	saved: ["담은 책이 없어요", "책 정보에서 ♡를 눌러 담아보세요."],
	uploaded: ["올린 책이 없어요", "EPUB이나 TXT 파일을 끌어다 놓거나 아래 버튼으로 올려보세요."],
};

/** 내 서재: books I opened, saved or uploaded. */
export function MyShelf({ libraryId, onImport }: { libraryId: string; onImport: () => void }) {
	const flow = useFlow();
	const { isActive } = useActivity();
	const [filter, setFilter] = useState<Filter>("all");
	const books = useBookPages(libraryId, filter === "all" ? "mine" : filter, isActive);
	const rows = books.data?.pages.flatMap((page) => page.items) ?? [];
	const overlay = useStepOverlay();
	const [menuId, setMenuId] = useState<string>();
	const [title, description] = empty[filter];
	return (
		<div className="flex flex-col">
			<h1 className="px-6 pt-[calc(14px+env(safe-area-inset-top))] text-t3 leading-[1.35] font-bold text-strong">
				내 서재
			</h1>
			<Segmented
				label="내 서재 보기"
				value={filter}
				onValueChange={setFilter}
				className="mx-6 mt-3 mb-2"
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
			<div>
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
										filled
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
									onClick={() => {
										setMenuId(book.id);
										overlay.open("book-menu");
									}}
								>
									<EllipsisVerticalIcon />
								</AppBarIconButton>
							) : undefined
						}
					/>
				))}
			</div>
			<InfiniteLoader
				hasMore={isActive && books.hasNextPage}
				loading={books.isFetchingNextPage}
				error={books.isFetchNextPageError}
				loadMore={() => books.fetchNextPage()}
			/>
			<BookMenuSheet book={rows.find((book) => book.id === menuId)} />
			<div className="px-6 pt-4">
				<Button variant="outline" size="lg" className="w-full" onClick={onImport}>
					전자책 올리기
				</Button>
			</div>
		</div>
	);
}
