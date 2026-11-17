import type { Book, PassageHit, Trace } from "@app/contract";
import { useFlow } from "@stackflow/react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { SearchIcon, XIcon } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useDebounceValue, useLocalStorage } from "usehooks-ts";
import { BookRow, chapterLabel } from "@/entities/book";
import { personColor, personName } from "@/entities/profile";
import { orpc } from "@/shared/api";
import { cn, timeAgo } from "@/shared/lib";
import { Button, ResultSection, Spinner } from "@/shared/ui";

type Kind = "all" | "book" | "text" | "trace";
const RECENT_KEY = "exchange-reading:recent-searches";

/** 찾기: 책 · 본문 · 흔적. The server searches chapter text paragraph by paragraph. */
export function SearchPanel({
	libraryId,
	books,
	onImport,
}: {
	libraryId: string;
	books: Book[];
	onImport: () => void;
}) {
	const flow = useFlow();
	const [query, setQuery] = useState("");
	const [kind, setKind] = useState<Kind>("all");
	const [debounced] = useDebounceValue(query.trim(), 250);
	const [recent, setRecent] = useLocalStorage<string[]>(RECENT_KEY, []);
	const results = useQuery({
		...orpc.books.search.queryOptions({ input: { libraryId, q: debounced } }),
		enabled: !!debounced,
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
	const q = query.trim();
	const data = q && debounced ? results.data : undefined;
	const bookHits = (data?.bookIds ?? [])
		.map((id) => books.find((book) => book.id === id))
		.filter((book): book is Book => !!book);
	const passages = data?.passages ?? [];
	const traces = data?.traces ?? [];
	const textPending = results.isFetching || q !== debounced;
	const counts = {
		all: bookHits.length + passages.length + traces.length,
		book: bookHits.length,
		text: passages.length,
		trace: traces.length,
	};
	const byRecent = [...books].sort((a, b) =>
		(b.progress?.updatedAt ?? b.createdAt).localeCompare(a.progress?.updatedAt ?? a.createdAt),
	);
	return (
		<div className="flex flex-col">
			<search className="sticky top-0 z-10 block bg-background">
				<form
					className="px-5 pt-[calc(12px+env(safe-area-inset-top))] pb-2"
					onSubmit={(event) => {
						event.preventDefault();
						remember();
						(document.activeElement as HTMLElement | null)?.blur();
					}}
				>
					<label className="flex h-12 items-center gap-2 rounded-xl bg-muted pr-1 pl-3.5 focus-within:ring-3 focus-within:ring-ring/50">
						<SearchIcon className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
						<span className="sr-only">책 제목, 작가, 본문 속 문장</span>
						<input
							// biome-ignore lint/a11y/noAutofocus: 찾기 탭을 열면 바로 입력합니다.
							autoFocus
							type="search"
							enterKeyHint="search"
							autoComplete="off"
							value={query}
							onChange={(event) => {
								setQuery(event.target.value);
								setKind("all");
							}}
							placeholder="책 제목, 작가, 본문 속 문장"
							className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
						/>
						{query && (
							<button
								type="button"
								aria-label="검색어 지우기"
								onClick={() => setQuery("")}
								className="grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground"
							>
								<XIcon className="size-5" />
							</button>
						)}
					</label>
				</form>
			</search>

			{!q && (
				<div className="flex flex-col gap-7 pt-3">
					{recent.length > 0 && (
						<section aria-labelledby="recent-heading">
							<div className="flex items-center justify-between px-5">
								<h2 id="recent-heading" className="text-[15px] font-bold">
									최근 검색어
								</h2>
								<Button
									variant="ghost"
									className="h-11 text-muted-foreground"
									onClick={() => setRecent([])}
								>
									전체 삭제
								</Button>
							</div>
							<div className="flex flex-wrap gap-2 px-5 pt-1">
								{recent.map((entry) => (
									<span key={entry} className="flex h-10 items-center rounded-full border bg-card">
										<button
											type="button"
											onClick={() => setQuery(entry)}
											className="h-full pr-1 pl-4 text-sm"
										>
											{entry}
										</button>
										<button
											type="button"
											aria-label={`${entry} 지우기`}
											onClick={() => setRecent(recent.filter((item) => item !== entry))}
											className="grid size-10 place-items-center rounded-full text-muted-foreground"
										>
											<XIcon className="size-4" />
										</button>
									</span>
								))}
							</div>
						</section>
					)}
					<section aria-labelledby="library-books-heading">
						<h2 id="library-books-heading" className="px-5 pb-1 text-[15px] font-bold">
							서재의 책
						</h2>
						{byRecent.map((book) => (
							<BookRow
								key={book.id}
								book={book}
								onClick={() => flow.push("BookPage", { bookId: book.id })}
							/>
						))}
					</section>
				</div>
			)}

			{q && (
				<>
					<fieldset className="m-0 flex min-w-0 gap-2 overflow-x-auto border-0 px-5 pt-1 pb-3 [scrollbar-width:none]">
						<legend className="sr-only">결과 종류</legend>
						{(
							[
								["all", "전체"],
								["book", "책"],
								["text", "본문"],
								["trace", "흔적"],
							] as const
						).map(([value, label]) => (
							<button
								key={value}
								type="button"
								aria-pressed={kind === value}
								onClick={() => setKind(value)}
								className="h-10 shrink-0 rounded-full bg-muted px-4 text-sm font-semibold whitespace-nowrap text-foreground aria-pressed:bg-foreground aria-pressed:text-background"
							>
								{label} {value === "text" && textPending ? "…" : counts[value]}
							</button>
						))}
					</fieldset>
					{!data && textPending && (
						<div
							className="flex flex-col items-center gap-3 py-16 text-muted-foreground"
							role="status"
						>
							<Spinner className="size-6" />책 속 문장을 찾는 중이에요
						</div>
					)}
					{data && counts.all === 0 && !textPending && (
						<ResultSection
							title={`‘${q}’에 대한 결과가 없어요`}
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
									bookTitle={books.find((book) => book.id === trace.bookId)?.title ?? ""}
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
				<div className="flex h-11 items-center justify-between px-5">
					<h2 className="text-[15px] font-bold">{title}</h2>
					{more && (
						<Button variant="ghost" className="h-11 text-muted-foreground" onClick={more}>
							더보기
						</Button>
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
			className="block w-full border-b px-5 py-3.5 text-left outline-none focus-visible:bg-muted active:bg-muted"
		>
			<span className="block text-xs font-semibold text-muted-foreground">
				{hit.bookTitle} · {chapterLabel(hit.ch, hit.chapterTitle)}
			</span>
			<span className="mt-1.5 block font-serif text-[15px] leading-6 break-keep">
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
			className="block w-full border-b px-5 py-3.5 text-left outline-none focus-visible:bg-muted active:bg-muted"
		>
			<span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
				<span
					className="size-2 rounded-full"
					style={{ backgroundColor: personColor(trace.author) }}
				/>
				{personName(trace.author, trace.isMine)} · {bookTitle} · {timeAgo(trace.createdAt)}
			</span>
			<span className="mt-1.5 block text-[15px] leading-6 break-keep">
				{trace.q && (
					<span className="block font-semibold text-primary">
						Q. <Highlight text={trace.q} query={query} />
					</span>
				)}
				<Highlight text={trace.text ?? ""} query={query} />
			</span>
			<span className={cn("mt-1 block truncate font-serif text-[13px] text-muted-foreground")}>
				“{trace.quote}”
			</span>
		</button>
	);
}
