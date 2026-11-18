import type { Drawing, reactionEmojis, Trace } from "@app/contract";
import type { InferActivityParams } from "@stackflow/config";
import { useActivity, useFlow } from "@stackflow/react";
import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useDebounceCallback } from "usehooks-ts";
import { chapterLabel, ProgressBar } from "@/entities/book";
import { useCurrentLibrary } from "@/entities/library";
import { useProfile } from "@/entities/profile";
import { DrawingView, overlapping } from "@/entities/trace";
import { ProfileSheet, useProfileGate } from "@/features/profile-edit";
import { FilterIcon, FilterSheet, FontSheet, useReaderSettings } from "@/features/reader-settings";
import { orpc } from "@/shared/api";
import { cn } from "@/shared/lib";
import {
	ALargeSmallIcon,
	AppBarIconButton,
	AppScreen,
	ChevronLeftIcon,
	ChevronRightIcon,
	LoadingSkeleton,
	LoadState,
	useNotice,
	useStepOverlay,
} from "@/shared/ui";
import { bookPercent, GAP, GUTTER, parseTarget, readLocalPosition } from "../lib/position";
import { type Passage, useReaderStore } from "../model/reader-store";
import { useReadingProgress } from "../model/use-reading-progress";
import { ChapterText } from "./chapter-view";
import { DecorateMode } from "./decorate-mode";
import { MemoSheet } from "./memo-sheet";
import { QuestionSheet } from "./question-sheet";
import { SameQuestionSheet } from "./same-question-sheet";
import { SelectionToolbar, type ToolbarAction } from "./selection-toolbar";
import { TraceSheet } from "./trace-sheet";

type Pending =
	| { kind: "ratio"; ratio: number }
	| { kind: "end" }
	| { kind: "passage"; p: number; s: number; e: number };
type Anchor = { trace: Trace; x: number; y: number };

export function ReaderPage({ params }: { params: InferActivityParams<"ReaderPage"> }) {
	const flow = useFlow();
	const { isActive, isRoot } = useActivity();
	const overlay = useStepOverlay(["thread", "memo", "question", "same"]);
	const notify = useNotice();
	const queryClient = useQueryClient();
	const gate = useProfileGate();
	const profile = useProfile();
	const { library, query: libraries } = useCurrentLibrary();
	const libraryId = library?.id ?? "";
	const bookId = params.bookId;
	const settings = useReaderSettings();
	const { filters } = settings;
	const typing = useReaderStore((state) => state.typing);
	const writes = useIsMutating();

	const detail = useQuery({
		...orpc.books.get.queryOptions({ input: { libraryId, bookId } }),
		enabled: !!libraryId,
	});
	const [ch, setCh] = useState<number | null>(null);
	const pending = useRef<Pending | null>(null);
	// Decide where to open once the book has loaded: a target passage, this device, or the server.
	useEffect(() => {
		if (ch !== null || !detail.data) return;
		const target = parseTarget(params);
		const local = readLocalPosition(bookId);
		const server = detail.data.book.progress;
		const saved = local && (!server || local.at >= server.updatedAt) ? local : server;
		const last = Math.max(0, detail.data.chapters.length - 1);
		if (target.passage) pending.current = { kind: "passage", ...target.passage };
		else
			pending.current = { kind: "ratio", ratio: target.ch === undefined ? (saved?.ratio ?? 0) : 0 };
		setCh(Math.min(last, target.ch ?? saved?.ch ?? 0));
	}, [ch, detail.data, params, bookId]);

	const chapter = useQuery({
		...orpc.books.chapter.queryOptions({ input: { libraryId, bookId, ch: ch ?? 0 } }),
		enabled: !!libraryId && ch !== null,
	});
	const loading = !chapter.data || chapter.data.ch !== ch;
	const failedRequest = [libraries, detail, chapter].find((query) => query.isLoadingError);
	const traces = useQuery({
		...orpc.traces.list.queryOptions({ input: { libraryId, bookId } }),
		enabled: !!libraryId,
		refetchInterval: overlay.current === "thread" && !typing && !writes ? 15_000 : false,
	});
	const chapterCount = detail.data?.chapters.length ?? 0;
	useEffect(() => {
		if (ch === null || ch + 1 >= chapterCount) return;
		queryClient.prefetchQuery(
			orpc.books.chapter.queryOptions({ input: { libraryId, bookId, ch: ch + 1 } }),
		);
	}, [ch, chapterCount, libraryId, bookId, queryClient]);

	const allTraces = traces.data ?? [];
	const chapterTraces = useMemo(
		() => allTraces.filter((trace) => trace.ch === ch && trace.kind !== "reply"),
		[allTraces, ch],
	);
	const visible = useMemo(
		() => ({ underline: filters.underline, memo: filters.memo, react: filters.react }),
		[filters.underline, filters.memo, filters.react],
	);

	// ---- pagination ---------------------------------------------------------------------------
	const mainRef = useRef<HTMLDivElement>(null);
	const pagesRef = useRef<HTMLDivElement>(null);
	const colsRef = useRef<HTMLDivElement>(null);
	const [size, setSize] = useState({ width: 0, height: 0 });
	const [pages, setPages] = useState(1);
	const [page, setPage] = useState(0);
	const [animate, setAnimate] = useState(false);
	const [anchors, setAnchors] = useState<Anchor[]>([]);
	const [fontsReady, setFontsReady] = useState(0);
	const position = useRef({ page: 0, pages: 1 });
	position.current = { page, pages };
	useLayoutEffect(() => {
		const element = pagesRef.current;
		if (!element) return;
		const observer = new ResizeObserver(() =>
			setSize({ width: element.clientWidth, height: element.clientHeight }),
		);
		observer.observe(element);
		return () => observer.disconnect();
	}, []);
	// Web fonts (the serif body, handwriting) reflow the text when they arrive; measure again.
	useEffect(() => {
		const bump = () => setFontsReady((count) => count + 1);
		document.fonts?.ready.then(bump);
		document.fonts?.addEventListener("loadingdone", bump);
		return () => document.fonts?.removeEventListener("loadingdone", bump);
	}, []);
	const columnWidth = Math.max(0, size.width - GUTTER * 2);
	const step = columnWidth + GAP;

	const [selection, setSelection] = useState<Passage | null>(null);
	const [emojiOpen, setEmojiOpen] = useState(false);
	const [toolbarTop, setToolbarTop] = useState<{ top: number; above: boolean } | null>(null);
	const [decorating, setDecorating] = useState<{
		passage: Passage;
		origin: { x: number; y: number };
	} | null>(null);

	// Measure columns after every layout change, then land on the pending position.
	// biome-ignore lint/correctness/useExhaustiveDependencies: re-measure when the text, its traces or the type settings change.
	useLayoutEffect(() => {
		const cols = colsRef.current;
		if (!cols || !columnWidth || !chapter.data || chapter.data.ch !== ch) return;
		const count = Math.max(1, Math.round((cols.scrollWidth + GAP) / step));
		const want = pending.current ?? {
			kind: "ratio" as const,
			ratio: position.current.pages > 1 ? position.current.page / position.current.pages : 0,
		};
		let next = position.current.page;
		if (want.kind === "end") next = count - 1;
		else if (want.kind === "ratio") next = Math.round(want.ratio * count);
		else {
			const span = findSpan(cols, want.p, want.s);
			if (span) {
				const left =
					(span.getClientRects()[0] ?? span.getBoundingClientRect()).left -
					cols.getBoundingClientRect().left;
				next = Math.floor((left + 2) / step);
				const text = chapter.data.paragraphs[want.p] ?? "";
				setSelection({
					p: want.p,
					s: want.s,
					e: Math.min(want.e, text.length),
					quote: text.slice(want.s, want.e),
				});
			}
		}
		pending.current = null;
		setPages(count);
		setAnimate(false);
		setPage(Math.min(count - 1, Math.max(0, next)));
		setAnchors(
			measureAnchors(
				cols,
				filters.draw ? chapterTraces.filter((trace) => trace.kind === "draw") : [],
			),
		);
	}, [
		chapter.data,
		ch,
		columnWidth,
		size.height,
		settings.size,
		settings.leading,
		settings.font,
		chapterTraces,
		visible,
		filters.draw,
		fontsReady,
	]);

	const clearSelection = useCallback(() => {
		setSelection(null);
		setEmojiOpen(false);
	}, []);
	const goPage = useCallback(
		(next: number) => {
			if (ch === null || loading) return;
			clearSelection();
			if (next < 0) {
				if (ch > 0) {
					pending.current = { kind: "end" };
					setCh(ch - 1);
				}
				return;
			}
			if (next >= pages) {
				if (ch + 1 < chapterCount) {
					pending.current = { kind: "ratio", ratio: 0 };
					setCh(ch + 1);
				}
				return;
			}
			setAnimate(true);
			setPage(next);
		},
		[ch, pages, chapterCount, clearSelection, loading],
	);

	// Keyboard ←/→.
	useEffect(() => {
		if (!isActive || decorating) return;
		const onKey = (event: KeyboardEvent) => {
			const target = event.target;
			if ((target instanceof Element && target.closest("input,textarea")) || overlay.current)
				return;
			if (event.key === "ArrowRight") goPage(page + 1);
			if (event.key === "ArrowLeft") goPage(page - 1);
			if (event.key === "Escape") clearSelection();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [isActive, decorating, overlay.current, goPage, page, clearSelection]);

	// ---- progress -----------------------------------------------------------------------------
	const chapterChars = detail.data?.chapters.map((entry) => entry.chars) ?? [];
	const pct = ch === null ? 0 : bookPercent(chapterChars, ch, page, pages);
	useReadingProgress({
		bookId,
		ch,
		page,
		pages,
		pct,
		ready: isActive && !!chapter.data && chapter.data.ch === ch,
	});

	// ---- selection ----------------------------------------------------------------------------
	const paragraphs = chapter.data?.paragraphs ?? [];
	const select = useCallback(
		(p: number, s: number, e: number) => {
			const text = paragraphs[p] ?? "";
			setEmojiOpen(false);
			setSelection({ p, s, e, quote: text.slice(s, e) });
		},
		[paragraphs],
	);
	// Toolbar under the selection, or above when it would run off the bottom.
	// biome-ignore lint/correctness/useExhaustiveDependencies: re-place after the page moves or the emoji row opens.
	useLayoutEffect(() => {
		const main = mainRef.current;
		if (!selection || !main) return setToolbarTop(null);
		const box = main.getBoundingClientRect();
		let top = Number.POSITIVE_INFINITY;
		let bottom = Number.NEGATIVE_INFINITY;
		for (const span of main.querySelectorAll("[data-selected]"))
			for (const rect of span.getClientRects()) {
				if (rect.right < box.left || rect.left > box.right) continue;
				top = Math.min(top, rect.top - box.top);
				bottom = Math.max(bottom, rect.bottom - box.top);
			}
		if (!Number.isFinite(top)) return setToolbarTop(null);
		const height = 60 + (emojiOpen ? 60 : 0);
		const below = bottom + 10;
		if (below + height <= box.height - 8) setToolbarTop({ top: below, above: false });
		else
			setToolbarTop({
				top: Math.max(8, Math.min(box.height - height - 8, top - height - 10)),
				above: true,
			});
	}, [selection, page, pages, emojiOpen, size]);

	const pointer = useRef<{ x: number; y: number } | null>(null);
	const fromNativeSelection = () => {
		const native = window.getSelection();
		if (!native || native.isCollapsed || !native.rangeCount || !native.toString().trim())
			return false;
		const range = native.getRangeAt(0);
		const at = (node: Node, offset: number) => {
			const element = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element);
			const span = element?.closest<HTMLElement>("[data-sentence]");
			if (!span) return null;
			return {
				p: Number(span.dataset.p),
				i: Number(span.dataset.s) + (node.nodeType === Node.TEXT_NODE ? offset : 0),
			};
		};
		const start = at(range.startContainer, range.startOffset);
		const end = at(range.endContainer, range.endOffset);
		native.removeAllRanges();
		if (!start) return true;
		const text = paragraphs[start.p] ?? "";
		let e = end && end.p === start.p ? end.i : text.length;
		let s = start.i;
		while (s < e && /\s/.test(text[s] ?? "")) s += 1;
		while (e > s && /\s/.test(text[e - 1] ?? "")) e -= 1;
		if (e > s) select(start.p, s, e);
		return true;
	};
	const onPointerUp = (event: React.PointerEvent) => {
		const down = pointer.current;
		pointer.current = null;
		if (!down || decorating) return;
		if (fromNativeSelection()) return;
		const dx = event.clientX - down.x;
		const dy = event.clientY - down.y;
		if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3)
			return goPage(page + (dx < 0 ? 1 : -1));
		if (Math.abs(dx) > 8 || Math.abs(dy) > 8) return;
		const target = event.target as HTMLElement;
		if (target.closest("[data-marker]")) return;
		// Notes, tape and stickers sit above the text without catching taps; hit-test them here.
		const drawing = drawingAt(colsRef.current, event.clientX, event.clientY);
		const drawn = drawing && chapterTraces.find((trace) => trace.id === drawing);
		if (drawn) return openThread([drawn]);
		const span = target.closest<HTMLElement>("[data-sentence]");
		if (!span) return clearSelection();
		const p = Number(span.dataset.p);
		const s = Number(span.dataset.s);
		if (selection && selection.p === p && s >= selection.s && s < selection.e)
			return clearSelection();
		const sentence = sentenceRange(span, paragraphs[p] ?? "");
		select(p, sentence[0], sentence[1]);
	};
	// Long-press selections on touch screens settle after the finger lifts.
	const settleNative = useDebounceCallback(() => {
		const native = window.getSelection();
		if (native && !native.isCollapsed && pagesRef.current?.contains(native.anchorNode))
			fromNativeSelection();
	}, 700);
	useEffect(() => {
		document.addEventListener("selectionchange", settleNative);
		return () => document.removeEventListener("selectionchange", settleNative);
	}, [settleNative]);

	// ---- actions ------------------------------------------------------------------------------
	const create = useMutation(orpc.traces.create.mutationOptions());
	const remove = useMutation(orpc.traces.remove.mutationOptions());
	const myUnderline = selection
		? chapterTraces.find(
				(trace) =>
					trace.kind === "underline" &&
					trace.isMine &&
					trace.p === selection.p &&
					trace.s === selection.s &&
					trace.e === selection.e,
			)
		: undefined;
	const selectionTraces = selection
		? overlapping(chapterTraces, ch ?? 0, selection.p, selection.s, selection.e)
		: [];
	const openThread = useCallback(
		(list: Trace[]) => {
			const first = list[0];
			if (!first) return;
			const s = Math.min(...list.map((trace) => trace.s));
			const e = Math.max(...list.map((trace) => trace.e));
			useReaderStore.setState({
				thread: { passage: { p: first.p, s, e, quote: first.quote } },
				replyTo: null,
				draft: "",
			});
			clearSelection();
			overlay.open("thread");
		},
		[overlay, clearSelection],
	);
	const anchorOf = (passage: Passage) => ({
		libraryId,
		bookId,
		ch: ch ?? 0,
		...passage,
		quote: passage.quote.slice(0, 2000),
	});
	const onAction = (action: ToolbarAction) => {
		if (!selection) return;
		const passage = selection;
		if (action === "traces") return openThread(selectionTraces);
		if (action === "react") return setEmojiOpen(!emojiOpen);
		if (action === "underline" && myUnderline) {
			if (myUnderline.id.startsWith("optimistic:")) return;
			clearSelection();
			remove.mutate({ traceId: myUnderline.id });
			return;
		}
		gate(({ open, close }) => {
			if (action === "underline") {
				close();
				clearSelection();
				settings.show("underline");
				create.mutate({ ...anchorOf(passage), kind: "underline" });
			} else if (action === "memo") {
				useReaderStore.setState({ memo: { passage } });
				open("memo");
			} else if (action === "question") {
				setQuestionPassage(passage);
				open("question");
			} else if (action === "decorate") {
				close();
				startDecorating(passage);
			}
		});
	};
	const onEmoji = (emoji: (typeof reactionEmojis)[number]) => {
		if (!selection) return;
		const passage = selection;
		gate(({ close }) => {
			close();
			clearSelection();
			settings.show("react");
			create.mutate({ ...anchorOf(passage), kind: "react", emoji });
		});
	};
	const [questionPassage, setQuestionPassage] = useState<Passage | null>(null);
	const startDecorating = (passage: Passage) => {
		const cols = colsRef.current;
		const main = mainRef.current;
		const anchor = cols && measureAnchor(cols, passage.p, passage.s);
		if (!cols || !main || !anchor) return notify("이 쪽에서 구절을 찾지 못했어요");
		settings.show("draw");
		const colsBox = cols.getBoundingClientRect();
		const mainBox = main.getBoundingClientRect();
		setSelection(null);
		setDecorating({
			passage,
			origin: {
				x: colsBox.left - mainBox.left + anchor.x,
				y: colsBox.top - mainBox.top + anchor.y,
			},
		});
	};
	const finishDecorating = (data: Drawing) => {
		if (!decorating) return;
		const { passage } = decorating;
		setDecorating(null);
		create.mutate({ ...anchorOf(passage), kind: "draw", data });
	};
	const leaveTrace = useCallback(
		(passage: Passage) => {
			setTimeout(() => select(passage.p, passage.s, passage.e), 120);
		},
		[select],
	);
	const quoteOf = useCallback(
		(passage: Passage) => (paragraphs[passage.p] ?? passage.quote).slice(passage.s, passage.e),
		[paragraphs],
	);

	// ---- render -------------------------------------------------------------------------------
	const book = detail.data?.book;
	const chapterInfo = detail.data?.chapters.find((entry) => entry.ch === ch);
	const takenColors = (library?.members ?? [])
		.filter((member) => member.id !== profile.data?.id && member.color)
		.map((member) => member.color as string);
	return (
		<AppScreen>
			<header className="flex h-[calc(3.5rem+env(safe-area-inset-top))] shrink-0 items-center gap-1 border-b border-rule bg-card px-2 pt-[env(safe-area-inset-top)]">
				<AppBarIconButton
					className="size-11"
					aria-label="이전 화면으로"
					onClick={() => (isRoot ? flow.replace("BookPage", { bookId }) : flow.pop())}
				>
					<ChevronLeftIcon />
				</AppBarIconButton>
				<div className="min-w-0 flex-1 px-1">
					<h1 className="truncate text-t5 leading-[22px] font-bold">{book?.title ?? ""}</h1>
					<p className="truncate text-st10 leading-4 text-muted-foreground">{library?.name}</p>
				</div>
				<AppBarIconButton
					className="size-11"
					aria-label="흔적 종류"
					onClick={() => overlay.open("filter")}
				>
					<FilterIcon />
				</AppBarIconButton>
				<AppBarIconButton
					className="size-11"
					aria-label="글자 설정"
					onClick={() => overlay.open("font")}
				>
					<ALargeSmallIcon />
				</AppBarIconButton>
			</header>
			<main ref={mainRef} className="relative min-h-0 flex-1 overflow-hidden bg-paper">
				<div
					ref={pagesRef}
					className="absolute inset-0 touch-pan-y overflow-hidden"
					style={{ paddingInline: GUTTER }}
					onPointerDown={(event) => {
						pointer.current = { x: event.clientX, y: event.clientY };
					}}
					onPointerUp={onPointerUp}
					onScroll={(event) => {
						// Focus or find-in-page can scroll the clipped columns; keep pages aligned.
						event.currentTarget.scrollLeft = 0;
					}}
				>
					{chapter.data && chapter.data.ch === ch && columnWidth > 0 && (
						<div
							ref={colsRef}
							className={cn(
								"reader-text relative isolate",
								settings.font === "sans" ? "font-sans" : "font-serif",
							)}
							style={
								{
									width: columnWidth,
									height: size.height,
									columnWidth,
									columnGap: GAP,
									columnFill: "auto",
									transform: `translateX(${-page * step}px)`,
									transition: animate ? "transform 280ms cubic-bezier(.2,.7,.2,1)" : "none",
									"--reader-size": `${settings.size}px`,
									"--reader-leading": settings.leading,
								} as React.CSSProperties
							}
						>
							<ChapterText
								ch={chapter.data.ch}
								title={chapter.data.title}
								paragraphs={chapter.data.paragraphs}
								traces={chapterTraces}
								visible={visible}
								selection={selection}
								onMarker={openThread}
							/>
							{filters.draw && (
								<>
									<div className="pointer-events-none absolute top-0 left-0 -z-10">
										{anchors.map(({ trace, x, y }) =>
											trace.data ? (
												<DrawingView
													key={trace.id}
													data={trace.data}
													fs={settings.size}
													x={x}
													y={y}
													part="under"
												/>
											) : null,
										)}
									</div>
									<div className="pointer-events-none absolute top-0 left-0 z-10">
										{anchors.map(({ trace, x, y }) =>
											trace.data ? (
												<div key={trace.id} data-drawing={trace.id}>
													<DrawingView
														data={trace.data}
														fs={settings.size}
														x={x}
														y={y}
														part="over"
													/>
												</div>
											) : null,
										)}
									</div>
								</>
							)}
						</div>
					)}
				</div>
				{loading && failedRequest && (
					<div className="absolute inset-0 grid place-items-center bg-paper">
						<LoadState
							pending={failedRequest.isFetching}
							error
							retry={() => failedRequest.refetch()}
						/>
					</div>
				)}
				{loading && !failedRequest && (
					<div className="absolute inset-0 bg-paper px-5 pt-6">
						<LoadingSkeleton shape="article" />
					</div>
				)}
				{selection && toolbarTop && !decorating && (
					<SelectionToolbar
						top={toolbarTop.top}
						underlined={!!myUnderline}
						traceCount={selectionTraces.length}
						emojiOpen={emojiOpen}
						emojiAbove={toolbarTop.above}
						onAction={onAction}
						onEmoji={onEmoji}
					/>
				)}
				{decorating && (
					<DecorateMode
						origin={decorating.origin}
						fs={settings.size}
						onCancel={() => setDecorating(null)}
						onDone={finishDecorating}
					/>
				)}
			</main>
			<footer className="h-[calc(76px+env(safe-area-inset-bottom))] shrink-0 border-t border-rule bg-card px-3 pt-3 pb-[env(safe-area-inset-bottom)]">
				<ProgressBar value={loading ? 0 : pct} className="mx-3" />
				<div className="mt-1 flex items-center justify-between">
					<AppBarIconButton
						className="size-11"
						aria-label="이전 쪽"
						disabled={loading || (ch === 0 && page === 0)}
						onClick={() => goPage(page - 1)}
					>
						<ChevronLeftIcon />
					</AppBarIconButton>
					<p
						className="min-w-0 truncate px-2 text-t7 text-muted-foreground tabular-nums"
						aria-live="polite"
					>
						{ch !== null && chapterInfo && !loading
							? `${chapterLabel(ch, chapterInfo.title)} · ${page + 1}/${pages} · ${pct}%`
							: ""}
					</p>
					<AppBarIconButton
						className="size-11"
						aria-label="다음 쪽"
						disabled={loading || (ch === chapterCount - 1 && page === pages - 1)}
						onClick={() => goPage(page + 1)}
					>
						<ChevronRightIcon />
					</AppBarIconButton>
				</div>
			</footer>
			{libraryId && ch !== null && (
				<>
					<MemoSheet
						libraryId={libraryId}
						bookId={bookId}
						ch={ch}
						onSaved={() => {
							clearSelection();
							settings.show("memo");
						}}
					/>
					<QuestionSheet
						libraryId={libraryId}
						bookId={bookId}
						ch={ch}
						passage={questionPassage}
						onSkip={clearSelection}
						onAnswered={() => {
							clearSelection();
							settings.show("memo");
						}}
					/>
					<SameQuestionSheet traces={allTraces} />
					<TraceSheet
						ch={ch}
						traces={allTraces}
						quoteOf={quoteOf}
						gate={gate}
						onLeaveTrace={leaveTrace}
					/>
				</>
			)}
			<FilterSheet {...overlay.bind("filter")} />
			<FontSheet {...overlay.bind("font")} />
			<ProfileSheet takenColors={takenColors} />
		</AppScreen>
	);
}

function findSpan(cols: HTMLElement, p: number, s: number) {
	return [...cols.querySelectorAll<HTMLElement>(`[data-sentence][data-p="${p}"]`)].find(
		(span) => Number(span.dataset.s) <= s && Number(span.dataset.e) > s,
	);
}

/** Position of character `s` of paragraph `p`, relative to the columns box. */
function measureAnchor(cols: HTMLElement, p: number, s: number) {
	const span = findSpan(cols, p, s);
	if (!span) return null;
	const box = cols.getBoundingClientRect();
	const first = span.getClientRects()[0] ?? span.getBoundingClientRect();
	let x = first.left - box.left;
	const offset = s - Number(span.dataset.s);
	const node = span.firstChild;
	if (offset > 0 && node) {
		const range = document.createRange();
		range.setStart(node, offset);
		range.setEnd(node, offset);
		const rect = range.getClientRects()[0] ?? range.getBoundingClientRect();
		x = rect.left - box.left;
		return { x, y: rect.top - box.top };
	}
	return { x, y: first.top - box.top };
}

function measureAnchors(cols: HTMLElement, list: Trace[]): Anchor[] {
	return list.flatMap((trace) => {
		const anchor = measureAnchor(cols, trace.p, trace.s);
		return anchor ? [{ trace, ...anchor }] : [];
	});
}

/** The sentence a tapped piece belongs to. */
function sentenceRange(span: HTMLElement, text: string): [number, number] {
	const sentence = Number(span.dataset.sentence);
	const s = Number(span.dataset.s);
	const e = Number(span.dataset.e);
	if (sentence < 0) return [s, e];
	const pieces = [
		...(span.closest("p")?.querySelectorAll<HTMLElement>(`[data-sentence="${sentence}"]`) ?? []),
	];
	const start = Math.min(s, ...pieces.map((piece) => Number(piece.dataset.s)));
	const end = Math.max(e, ...pieces.map((piece) => Number(piece.dataset.e)));
	return [start, Math.min(end, text.length)];
}

/** The drawing trace whose note, tape or sticker is under the point, if any. */
function drawingAt(cols: HTMLElement | null, x: number, y: number) {
	if (!cols) return undefined;
	for (const item of cols.querySelectorAll<HTMLElement>("[data-drawing] [data-hit]")) {
		const rect = item.getBoundingClientRect();
		if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom)
			return item.closest<HTMLElement>("[data-drawing]")?.dataset.drawing;
	}
	return undefined;
}
