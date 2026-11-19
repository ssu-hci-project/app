import type { InferActivityParams } from "@stackflow/config";
import { useActivity, useFlow } from "@stackflow/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
	BookCover,
	bookByline,
	chapterLabel,
	chapterNumber,
	findCachedBook,
	readingTime,
} from "@/entities/book";
import { useCurrentLibrary } from "@/entities/library";
import { personColor, personName, ReaderAvatar } from "@/entities/profile";
import { orpc } from "@/shared/api";
import { cn, timeAgo } from "@/shared/lib";
import {
	AppBar,
	AppBarIconButton,
	AppScreen,
	AppScreenContent,
	AvatarGroup,
	BottomCta,
	Button,
	CardButton,
	ChevronLeftIcon,
	HeartIcon,
	List,
	ListButton,
	ListHeader,
	LoadState,
	PopOnSelect,
	Skeleton,
} from "@/shared/ui";
import { GroupActions } from "./group-actions";

export function BookPage({ params }: { params: InferActivityParams<"BookPage"> }) {
	const flow = useFlow();
	const { isRoot } = useActivity();
	const { library } = useCurrentLibrary();
	const [headerMode, setHeaderMode] = useState<"top" | "scrolled" | "compact">("top");
	const queryClient = useQueryClient();
	const detail = useQuery({
		...orpc.books.get.queryOptions({
			input: { libraryId: library?.id ?? "", bookId: params.bookId },
		}),
		enabled: !!library,
		placeholderData: () => {
			const cached = findCachedBook(queryClient, params.bookId);
			return cached && { book: cached, chapters: [], opening: [], readers: [], recentTraces: [] };
		},
	});
	const libraryId = library?.id;
	const readerCh = detail.data?.book.progress?.ch ?? 0;
	useEffect(() => {
		if (!libraryId) return;
		const input = { libraryId, bookId: params.bookId };
		queryClient.prefetchQuery(
			orpc.books.chapter.queryOptions({ input: { ...input, ch: readerCh } }),
		);
		queryClient.prefetchQuery(orpc.traces.list.queryOptions({ input }));
	}, [libraryId, params.bookId, readerCh, queryClient]);
	const save = useMutation(
		orpc.saved.set.mutationOptions({
			scope: { id: `saved:${params.bookId}` },
		}),
	);
	const read = (target: { ch?: number; p?: number; s?: number; e?: number } = {}) =>
		flow.push("ReaderPage", {
			bookId: params.bookId,
			...(target.ch !== undefined && { ch: String(target.ch) }),
			...(target.p !== undefined && {
				p: String(target.p),
				s: String(target.s),
				e: String(target.e),
			}),
		});
	const data = detail.data;
	const book = data?.book;
	const coverTint = book ? `color-mix(in srgb, ${book.color} 13%, var(--background))` : undefined;
	const showTitle = headerMode === "compact";
	const saved = !!book?.saved;
	const readers = data?.readers ?? [];
	return (
		<AppScreen>
			<AppBar
				className={cn(
					"border-b border-transparent transition-colors",
					headerMode !== "top" && "border-border",
				)}
				style={{ backgroundColor: headerMode === "top" ? coverTint : undefined }}
			>
				<AppBarIconButton
					className="size-11"
					aria-label="이전 화면으로"
					onClick={() => (isRoot ? flow.replace("HomePage", {}) : flow.pop())}
				>
					<ChevronLeftIcon />
				</AppBarIconButton>
				<span
					aria-hidden={!showTitle}
					className={cn(
						"min-w-0 flex-1 truncate text-t5 font-semibold opacity-0 transition-opacity",
						showTitle && "opacity-100",
					)}
				>
					{book?.title}
				</span>
			</AppBar>
			<AppScreenContent
				className="bg-background pb-[calc(112px+env(safe-area-inset-bottom))]"
				onScroll={(event) => {
					const { scrollTop } = event.currentTarget;
					setHeaderMode(scrollTop > 200 ? "compact" : scrollTop > 12 ? "scrolled" : "top");
				}}
			>
				<LoadState
					pending={detail.isPending}
					error={detail.isError}
					retry={() => detail.refetch()}
					shape="article"
				/>
				{book && data && (
					<>
						<header
							className="flex flex-col items-center px-6 pt-3 text-center"
							style={{ background: `linear-gradient(${coverTint}, var(--background) 78%)` }}
						>
							<BookCover book={book} size="lg" />
							<h1 className="mt-5 text-st3 leading-[1.35] font-bold text-strong break-keep">
								{book.title}
							</h1>
							<p className="mt-1 text-t6 text-muted-foreground">{bookByline(book)}</p>
							<p className="mt-1 text-t7 text-muted-foreground">
								{book.chapterCount}장 · {readingTime(book.chars)}
							</p>
						</header>
						<dl className="mx-6 mt-6 grid grid-cols-3 rounded-xl bg-muted py-4 text-center">
							{(
								[
									["장", book.chapterCount],
									["흔적", book.traceCount],
									["함께 읽는 사람", readers.length],
								] as const
							).map(([label, value], index) => (
								<div
									key={label}
									className={cn("flex flex-col-reverse", index > 0 && "border-l border-input")}
								>
									<dt className="text-st10 text-muted-foreground">{label}</dt>
									<dd className="text-st8 font-bold">{value}</dd>
								</div>
							))}
						</dl>
						{library && <GroupActions library={library} book={book} />}
						{readers.length > 0 && (
							<section className="px-6 pt-7">
								<ListHeader className="px-0 pt-0 pb-3">함께 읽는 사람</ListHeader>
								<div className="flex items-center gap-2.5">
									<AvatarGroup>
										{readers.slice(0, 5).map((person) => (
											<ReaderAvatar
												key={person.id}
												person={person}
												name={personName(person, false)}
												size="sm"
											/>
										))}
									</AvatarGroup>
									<span className="min-w-0 truncate text-st9 font-semibold text-sub">
										{readers
											.slice(0, 3)
											.map((person) => personName(person, false))
											.join(", ")}
										{readers.length > 3 && ` 외 ${readers.length - 3}명`}
									</span>
								</div>
							</section>
						)}
						{data.opening.length > 0 && (
							<section className="px-6 pt-7">
								<ListHeader className="px-0 pt-0 pb-3">첫 문장</ListHeader>
								<p className="line-clamp-6 font-serif text-st8 leading-7 whitespace-pre-line break-keep">
									{data.opening.join("\n\n")}
								</p>
							</section>
						)}
						{data.recentTraces.length > 0 && (
							<section className="flex flex-col gap-2.5 px-6 pt-7">
								<ListHeader className="px-0 pt-0 pb-0.5">최근 흔적</ListHeader>
								{data.recentTraces.map((trace) => (
									<CardButton key={trace.id} onClick={() => read(trace)}>
										<span className="block truncate font-serif text-t7 text-muted-foreground">
											“{trace.quote}”
										</span>
										<span className="mt-1 block text-t6 leading-[1.467] font-semibold text-strong">
											{trace.q && (
												<span className="block font-semibold text-brand">Q. {trace.q}</span>
											)}
											{trace.text}
										</span>
										<span className="mt-2 flex items-center gap-1.5 text-t7 font-medium text-muted-foreground">
											<span
												className="size-2 rounded-full"
												style={{ backgroundColor: personColor(trace.author) }}
											/>
											{personName(trace.author, trace.isMine)} · {timeAgo(trace.createdAt)}
										</span>
									</CardButton>
								))}
							</section>
						)}
						<section className="pt-3">
							<ListHeader>목차</ListHeader>
							{detail.isPlaceholderData && (
								<div className="flex flex-col gap-4 px-6 py-3" aria-hidden="true">
									<Skeleton className="h-5 w-3/4" />
									<Skeleton className="h-5 w-1/2" />
								</div>
							)}
							<List>
								{data.chapters.map((chapter) => (
									<ListButton
										key={chapter.ch}
										onClick={() => read({ ch: chapter.ch })}
										leading={
											<span className="block w-7 text-t7 font-semibold text-brand">
												{chapterNumber(chapter.ch).replace("장", "")}
											</span>
										}
										title={chapter.title || chapterLabel(chapter.ch, "")}
										trailing={
											book.progress?.ch === chapter.ch && (
												<span className="pr-3 text-st10 font-semibold text-brand">읽는 중</span>
											)
										}
									/>
								))}
							</List>
						</section>
					</>
				)}
			</AppScreenContent>
			{book && (
				<BottomCta>
					<Button
						variant="weak"
						size="lg"
						aria-pressed={saved}
						aria-label={saved ? "내 서재에서 빼기" : "내 서재에 담기"}
						className="w-14 min-w-0 shrink-0 px-0"
						onClick={() => save.mutate({ bookId: book.id, saved: !saved })}
					>
						<PopOnSelect selected={saved}>
							<HeartIcon
								filled={saved}
								className={cn(
									"size-6! transition-colors duration-200",
									saved && "fill-destructive text-destructive",
								)}
							/>
						</PopOnSelect>
					</Button>
					<Button size="lg" className="flex-1" onClick={() => read()}>
						{book.progress?.pct ? `이어 읽기 · ${book.progress.pct}%` : "바로 읽기"}
					</Button>
				</BottomCta>
			)}
		</AppScreen>
	);
}
