import type { Decoration, Stroke } from "@app/contract";
import type { CSSProperties } from "react";

/** 펜 5색 + 형광펜 2색. `w` is the stroke width in em, so drawings scale with the text. */
export const pens = [
	{ c: "#23307A", w: 0.09 },
	{ c: "#2B2B28", w: 0.08 },
	{ c: "#A23B3B", w: 0.08 },
	{ c: "#1A7A55", w: 0.08 },
	{ c: "#6D4BC3", w: 0.08 },
	{ c: "#DCE989", w: 0.55, hl: 1 as const },
	{ c: "#FFC9A6", w: 0.55, hl: 1 as const },
];
export const noteColors = ["#FFF1A8", "#CFE4DA", "#FFD6DE", "#D9E7FF", "#FFFFFF"];
export const tapes: Record<string, string> = {
	stripe:
		"repeating-linear-gradient(45deg,rgba(255,160,185,.82) 0 6px,rgba(255,214,224,.82) 6px 12px)",
	dot: "radial-gradient(rgba(255,255,255,.9) 1.6px,transparent 2.2px) 0 0/8px 8px,rgba(132,201,178,.8)",
	grid: "linear-gradient(rgba(255,255,255,.55) 1px,transparent 1px) 0 0/7px 7px,linear-gradient(90deg,rgba(255,255,255,.55) 1px,transparent 1px) 0 0/7px 7px,rgba(140,175,230,.8)",
	kraft: "rgba(218,196,148,.86)",
	lemon:
		"repeating-linear-gradient(90deg,rgba(255,226,120,.85) 0 8px,rgba(255,240,180,.85) 8px 16px)",
};
export const stickers = [
	"🌷",
	"🌼",
	"🍀",
	"⭐",
	"💛",
	"☕",
	"📌",
	"🐱",
	"🌙",
	"✨",
	"🎀",
	"🍓",
	"📖",
	"🐻",
	"💌",
	"🌈",
];
const TAPE_EDGE =
	"polygon(0% 0%,100% 0%,97% 18%,100% 36%,97% 54%,100% 72%,97% 88%,100% 100%,0% 100%,3% 82%,0% 64%,3% 46%,0% 28%,3% 12%)";

/** SVG paths for strokes at `fs` px per em, framed by their own bounding box. */
export function strokeGeometry(strokes: Stroke[], fs: number) {
	let minX = Number.POSITIVE_INFINITY;
	let minY = Number.POSITIVE_INFINITY;
	let maxX = Number.NEGATIVE_INFINITY;
	let maxY = Number.NEGATIVE_INFINITY;
	for (const stroke of strokes)
		for (const [x, y] of stroke.d) {
			minX = Math.min(minX, x);
			minY = Math.min(minY, y);
			maxX = Math.max(maxX, x);
			maxY = Math.max(maxY, y);
		}
	const pad = 1;
	const paths = strokes.map((stroke) => {
		const points = stroke.d.map(([x, y]) => [(x - minX + pad) * fs, (y - minY + pad) * fs]);
		const [first = [0, 0]] = points;
		let d = `M${first[0]?.toFixed(1)} ${first[1]?.toFixed(1)}`;
		for (let index = 1; index < points.length; index += 1) {
			const [px = 0, py = 0] = points[index - 1] ?? [];
			const [qx = 0, qy = 0] = points[index] ?? [];
			d += ` Q${px.toFixed(1)} ${py.toFixed(1)} ${((px + qx) / 2).toFixed(1)} ${((py + qy) / 2).toFixed(1)}`;
		}
		const last = points[points.length - 1] ?? first;
		d += points.length === 1 ? " l0.1 0" : ` L${last[0]?.toFixed(1)} ${last[1]?.toFixed(1)}`;
		return { d, color: stroke.c, width: stroke.w * fs, highlight: !!stroke.hl };
	});
	return {
		paths,
		x: (minX - pad) * fs,
		y: (minY - pad) * fs,
		width: (maxX - minX + 2 * pad) * fs,
		height: (maxY - minY + 2 * pad) * fs,
	};
}

/** Absolute position and look of a 메모지 · 테이프 · 스티커 at `fs` px per em. */
export function decorationStyle(item: Decoration, fs: number): CSSProperties {
	const px = (value: number) => `${(value * fs).toFixed(1)}px`;
	if (item.t === "note")
		return {
			left: px(item.x),
			top: px(item.y),
			width: px(item.w),
			background: item.c,
			transform: `rotate(${item.r}deg)`,
			transformOrigin: "top left",
			fontSize: `${(fs * 1.08).toFixed(1)}px`,
		};
	if (item.t === "tape") {
		const dx = item.x2 - item.x1;
		const dy = item.y2 - item.y1;
		return {
			left: px(item.x1),
			top: px(item.y1),
			width: px(Math.max(0.6, Math.hypot(dx, dy))),
			height: `${(fs * 0.95).toFixed(1)}px`,
			marginTop: `${(-fs * 0.475).toFixed(1)}px`,
			transform: `rotate(${((Math.atan2(dy, dx) * 180) / Math.PI).toFixed(1)}deg)`,
			transformOrigin: "left center",
			background: tapes[item.p] ?? tapes.stripe,
			clipPath: TAPE_EDGE,
			mixBlendMode: "multiply",
		};
	}
	return {
		left: px(item.x),
		top: px(item.y),
		fontSize: `${(fs * item.z).toFixed(1)}px`,
		transform: `translate(-50%,-50%) rotate(${item.r}deg)`,
		lineHeight: 1,
	};
}

let handLoaded = false;
/** The handwriting face is only used on 메모지, so it loads the first time one is shown. */
export function loadHandwriting() {
	if (handLoaded || typeof document === "undefined") return;
	handLoaded = true;
	const link = document.createElement("link");
	link.rel = "stylesheet";
	link.href = "https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap";
	document.head.appendChild(link);
}
