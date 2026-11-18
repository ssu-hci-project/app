import type { Trace } from "@app/contract";
import type { InferActivityParams } from "@stackflow/config";
import { useActivity, useFlow, useStepFlow } from "@stackflow/react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import { bookByline, chapterLabel } from "@/entities/book";
import { useCurrentLibrary } from "@/entities/library";
import { personColor, personName } from "@/entities/profile";
import { orpc } from "@/shared/api";
import { dayjs } from "@/shared/lib";
import { Button, CheckboxRow, ListHeader, LoadState, MobileScreen, Segmented } from "@/shared/ui";

type Scope = "mine" | "all" | "none";
type Chapter = { ch: number; title: string; paragraphs: string[] };

const scopes: { value: Scope; label: string }[] = [
	{ value: "mine", label: "내 흔적" },
	{ value: "all", label: "모두의 흔적" },
	{ value: "none", label: "넣지 않기" },
];

export function ExportPage({ params }: { params: InferActivityParams<"ExportPage"> }) {
	const flow = useFlow();
	const { isActive } = useActivity();
	const { replaceStep } = useStepFlow("ExportPage");
	const { library } = useCurrentLibrary();
	const libraryId = library?.id ?? "";
	const scope: Scope = params.scope === "all" || params.scope === "none" ? params.scope : "mine";
	const withText = params.text !== "0";
	const input = { libraryId, bookId: params.bookId };
	const detail = useQuery({ ...orpc.books.get.queryOptions({ input }), enabled: !!library });
	const traces = useQuery({ ...orpc.traces.list.queryOptions({ input }), enabled: !!library });
	const chapterList = detail.data?.chapters ?? [];
	const chapters = useQueries({
		queries: chapterList.map((chapter) => ({
			...orpc.books.chapter.queryOptions({ input: { ...input, ch: chapter.ch } }),
			enabled: !!library && withText,
		})),
	});
	const book = detail.data?.book;
	const included = (traces.data ?? []).filter(
		(trace) => scope !== "none" && (scope === "all" || trace.isMine),
	);
	const textReady = !withText || chapters.every((query) => query.data);
	const ready = !!book && !!traces.data && textReady;
	const empty = !withText && (scope === "none" || included.length === 0);
	const update = (next: { scope?: Scope; text?: boolean }) =>
		replaceStep({
			...params,
			scope: next.scope ?? scope,
			text: (next.text ?? withText) ? undefined : "0",
		});
	const preview = ready && (
		<ExportDocument
			title={book.title}
			byline={bookByline(book)}
			chapters={
				withText
					? chapters.map((query) => query.data as Chapter)
					: chapterList.map((chapter) => ({ ...chapter, paragraphs: [] }))
			}
			traces={included}
			withText={withText}
		/>
	);
	return (
		<MobileScreen
			title="PDF로 내보내기"
			onBack={() => flow.pop()}
			cta={
				<Button
					size="lg"
					className="flex-1"
					disabled={!ready || empty}
					onClick={() => window.print()}
				>
					PDF로 저장
				</Button>
			}
		>
			<section className="flex flex-col gap-2 px-2">
				<CheckboxRow
					checked={withText}
					onCheckedChange={(checked) => update({ text: checked })}
					title="본문 포함"
					description="끄면 흔적만 장 순서대로 모아요"
				/>
				<ListHeader className="px-0 pt-3 pb-1">흔적</ListHeader>
				<Segmented
					label="담을 흔적"
					value={scope}
					options={scopes}
					onValueChange={(value) => update({ scope: value })}
				/>
				<p className="pt-2 text-t7 text-sub">
					저장 화면에서 ‘PDF로 저장’을 고르세요. 밑줄과 메모·질문이 들어가요.
				</p>
			</section>
			<section className="flex flex-col px-2">
				<ListHeader className="px-0 pt-0 pb-3">미리보기</ListHeader>
				<LoadState
					pending={!ready && !detail.isError && !traces.isError}
					error={detail.isError || traces.isError || chapters.some((query) => query.isError)}
					retry={() => {
						detail.refetch();
						traces.refetch();
						for (const query of chapters) if (query.isError) query.refetch();
					}}
					shape="article"
				/>
				{empty && ready && <p className="py-6 text-center text-t6 text-sub">담을 흔적이 없어요</p>}
				{!empty && preview && (
					<div className="rounded-2xl bg-paper p-5 text-reader-ink">{preview}</div>
				)}
			</section>
			{isActive &&
				!empty &&
				preview &&
				createPortal(<div className="print-root">{preview}</div>, document.body)}
		</MobileScreen>
	);
}

function ExportDocument({
	title,
	byline,
	chapters,
	traces,
	withText,
}: {
	title: string;
	byline: string;
	chapters: Chapter[];
	traces: Trace[];
	withText: boolean;
}) {
	const notes = traces.filter((trace) => trace.kind === "memo" || trace.kind === "qa");
	const lines = traces.filter((trace) => trace.kind === "underline");
	const replies = traces.filter((trace) => trace.kind === "reply");
	return (
		<article className="font-serif break-keep">
			<header className="mb-8 border-b border-rule pb-6">
				<h1 className="text-st2 leading-[1.3] font-semibold">{title}</h1>
				<p className="mt-2 font-sans text-t6 text-sub">{byline}</p>
				<p className="mt-1 font-sans text-t7 text-sub">{dayjs().format("YYYY년 M월 D일")} 내보냄</p>
			</header>
			{chapters.map((chapter) => {
				const chapterNotes = notes.filter((trace) => trace.ch === chapter.ch);
				const chapterLines = lines.filter((trace) => trace.ch === chapter.ch);
				if (!withText && !chapterNotes.length && !chapterLines.length) return null;
				return (
					<section key={chapter.ch} className="export-chapter mb-10">
						<h2 className="mb-4 text-t3 leading-[1.35] font-semibold">
							{chapterLabel(chapter.ch, chapter.title)}
						</h2>
						{withText
							? chapter.paragraphs.map((text, p) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: paragraphs are fixed text in order.
									<div key={p} className="mb-4">
										<p className="text-st8 leading-[1.85]">
											<Underlined
												text={text}
												lines={chapterLines.filter((trace) => trace.p === p)}
											/>
										</p>
										{chapterNotes
											.filter((trace) => trace.p === p)
											.map((trace) => (
												<Note key={trace.id} trace={trace} replies={replies} />
											))}
									</div>
								))
							: [...chapterLines, ...chapterNotes]
									.sort((a, b) => a.p - b.p || a.s - b.s)
									.map((trace) => (
										<div key={trace.id} className="mb-4">
											<p className="text-st8 leading-[1.7]">“{trace.quote}”</p>
											{trace.kind === "underline" ? (
												<p className="mt-1 font-sans text-t7 text-sub">
													{personName(trace.author, trace.isMine)}의 밑줄
												</p>
											) : (
												<Note trace={trace} replies={replies} />
											)}
										</div>
									))}
					</section>
				);
			})}
		</article>
	);
}

function Underlined({ text, lines }: { text: string; lines: Trace[] }) {
	if (!lines.length) return <>{text}</>;
	const cuts = [...new Set([0, text.length, ...lines.flatMap((trace) => [trace.s, trace.e])])]
		.filter((cut) => cut >= 0 && cut <= text.length)
		.sort((a, b) => a - b);
	return (
		<>
			{cuts.slice(0, -1).map((s, index) => {
				const e = cuts[index + 1] ?? text.length;
				const mark = lines
					.filter((trace) => trace.s <= s && trace.e >= e)
					.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
				const piece = text.slice(s, e);
				return mark ? (
					<span
						key={s}
						className="underline decoration-2 underline-offset-4"
						style={{ textDecorationColor: personColor(mark.author) }}
					>
						{piece}
					</span>
				) : (
					piece
				);
			})}
		</>
	);
}

function Note({ trace, replies }: { trace: Trace; replies: Trace[] }) {
	const color = personColor(trace.author);
	return (
		<div className="export-note mt-2 border-l-2 pl-3 font-sans" style={{ borderColor: color }}>
			<p className="text-t7 font-semibold" style={{ color }}>
				{personName(trace.author, trace.isMine)} · {trace.kind === "qa" ? "질문" : "메모"}
			</p>
			{trace.q && <p className="mt-0.5 text-t6 font-semibold">Q. {trace.q}</p>}
			{trace.text && (
				<p className="mt-0.5 text-t6 leading-[1.6] whitespace-pre-wrap">{trace.text}</p>
			)}
			{replies
				.filter((reply) => reply.parentId === trace.id)
				.map((reply) => (
					<p key={reply.id} className="mt-1 pl-3 text-t7 leading-[1.6] text-sub">
						↳ {personName(reply.author, reply.isMine)}: {reply.text}
					</p>
				))}
		</div>
	);
}
