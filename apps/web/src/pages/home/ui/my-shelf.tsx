import type { Book } from "@app/contract";
import { useActivity, useFlow } from "@stackflow/react";
import { useState } from "react";
import { BookRow, ProgressBar, useBookPages } from "@/entities/book";
import { bookLibrary, useCurrentLibrary } from "@/entities/library";
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
	all: ["아직 읽거나 담은 책이 없어요", "혼자 읽은 책과 모임에서 함께 읽은 책이 모두 여기 모여요."],
	saved: ["담은 책이 없어요", "책 정보에서 ♡를 눌러 담아보세요."],
	uploaded: ["올린 책이 없어요", "EPUB이나 TXT 파일을 끌어다 놓거나 아래 버튼으로 올려보세요."],
};

/** 내 서재: books I opened, saved or uploaded in any library or group — not just the current one. */
export function MyShelf({ libraryId, onImport }: { libraryId: string; onImport: () => void }) {
	const flow = useFlow();
	const { isActive } = useActivity();
	const { libraries, libraryId: currentId, select } = useCurrentLibrary();
	const open = (book: Book) => {
		// Traces live in a library, so open the book where I read it together.
		const target = bookLibrary(book, libraries, currentId);
		if (target && target !== currentId) select(target);
		flow.push("BookPage", { bookId: book.id });
	};
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
			<p className="px-6 pt-1 text-t7 text-muted-foreground">
				혼자 읽은 책과 모든 모임에서 함께 읽은 책이에요
			</p>
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
						onClick={() => open(book)}
						detail={
							<>
								<span className="mb-1 block truncate text-brand">
									{book.readIn.length
										? `${book.readIn.map((group) => group.name).join(" · ")}에서 함께 읽어요`
										: "혼자 읽는 책"}
								</span>
								<span className="flex items-center gap-2">
									<ProgressBar value={book.progress?.pct ?? 0} className="w-24 shrink-0" />
									<span>
										{book.progress ? `${book.progress.pct}%` : "읽기 전"} · 내 흔적{" "}
										{book.traceCount}
									</span>
									{book.saved && (
										<HeartIcon
											filled
											className="size-3.5 fill-destructive text-destructive"
											aria-label="담은 책"
										/>
									)}
								</span>
							</>
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
