import { describe, expect, it } from "bun:test";
import type { Trace } from "@app/contract";
import { buildSegments, markStyle } from "./segments";
import { sentences } from "./sentences";

const text = "사람이 돌보지 않는 곳에서도, 계절은 묵묵히 제 일을 했다. 그리고 겨울이 왔다!";
const trace = (overrides: Partial<Trace>): Trace => ({
	id: crypto.randomUUID(),
	libraryId: "l",
	bookId: "b",
	ch: 0,
	p: 0,
	s: 0,
	e: 5,
	quote: "",
	kind: "underline",
	text: null,
	q: null,
	emoji: null,
	data: null,
	parentId: null,
	author: { id: "a", nick: null, color: null },
	isMine: false,
	createdAt: "2026-11-01T00:00:00.000Z",
	reactions: [],
	myReaction: null,
	...overrides,
});
const all = { underline: true, memo: true, react: true };

describe("sentences", () => {
	it("splits at sentence ends and trims spaces", () => {
		expect(sentences(text).map(([s, e]) => text.slice(s, e))).toEqual([
			"사람이 돌보지 않는 곳에서도, 계절은 묵묵히 제 일을 했다.",
			"그리고 겨울이 왔다!",
		]);
		expect(sentences("“그만 거둘까?” 하고 물었다")).toEqual([
			[0, 9],
			[10, 16],
		]);
	});
});

describe("buildSegments", () => {
	it("covers the text without gaps and marks the selection", () => {
		const segments = buildSegments({
			text,
			traces: [],
			visible: all,
			selection: { s: 17, e: 33 },
			colorOf: () => "#000",
		});
		expect(segments.map((segment) => text.slice(segment.s, segment.e)).join("")).toBe(text);
		expect(
			segments
				.filter((segment) => segment.selected)
				.map((segment) => text.slice(segment.s, segment.e))
				.join(""),
		).toBe("계절은 묵묵히 제 일을 했다.");
		expect(segments.find((segment) => segment.s === 0)?.sentence).toBe(0);
	});

	it("keeps three newest marks, dotted for memos, and puts markers where traces end", () => {
		const colors = ["#111111", "#222222", "#333333", "#444444"];
		const traces = colors.map((color, index) =>
			trace({
				s: 0,
				e: 16,
				author: { id: String(index), nick: null, color },
				createdAt: `2026-11-0${index + 1}T00:00:00.000Z`,
			}),
		);
		traces.push(
			trace({ s: 0, e: 16, kind: "memo", text: "생각", createdAt: "2026-11-09T00:00:00.000Z" }),
		);
		traces.push(
			trace({ s: 0, e: 16, kind: "react", emoji: "💚" }),
			trace({ s: 0, e: 16, kind: "react", emoji: "💚" }),
		);
		const segments = buildSegments({
			text,
			traces,
			visible: all,
			colorOf: (item) => item.author.color ?? "#999999",
		});
		const first = segments[0];
		expect(first?.marks).toEqual([
			{ color: "#999999", dotted: true },
			{ color: "#444444", dotted: false },
			{ color: "#333333", dotted: false },
		]);
		expect(first?.notes).toHaveLength(1);
		expect(first?.reactions).toEqual([
			{ emoji: "💚", traces: [traces[5] as Trace, traces[6] as Trace] },
		]);
		const hidden = buildSegments({
			text,
			traces,
			visible: { underline: false, memo: false, react: false },
			colorOf: () => "#000",
		});
		expect(
			hidden.every(
				(segment) => !segment.marks.length && !segment.notes.length && !segment.reactions.length,
			),
		).toBe(true);
	});

	it("draws marks as a fixed band", () => {
		expect(markStyle([])).toBeUndefined();
		const pen = markStyle([{ color: "#285C48", dotted: false }], 1)?.background ?? "";
		expect(pen).toContain("data:image/svg+xml");
		expect(pen).toContain(encodeURIComponent("#285C48"));
		expect(pen).toContain("calc(100% - 0px)");
		expect(markStyle([{ color: "#285C48", dotted: false }], 1)).toEqual(
			markStyle([{ color: "#285C48", dotted: false }], 1),
		);
		expect(markStyle([{ color: "#999", dotted: true }])?.background).toContain("100% 2px");
	});
});
