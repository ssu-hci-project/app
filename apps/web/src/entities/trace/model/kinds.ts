import type { Trace, TraceKind } from "@app/contract";

export const kindLabel: Record<TraceKind, string> = {
	underline: "밑줄",
	memo: "메모",
	qa: "질문",
	react: "반응",
	draw: "꾸미기",
	reply: "답글",
};

/** Traces that open the trace sheet (underlines have no card of their own). */
export const hasCard = (trace: Trace) => trace.kind !== "underline" && trace.kind !== "reply";

/** Traces on the same paragraph whose ranges overlap [s, e). */
export function overlapping(list: Trace[], ch: number, p: number, s: number, e: number) {
	return list.filter(
		(trace) => trace.ch === ch && trace.p === p && hasCard(trace) && trace.s < e && trace.e > s,
	);
}
