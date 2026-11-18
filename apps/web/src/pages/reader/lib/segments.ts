import type { Trace } from "@app/contract";
import { sentences } from "./sentences";

export type Mark = { color: string; dotted: boolean };
export type Segment = {
	s: number;
	e: number;
	/** Index of the sentence this piece belongs to (tap selects it). */
	sentence: number;
	selected: boolean;
	/** At most three, newest first. */
	marks: Mark[];
	/** Memo/질문 traces that end here; shown as one speech-bubble marker. */
	notes: Trace[];
	/** Reactions that end here, grouped by emoji. */
	reactions: { emoji: string; traces: Trace[] }[];
};
export type Visible = { underline: boolean; memo: boolean; react: boolean };

const MAX_MARKS = 3;

/**
 * Cuts a paragraph at sentence ends, trace ranges and the selection, so each piece has one
 * look. Pure, so the reader can rebuild it on every render.
 */
export function buildSegments({
	text,
	traces,
	visible,
	selection,
	colorOf,
}: {
	text: string;
	traces: Trace[];
	visible: Visible;
	selection?: { s: number; e: number };
	colorOf: (trace: Trace) => string;
}): Segment[] {
	const inside = traces.filter((trace) => trace.s < trace.e && trace.e <= text.length);
	const lined = inside.filter((trace) =>
		trace.kind === "underline"
			? visible.underline
			: (trace.kind === "memo" || trace.kind === "qa") && visible.memo,
	);
	const notes = visible.memo
		? inside.filter((trace) => trace.kind === "memo" || trace.kind === "qa")
		: [];
	const reactions = visible.react ? inside.filter((trace) => trace.kind === "react") : [];
	const ranges = sentences(text);
	const cuts = new Set([0, text.length]);
	for (const [start, end] of ranges) cuts.add(start).add(end);
	for (const trace of [...lined, ...reactions]) cuts.add(trace.s).add(trace.e);
	if (selection) cuts.add(selection.s).add(selection.e);
	const sorted = [...cuts].filter((cut) => cut >= 0 && cut <= text.length).sort((a, b) => a - b);
	const segments: Segment[] = [];
	for (let index = 0; index < sorted.length - 1; index += 1) {
		const s = sorted[index] ?? 0;
		const e = sorted[index + 1] ?? 0;
		if (e <= s) continue;
		const sentence = ranges.findIndex(([start, end]) => s >= start && e <= end);
		const covering = lined
			.filter((trace) => trace.s <= s && trace.e >= e)
			.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
		const marks: Mark[] = [];
		for (const trace of covering) {
			const color = colorOf(trace);
			const dotted = trace.kind !== "underline";
			if (!marks.some((mark) => mark.color === color && mark.dotted === dotted))
				marks.push({ color, dotted });
			if (marks.length === MAX_MARKS) break;
		}
		const endingReactions = reactions.filter((trace) => trace.e === e);
		const grouped = new Map<string, Trace[]>();
		for (const trace of endingReactions)
			grouped.set(trace.emoji ?? "", [...(grouped.get(trace.emoji ?? "") ?? []), trace]);
		segments.push({
			s,
			e,
			sentence,
			selected: !!selection && s >= selection.s && e <= selection.e,
			marks,
			notes: notes.filter((trace) => trace.e === e),
			reactions: [...grouped].map(([emoji, list]) => ({ emoji, traces: list })),
		});
	}
	return segments;
}

/**
 * A fixed 6px band under the text: up to three 2px lines, solid for underlines and dotted for
 * memo/질문. The band never grows, so lines don't move when traces appear.
 */
export function markStyle(marks: Mark[]) {
	if (!marks.length) return undefined;
	const layers = marks.map((mark, index) => {
		const image = mark.dotted
			? `repeating-linear-gradient(90deg, ${mark.color} 0 3px, transparent 3px 6px)`
			: `linear-gradient(${mark.color}, ${mark.color})`;
		return `${image} 0 calc(100% - ${index * 2}px) / 100% 2px no-repeat`;
	});
	return { background: layers.join(", ") };
}
