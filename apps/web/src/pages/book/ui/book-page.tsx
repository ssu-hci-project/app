import type { ActivityComponentType } from "@stackflow/react";
import { useActivity, useFlow } from "@stackflow/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronLeftIcon, HeartIcon } from "lucide-react";
import { useState } from "react";
import { BookCover, chapterLabel, chapterNumber, readingTime } from "@/entities/book";
import { useCurrentLibrary } from "@/entities/library";
import { personColor, personName, ReaderAvatar } from "@/entities/profile";
import { orpc } from "@/shared/api";
import { cn, timeAgo } from "@/shared/lib";
import {
	AppBar,
	AppBarIconButton,
	AppScreen,
	AppScreenContent,
	Button,
	LoadState,
	useNotice,
} from "@/shared/ui";

export const BookPage: ActivityComponentType<"BookPage"> = ({ params }) => {
	const flow = useFlow();
	const { isRoot } = useActivity();
	const notify = useNotice();
	const { library } = useCurrentLibrary();
	const [scrolled, setScrolled] = useState(false);
	const detail = useQuery({
		...orpc.books.get.queryOptions({
			input: { libraryId: library?.id ?? "", bookId: params.bookId },
		}),
		enabled: !!library,
	});
	const save = useMutation(
		orpc.saved.set.mutationOptions({
			onSuccess: ({ saved }) => notify(saved ? "내 서재에 담았어요" : "내 서재에서 뺐어요"),
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
	const saved = save.isPending ? !!save.variables?.saved : !!book?.saved;
	const readers = data?.readers ?? [];
	return (
		<AppScreen>
			<AppBar
				className={cn("border-b border-transparent transition-colors", scrolled && "border-border")}
			>
				<AppBarIconButton
					className="size-11"
					aria-label="이전 화면으로"
					onClick={() => (isRoot ? flow.replace("HomePage", {}) : flow.pop())}
				>
					<ChevronLeftIcon />
				</AppBarIconButton>
				<span
					aria-hidden={!scrolled}
					className={cn(
						"min-w-0 flex-1 truncate text-[17px] font-semibold opacity-0 transition-opacity",
						scrolled && "opacity-100",
					)}
				>
					{book?.title}
				</span>
			</AppBar>
			<AppScreenContent
				className="bg-card pb-[calc(104px+env(safe-area-inset-bottom))]"
				onScroll={(event) => setScrolled(event.currentTarget.scrollTop > 200)}
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
							style={{ background: `linear-gradient(${book.color}21, var(--card) 78%)` }}
						>
							<BookCover book={book} size="lg" />
							<h1 className="mt-5 text-2xl leading-8 font-bold break-keep">{book.title}</h1>
							<p className="mt-1 text-[15px] text-muted-foreground">{book.author || "작자 미상"}</p>
							<p className="mt-1 text-[13px] text-muted-foreground">
								{book.chapterCount}장 · {readingTime(book.chars)}
							</p>
						</header>
						<dl className="mx-5 mt-6 grid grid-cols-3 rounded-xl bg-muted py-4 text-center">
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
									<dt className="text-xs text-muted-foreground">{label}</dt>
									<dd className="text-base font-bold">{value}</dd>
								</div>
							))}
						</dl>
						{readers.length > 0 && (
							<section className="px-5 pt-7">
								<h2 className="pb-3 text-lg font-bold">함께 읽는 사람</h2>
								<div className="flex items-center">
									<div className="flex">
										{readers.slice(0, 6).map((person, index) => (
											<ReaderAvatar
												key={person.id}
												person={person}
												name={person.nick ?? "독자"}
												size="md"
												className={cn("ring-2 ring-card", index > 0 && "-ml-2")}
											/>
										))}
									</div>
									<span className="ml-3 text-[13px] text-muted-foreground">
										{readers
											.slice(0, 3)
											.map((person) => person.nick ?? "독자")
											.join(", ")}
										{readers.length > 3 && ` 외 ${readers.length - 3}명`}
									</span>
								</div>
							</section>
						)}
						{data.opening.length > 0 && (
							<section className="px-5 pt-7">
								<h2 className="pb-3 text-lg font-bold">첫 문장</h2>
								<p className="line-clamp-6 font-serif text-base leading-7 whitespace-pre-line break-keep">
									{data.opening.join("\n\n")}
								</p>
							</section>
						)}
						{data.recentTraces.length > 0 && (
							<section className="flex flex-col gap-2.5 px-5 pt-7">
								<h2 className="pb-0.5 text-lg font-bold">최근 흔적</h2>
								{data.recentTraces.map((trace) => (
									<button
										key={trace.id}
										type="button"
										onClick={() => read(trace)}
										className="rounded-xl border p-3.5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-muted"
									>
										<span className="block truncate font-serif text-[13px] text-muted-foreground">
											“{trace.quote}”
										</span>
										<span className="mt-1.5 block text-sm leading-[21px]">
											{trace.q && (
												<span className="block font-semibold text-primary">Q. {trace.q}</span>
											)}
											{trace.text}
										</span>
										<span className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
											<span
												className="size-2 rounded-full"
												style={{ backgroundColor: personColor(trace.author) }}
											/>
											{personName(trace.author, trace.isMine)} · {timeAgo(trace.createdAt)}
										</span>
									</button>
								))}
							</section>
						)}
						<section className="px-5 pt-7">
							<h2 className="pb-1 text-lg font-bold">목차</h2>
							<ol>
								{data.chapters.map((chapter) => (
									<li key={chapter.ch}>
										<button
											type="button"
											onClick={() => read({ ch: chapter.ch })}
											className="flex h-13 w-full items-center gap-3 border-b text-left text-[15px] outline-none focus-visible:bg-muted active:bg-muted"
										>
											<span className="w-9 shrink-0 text-[13px] font-semibold text-primary">
												{chapterNumber(chapter.ch).replace("장", "")}
											</span>
											<span className="min-w-0 flex-1 truncate">
												{chapter.title || chapterLabel(chapter.ch, "")}
											</span>
											{book.progress?.ch === chapter.ch && (
												<span className="shrink-0 text-xs font-semibold text-primary">읽는 중</span>
											)}
										</button>
									</li>
								))}
							</ol>
						</section>
					</>
				)}
			</AppScreenContent>
			{book && (
				<div className="absolute inset-x-0 bottom-0 z-10 flex gap-2.5 bg-card px-5 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))] shadow-[0_-12px_16px_var(--card)]">
					<Button
						variant="outline"
						aria-pressed={saved}
						aria-label={saved ? "내 서재에서 빼기" : "내 서재에 담기"}
						className="size-14 shrink-0 rounded-xl"
						onClick={() => save.mutate({ bookId: book.id, saved: !saved })}
					>
						<HeartIcon className={cn("size-6!", saved && "fill-destructive text-destructive")} />
					</Button>
					<Button
						className="h-14 flex-1 rounded-xl text-[17px] font-semibold"
						onClick={() => read()}
					>
						{book.progress?.pct ? `이어 읽기 · ${book.progress.pct}%` : "바로 읽기"}
					</Button>
				</div>
			)}
		</AppScreen>
	);
};
