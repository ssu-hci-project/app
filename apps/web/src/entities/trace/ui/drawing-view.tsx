import type { Drawing } from "@app/contract";
import { useEffect } from "react";
import { decorationStyle, loadHandwriting, strokeGeometry } from "../lib/drawing";

/**
 * Renders a saved drawing with its origin (the passage's first letter) at (x, y).
 * `part` splits highlighter strokes, which sit under the text, from everything drawn on top.
 */
export function DrawingView({
	data,
	fs,
	x,
	y,
	part,
}: {
	data: Drawing;
	fs: number;
	x: number;
	y: number;
	part: "under" | "over";
}) {
	const strokes = data.strokes.filter((stroke) => !!stroke.hl === (part === "under"));
	const items = part === "over" ? data.items : [];
	const hasNote = items.some((item) => item.t === "note");
	useEffect(() => {
		if (hasNote) loadHandwriting();
	}, [hasNote]);
	const geometry = strokes.length ? strokeGeometry(strokes, fs) : null;
	return (
		<div className="pointer-events-none absolute size-0" style={{ left: x, top: y }}>
			{items
				.filter((item) => item.t === "tape")
				.map((item, index) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: decorations have no id and never reorder.
					<div key={index} data-hit className="absolute" style={decorationStyle(item, fs)} />
				))}
			{geometry && (
				<svg
					aria-hidden="true"
					className="absolute overflow-visible"
					style={{ left: geometry.x, top: geometry.y }}
					width={geometry.width}
					height={geometry.height}
				>
					{geometry.paths.map((path, index) => (
						<path
							// biome-ignore lint/suspicious/noArrayIndexKey: strokes have no id and never reorder.
							key={index}
							d={path.d}
							fill="none"
							stroke={path.color}
							strokeWidth={path.width}
							strokeLinecap="round"
							strokeLinejoin="round"
							opacity={path.highlight ? 0.75 : 1}
							style={path.highlight ? { mixBlendMode: "multiply" } : undefined}
						/>
					))}
				</svg>
			)}
			{items.map((item, index) =>
				item.t === "note" ? (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: decorations have no id and never reorder.
						key={index}
						data-hit
						className="absolute rounded-xs px-[0.6em] pt-[0.45em] pb-[0.55em] font-hand leading-tight whitespace-pre-wrap text-note-ink shadow-[1px_3px_8px_rgb(0_0_0/0.16)] break-keep"
						style={decorationStyle(item, fs)}
					>
						{item.text}
					</div>
				) : item.t === "stk" ? (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: decorations have no id and never reorder.
						key={index}
						data-hit
						className="absolute drop-shadow-[0_2px_3px_rgb(0_0_0/0.25)] select-none"
						style={decorationStyle(item, fs)}
					>
						{item.s}
					</div>
				) : null,
			)}
		</div>
	);
}

/** A compact look at a drawing for a trace card. */
export function DrawingPreview({ data }: { data: Drawing }) {
	const geometry = data.strokes.length ? strokeGeometry(data.strokes, 14) : null;
	const notes = data.items.filter((item) => item.t === "note");
	const tapeItems = data.items.filter((item) => item.t === "tape");
	const stickerItems = data.items.filter((item) => item.t === "stk");
	useEffect(() => {
		if (notes.length) loadHandwriting();
	}, [notes.length]);
	return (
		<div className="flex flex-col items-start gap-2 overflow-hidden rounded-xl bg-paper p-3">
			{geometry && (
				<svg
					aria-hidden="true"
					width={Math.min(260, geometry.width)}
					height={Math.min(110, geometry.height)}
					viewBox={`0 0 ${geometry.width.toFixed(0)} ${geometry.height.toFixed(0)}`}
				>
					{geometry.paths.map((path, index) => (
						<path
							// biome-ignore lint/suspicious/noArrayIndexKey: strokes have no id and never reorder.
							key={index}
							d={path.d}
							fill="none"
							stroke={path.color}
							strokeWidth={path.width}
							strokeLinecap="round"
							strokeLinejoin="round"
							opacity={path.highlight ? 0.75 : 1}
						/>
					))}
				</svg>
			)}
			{notes.map((note, index) =>
				note.t === "note" ? (
					<p
						// biome-ignore lint/suspicious/noArrayIndexKey: decorations have no id and never reorder.
						key={index}
						className="max-w-full -rotate-1 px-2.5 py-1.5 font-hand text-st7 leading-tight text-note-ink shadow-[1px_2px_5px_rgb(0_0_0/0.12)]"
						style={{ background: note.c }}
					>
						{note.text}
					</p>
				) : null,
			)}
			{(tapeItems.length > 0 || stickerItems.length > 0) && (
				<div className="flex flex-wrap items-center gap-2">
					{tapeItems.map((item, index) => (
						<span
							// biome-ignore lint/suspicious/noArrayIndexKey: decorations have no id and never reorder.
							key={index}
							className="inline-block h-4 w-13"
							style={{
								background: item.t === "tape" ? decorationStyle(item, 14).background : undefined,
							}}
						/>
					))}
					{stickerItems.map((item, index) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: decorations have no id and never reorder.
						<span key={index} className="text-st3">
							{item.t === "stk" ? item.s : null}
						</span>
					))}
				</div>
			)}
		</div>
	);
}
