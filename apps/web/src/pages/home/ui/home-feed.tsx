import type { Book } from "@app/contract";
import { useFlow } from "@stackflow/react";
import type { UseQueryResult } from "@tanstack/react-query";
import { BookCover, BookRow, bookByline, chapterLabel, ProgressBar } from "@/entities/book";
import { timeAgo } from "@/shared/lib";
import { Button, CardButton, ListHeader, LoadState } from "@/shared/ui";
import { ReadingCalendar } from "./reading-calendar";

/** 내 서재 홈: 읽은 날 캘린더 → 이어 읽기 → 읽을 수 있는 책 → 최근 흔적이 남은 책 → 올리기. */
export function HomeFeed({
	books,
	onImport,
}: {
	books: UseQueryResult<Book[]>;
	onImport: () => void;
}) {
	const flow = useFlow();
	const list = books.data ?? [];
	const lastOpened = list
		.filter((book) => book.progress)
		.sort((a, b) => (b.progress?.updatedAt ?? "").localeCompare(a.progress?.updatedAt ?? ""))[0];
	// Books people uploaded to this library first, then the shared public-domain ones.
	const shelf = [...list].sort(
		(a, b) =>
			Number(!!b.libraryId) - Number(!!a.libraryId) || b.createdAt.localeCompare(a.createdAt),
	);
	const traced = list
		.filter((book) => book.lastTraceAt)
		.sort((a, b) => (b.lastTraceAt ?? "").localeCompare(a.lastTraceAt ?? ""))
		.slice(0, 5);
	return (
		<div className="flex flex-col gap-7 pt-2">
			<ReadingCalendar books={list} />
			{lastOpened?.progress && (
				<ContinueCard
					book={lastOpened}
					onOpen={() => flow.push("ReaderPage", { bookId: lastOpened.id })}
				/>
			)}
			<section aria-labelledby="shelf-heading">
				<div className="flex items-baseline justify-between px-6 pb-3">
					<ListHeader id="shelf-heading" className="px-0 pt-0 pb-0">
						읽을 수 있는 책
					</ListHeader>
					{books.isSuccess && (
						<span className="text-t7 text-muted-foreground">{list.length}권</span>
					)}
				</div>
				<LoadState pending={books.isPending} error={books.isError} retry={() => books.refetch()} />
				<div className="flex snap-x snap-mandatory scroll-px-6 gap-3 overflow-x-auto px-6 pb-1 [scrollbar-width:none]">
					{shelf.map((book) => (
						<button
							key={book.id}
							type="button"
							onClick={() => flow.push("BookPage", { bookId: book.id })}
							className="flex w-[108px] shrink-0 snap-start flex-col text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
						>
							<BookCover book={book} size="md" />
							<span className="mt-2.5 line-clamp-2 text-st9 leading-5 font-semibold">
								{book.title}
							</span>
							<span className="truncate text-st10 leading-4 text-muted-foreground">
								{bookByline(book)}
							</span>
						</button>
					))}
				</div>
			</section>
			{traced.length > 0 && (
				<section aria-labelledby="traced-heading">
					<ListHeader id="traced-heading" className="pt-0 pb-1">
						최근 흔적이 남은 책
					</ListHeader>
					{traced.map((book) => (
						<BookRow
							key={book.id}
							book={book}
							onClick={() => flow.push("BookPage", { bookId: book.id })}
							detail={`흔적 ${book.traceCount} · ${book.readerCount}명 · ${timeAgo(book.lastTraceAt ?? "")}`}
						/>
					))}
				</section>
			)}
			<section className="mx-6 flex flex-col gap-3">
				<div className="flex items-center gap-4 rounded-xl bg-secondary p-5">
					<div className="flex min-w-0 flex-1 flex-col gap-1">
						<h2 className="text-t5 font-bold text-strong">가진 전자책을 올려보세요</h2>
						<p className="text-t7 leading-[19px] text-muted-foreground">
							EPUB·TXT·HTML 파일을 올리면 혼자 읽거나 모임 책으로 고를 수 있어요
						</p>
					</div>
					<Button size="lg" onClick={onImport}>
						올리기
					</Button>
				</div>
				<p className="text-st10 leading-4 text-muted-foreground">
					DRM이 걸린 전자책은 열 수 없어요
				</p>
			</section>
		</div>
	);
}

function ContinueCard({ book, onOpen }: { book: Book; onOpen: () => void }) {
	const progress = book.progress;
	if (!progress) return null;
	return (
		<CardButton onClick={onOpen} className="mx-6 flex items-center gap-4">
			<BookCover book={book} size="sm" />
			<span className="flex min-w-0 flex-1 flex-col">
				<span className="text-st10 font-semibold text-brand">이어 읽기</span>
				<span className="mt-0.5 truncate text-t5 font-bold text-strong">{book.title}</span>
				<span className="truncate text-t7 text-muted-foreground">
					{book.chapterCount > 1 ? `${chapterLabel(progress.ch, "")} · ` : ""}
					{progress.pct}%
				</span>
				<ProgressBar value={progress.pct} className="mt-2" />
			</span>
		</CardButton>
	);
}
