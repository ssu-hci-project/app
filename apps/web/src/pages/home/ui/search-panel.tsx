import type { PassageHit, Trace } from "@app/contract";
import { useFlow } from "@stackflow/react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { useDebounceValue, useLocalStorage } from "usehooks-ts";
import { BookRow, chapterLabel, useBookPages } from "@/entities/book";
import { personColor, personName } from "@/entities/profile";
import { orpc } from "@/shared/api";
import { cn, timeAgo } from "@/shared/lib";
import {
	Chip,
	InfiniteLoader,
	ListHeader,
	LoadingSkeleton,
	LoadState,
	RemovableChip,
	ResultSection,
	SearchField,
	TextButton,
} from "@/shared/ui";

type Kind = "all" | "book" | "text" | "trace";
const RECENT_KEY = "exchange-reading:recent-searches";

/** 찾기: 책 · 본문 · 흔적. The server searches chapter text paragraph by paragraph. */
export function SearchPanel({ libraryId, onImport }: { libraryId: string; onImport: () => void }) {
	const flow = useFlow();
	const [query, setQuery] = useState("");
	const catalog = useBookPages(libraryId, "catalog", !query.trim());
	const books = catalog.data?.pages.flatMap((page) => page.items) ?? [];
	const [kind, setKind] = useState<Kind>("all");
	const q = query.trim();
	const [debounced] = useDebounceValue(q, 250);
	const searchReady = !!q && q === debounced;
	const [recent, setRecent] = useLocalStorage<string[]>(RECENT_KEY, []);
	const results = useQuery({
		...orpc.books.search.queryOptions({ input: { libraryId, q: debounced } }),
		enabled: searchReady,
		placeholderData: keepPreviousData,
	});
	const remember = (value = query.trim()) => {
		if (value) setRecent([value, ...recent.filter((entry) => entry !== value)].slice(0, 10));
	};
	const openPassage = (target: { bookId: string; ch: number; p: number; s: number; e: number }) => {
		remember();
		flow.push("ReaderPage", {
			bookId: target.bookId,
			ch: String(target.ch),
			p: String(target.p),
			s: String(target.s),
			e: String(target.e),
		});
	};
	const data = searchReady && !results.isPlaceholderData ? results.data : undefined;
	const bookHits = data?.books ?? [];
	const passages = data?.passages ?? [];
	const traces = data?.traces ?? [];
	const searchPending = !searchReady || results.isPending || results.isPlaceholderData;
	const searchFailed = searchReady && !data && results.isError;
	const counts = {
		all: bookHits.length + passages.length + traces.length,
		book: bookHits.length,
		text: passages.length,
		trace: traces.length,
	};
	const shown = results.data;
	const chipCounts = shown && {
		all: shown.books.length + shown.passages.length + shown.traces.length,
		book: shown.books.length,
		text: shown.passages.length,
		trace: shown.traces.length,
	};
	return (
		<div className="flex flex-col">
			<search className="sticky top-0 z-10 block bg-background">
				<form
					className="pt-[env(safe-area-inset-top)]"
					onSubmit={(event) => {
						event.preventDefault();
						remember();
						(document.activeElement as HTMLElement | null)?.blur();
					}}
				>
					<SearchField
						label="책 제목, 작가, 본문 속 문장"
						value={query}
						onValueChange={(value) => {
							setQuery(value);
							setKind("all");
						}}
						placeholder="책 제목, 작가, 본문 속 문장"
						maxLength={50}
						autoComplete="off"
						enterKeyHint="search"
					/>
				</form>
			</search>

			{!q && (
				<div className="flex flex-col gap-2">
					{recent.length > 0 && (
						<section aria-labelledby="recent-heading">
							<div className="flex items-center justify-between pr-6">
								<ListHeader id="recent-heading" className="pt-0">
									최근 검색어
								</ListHeader>
								<TextButton size="sm" className="h-11" onClick={() => setRecent([])}>
									전체 삭제
								</TextButton>
							</div>
							<div className="flex flex-wrap gap-2 px-6">
								{recent.map((entry) => (
									<RemovableChip
										key={entry}
										size="m"
										onSelect={() => setQuery(entry)}
										onRemove={() => setRecent(recent.filter((item) => item !== entry))}
										removeLabel={`${entry} 지우기`}
									>
										{entry}
									</RemovableChip>
								))}
							</div>
						</section>
					)}
					<section aria-labelledby="library-books-heading">
						<ListHeader
							id="library-books-heading"
							className={recent.length > 0 ? undefined : "pt-0"}
						>
							서재의 책
						</ListHeader>
						<LoadState
							pending={catalog.isPending}
							error={!catalog.data && catalog.isError}
							retry={() => catalog.refetch()}
						/>
						{books.map((book) => (
							<BookRow
								key={book.id}
								book={book}
								onClick={() => flow.push("BookPage", { bookId: book.id })}
							/>
						))}
						<InfiniteLoader
							hasMore={catalog.hasNextPage}
							loading={catalog.isFetchingNextPage}
							error={catalog.isFetchNextPageError}
							loadMore={() => catalog.fetchNextPage()}
						/>
					</section>
				</div>
			)}

			{q && (
				<>
					<fieldset className="m-0 flex min-w-0 gap-2 overflow-x-auto border-0 px-6 pb-3 [scrollbar-width:none]">
						<legend className="sr-only">결과 종류</legend>
						{(
							[
								["all", "전체"],
								["book", "책"],
								["text", "본문"],
								["trace", "흔적"],
							] as const
						).map(([value, label]) => (
							<Chip key={value} size="m" selected={kind === value} onClick={() => setKind(value)}>
								{label}{" "}
								<span className="inline-grid min-w-[2ch] place-items-center tabular-nums">
									{!chipCounts ? (
										<>
											<span
												aria-hidden="true"
												className="block h-[0.9em] w-[1ch] rounded-xs bg-current opacity-20 motion-safe:animate-pulse"
											/>
											<span className="sr-only">세는 중</span>
										</>
									) : chipCounts[value] > 99 ? (
										"99+"
									) : (
										chipCounts[value]
									)}
								</span>
							</Chip>
						))}
					</fieldset>
					{searchFailed && <LoadState pending={false} error retry={() => results.refetch()} />}
					{!data && searchPending && <LoadingSkeleton />}
					{data && counts[kind] === 0 && (
						<ResultSection
							title={kind === "all" ? `‘${q}’에 대한 결과가 없어요` : "이 유형의 결과가 없어요"}
							description="다른 낱말로 찾아보거나 가진 전자책을 올려보세요."
							action={{ label: "전자책 올리기", onClick: onImport }}
						/>
					)}
					{(kind === "all" || kind === "book") && bookHits.length > 0 && (
						<ResultGroup title={kind === "all" ? "책" : undefined}>
							{bookHits.map((book) => (
								<BookRow
									key={book.id}
									book={book}
									detail={`${book.chapterCount}장 · 흔적 ${book.traceCount}`}
									onClick={() => {
										remember();
										flow.push("BookPage", { bookId: book.id });
									}}
								/>
							))}
						</ResultGroup>
					)}
					{(kind === "all" || kind === "text") && passages.length > 0 && (
						<ResultGroup
							title={kind === "all" ? "본문" : undefined}
							more={kind === "all" && passages.length > 5 ? () => setKind("text") : undefined}
						>
							{passages.slice(0, kind === "all" ? 5 : undefined).map((hit) => (
								<PassageRow
									key={`${hit.bookId}-${hit.ch}-${hit.p}-${hit.s}`}
									hit={hit}
									onOpen={() => openPassage(hit)}
								/>
							))}
						</ResultGroup>
					)}
					{(kind === "all" || kind === "trace") && traces.length > 0 && (
						<ResultGroup
							title={kind === "all" ? "흔적" : undefined}
							more={kind === "all" && traces.length > 3 ? () => setKind("trace") : undefined}
						>
							{traces.slice(0, kind === "all" ? 3 : undefined).map((trace) => (
								<TraceRow
									key={trace.id}
									trace={trace}
									query={q}
									bookTitle={data?.titles[trace.bookId] ?? ""}
									onOpen={() => openPassage(trace)}
								/>
							))}
						</ResultGroup>
					)}
				</>
			)}
		</div>
	);
}

function ResultGroup({
	title,
	more,
	children,
}: {
	title?: string;
	more?: () => void;
	children: ReactNode;
}) {
	return (
		<section className="pb-4">
			{title && (
				<div className="flex items-center justify-between pr-6">
					<ListHeader>{title}</ListHeader>
					{more && (
						<TextButton size="sm" className="h-11" onClick={more}>
							더보기
						</TextButton>
					)}
				</div>
			)}
			{children}
		</section>
	);
}

function Highlight({ text, query }: { text: string; query: string }) {
	const at = text.toLowerCase().indexOf(query.toLowerCase());
	if (at < 0) return <>{text}</>;
	return (
		<>
			{text.slice(0, at)}
			<mark className="rounded-xs bg-bookmark/20 text-inherit">
				{text.slice(at, at + query.length)}
			</mark>
			{text.slice(at + query.length)}
		</>
	);
}

function PassageRow({ hit, onOpen }: { hit: PassageHit; onOpen: () => void }) {
	return (
		<button
			type="button"
			onClick={onOpen}
			className="block w-full border-b px-6 py-3.5 text-left outline-none focus-visible:bg-muted active:bg-muted"
		>
			<span className="block text-st10 font-semibold text-muted-foreground">
				{hit.bookTitle} · {chapterLabel(hit.ch, hit.chapterTitle)}
			</span>
			<span className="mt-1.5 block font-serif text-t6 leading-6 break-keep">
				{hit.cutBefore && "…"}
				{hit.before}
				<mark className="rounded-xs bg-bookmark/20 text-inherit">{hit.match}</mark>
				{hit.after}
				{hit.cutAfter && "…"}
			</span>
		</button>
	);
}

function TraceRow({
	trace,
	query,
	bookTitle,
	onOpen,
}: {
	trace: Trace;
	query: string;
	bookTitle: string;
	onOpen: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onOpen}
			className="block w-full border-b px-6 py-3.5 text-left outline-none focus-visible:bg-muted active:bg-muted"
		>
			<span className="flex items-center gap-1.5 text-st10 font-semibold text-muted-foreground">
				<span
					className="size-2 rounded-full"
					style={{ backgroundColor: personColor(trace.author) }}
				/>
				{personName(trace.author, trace.isMine)} · {bookTitle} · {timeAgo(trace.createdAt)}
			</span>
			<span className="mt-1.5 block text-t6 leading-6 break-keep">
				{trace.q && (
					<span className="block font-semibold text-brand">
						Q. <Highlight text={trace.q} query={query} />
					</span>
				)}
				<Highlight text={trace.text ?? ""} query={query} />
			</span>
			<span className={cn("mt-1 block truncate font-serif text-t7 text-muted-foreground")}>
				“{trace.quote}”
			</span>
		</button>
	);
}
