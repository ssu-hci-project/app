import type { Book } from "@app/contract";
import { useFlow } from "@stackflow/react";
import type { UseQueryResult } from "@tanstack/react-query";
import { BookCover, BookRow, chapterLabel, ProgressBar } from "@/entities/book";
import { timeAgo } from "@/shared/lib";
import { Button, LoadState } from "@/shared/ui";
import { ReadingCalendar } from "./reading-calendar";

/** 홈: 이어 읽기 → 읽은 날 캘린더 → 함께 읽는 책 → 최근 흔적이 남은 책 → 올리기. */
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
			{lastOpened?.progress && (
				<ContinueCard
					book={lastOpened}
					onOpen={() => flow.push("ReaderPage", { bookId: lastOpened.id })}
				/>
			)}
			<ReadingCalendar books={list} />
			<section aria-labelledby="shelf-heading">
				<div className="flex items-baseline justify-between px-6 pb-3">
					<h2 id="shelf-heading" className="text-t5 font-bold text-strong">
						함께 읽는 책
					</h2>
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
								{book.author || "작자 미상"}
							</span>
						</button>
					))}
				</div>
			</section>
			{traced.length > 0 && (
				<section aria-labelledby="traced-heading">
					<h2 id="traced-heading" className="px-6 pb-1 text-t5 font-bold text-strong">
						최근 흔적이 남은 책
					</h2>
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
							EPUB·TXT·HTML 파일을 올리면 이 서재 사람들이 함께 읽을 수 있어요
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
		<button
			type="button"
			onClick={onOpen}
			className="mx-6 flex items-center gap-4 rounded-2xl bg-neutral-weak p-4 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-[color-mix(in_oklch,var(--neutral-weak),var(--foreground)_8%)]"
		>
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
		</button>
	);
}
