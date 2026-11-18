import type { Trace } from "@app/contract";
import { memo, useMemo } from "react";
import { chapterNumber } from "@/entities/book";
import { personColor } from "@/entities/profile";
import { cn } from "@/shared/lib";
import { MessageSquareTextIcon, ReactionEmoji } from "@/shared/ui";
import { buildSegments, markStyle, type Visible } from "../lib/segments";

const emptyTraces: Trace[] = [];

type Selection = { p: number; s: number; e: number } | null;

/**
 * One chapter's text: a sentence span per piece (tap = select), the underline band, and
 * markers at the end of memo/질문 and reaction passages.
 */
export const ChapterText = memo(function ChapterText({
	ch,
	title,
	paragraphs,
	traces,
	visible,
	selection,
	onMarker,
}: {
	ch: number;
	title: string;
	paragraphs: string[];
	traces: Trace[];
	visible: Visible;
	selection: Selection;
	onMarker: (traces: Trace[]) => void;
}) {
	const tracesByParagraph = useMemo(() => {
		const grouped = new Map<number, Trace[]>();
		for (const trace of traces) {
			const group = grouped.get(trace.p);
			if (group) group.push(trace);
			else grouped.set(trace.p, [trace]);
		}
		return grouped;
	}, [traces]);
	return (
		<>
			<header className="break-inside-avoid pt-6">
				<p className="font-sans text-st10 font-bold tracking-wide text-brand">
					{chapterNumber(ch)}
				</p>
				<h1 className="mt-5 mb-[26px] border-b border-rule pb-[22px] font-serif text-t1 leading-[1.25] font-medium tracking-tight break-keep text-reader-ink">
					{title || chapterNumber(ch)}
				</h1>
			</header>
			{paragraphs.map((text, p) => (
				<Paragraph
					// biome-ignore lint/suspicious/noArrayIndexKey: paragraphs are fixed by position.
					key={p}
					p={p}
					text={text}
					traces={tracesByParagraph.get(p) ?? emptyTraces}
					visible={visible}
					selection={selection?.p === p ? selection : undefined}
					onMarker={onMarker}
				/>
			))}
		</>
	);
});

function Paragraph({
	p,
	text,
	traces,
	visible,
	selection,
	onMarker,
}: {
	p: number;
	text: string;
	traces: Trace[];
	visible: Visible;
	selection?: { s: number; e: number };
	onMarker: (traces: Trace[]) => void;
}) {
	const segments = buildSegments({
		text,
		traces,
		visible,
		selection,
		colorOf: (trace) => personColor(trace.author),
	});
	return (
		<p data-p={p}>
			{segments.map((segment) => (
				<span key={segment.s}>
					{/^\s+$/.test(text.slice(segment.s, segment.e)) && !segment.selected ? (
						text.slice(segment.s, segment.e)
					) : (
						<span
							data-sentence={segment.sentence}
							data-p={p}
							data-s={segment.s}
							data-e={segment.e}
							data-selected={segment.selected || undefined}
							className={cn("reader-sentence", segment.selected && "bg-selection")}
							style={markStyle(segment.marks)}
						>
							{text.slice(segment.s, segment.e)}
						</span>
					)}
					{segment.notes.length > 0 && (
						<button
							type="button"
							data-marker
							aria-label={`메모와 질문 ${segment.notes.length}개 보기`}
							onClick={() => onMarker(segment.notes)}
							className="relative mx-1 inline-flex h-6 items-center gap-0.5 align-middle font-sans text-st10 font-semibold text-muted-foreground before:absolute before:-inset-2.5 before:content-['']"
							style={{ color: personColor(segment.notes.at(-1)?.author) }}
						>
							<MessageSquareTextIcon className="size-5" aria-hidden="true" />
							{segment.notes.length > 1 && segment.notes.length}
						</button>
					)}
					{segment.reactions.map((group) => (
						<button
							key={group.emoji}
							type="button"
							data-marker
							aria-label={`반응 ${group.emoji} ${group.traces.length}개 보기`}
							onClick={() => onMarker(group.traces)}
							className="relative mx-0.5 inline-flex h-6 items-center gap-0.5 rounded-full bg-card/70 px-1.5 align-middle font-sans text-st10 font-semibold text-muted-foreground before:absolute before:-inset-2.5 before:content-['']"
						>
							<ReactionEmoji emoji={group.emoji} decorative className="size-4" />
							{group.traces.length > 1 && group.traces.length}
						</button>
					))}
				</span>
			))}
		</p>
	);
}
