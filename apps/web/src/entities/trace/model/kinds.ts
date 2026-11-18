import type { Trace } from "@app/contract";

/** Traces that open the trace sheet (underlines have no card of their own). */
const hasCard = (trace: Trace) => trace.kind !== "underline" && trace.kind !== "reply";

/** Traces on the same paragraph whose ranges overlap [s, e). */
export function overlapping(list: Trace[], ch: number, p: number, s: number, e: number) {
	return list.filter(
		(trace) => trace.ch === ch && trace.p === p && hasCard(trace) && trace.s < e && trace.e > s,
	);
}
