import { type Decoration, DRAWING_LIMIT, type Drawing, type Stroke } from "@app/contract";
import {
	type ReactNode,
	type PointerEvent as ReactPointerEvent,
	useEffect,
	useRef,
	useState,
} from "react";
import {
	decorationStyle,
	loadHandwriting,
	noteColors,
	pens,
	stickers,
	tapes,
} from "@/entities/trace";
import { cn } from "@/shared/lib";
import { Button, useNotice, XIcon } from "@/shared/ui";

type Mode = "pen" | "note" | "tape" | "stk";
type Item = Decoration & { text?: string };
const tips: Record<Mode, string> = {
	pen: "구절 주변에 자유롭게 그려보세요",
	note: "메모지를 붙일 곳을 눌러주세요",
	tape: "끌어서 마스킹테이프를 붙여보세요",
	stk: "스티커를 붙일 곳을 눌러주세요",
};
const round = (value: number) => Math.round(value * 1000) / 1000;

/**
 * 꾸미기: draw, stick notes, tape and stickers around the passage. Everything is stored in em
 * from the passage's first letter (`origin`, px inside the reading area), so it follows font size.
 */
export function DecorateMode({
	origin,
	fs,
	onCancel,
	onDone,
}: {
	origin: { x: number; y: number };
	fs: number;
	onCancel: () => void;
	onDone: (drawing: Drawing) => void;
}) {
	const notify = useNotice();
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const rootRef = useRef<HTMLDivElement>(null);
	const [mode, setMode] = useState<Mode>("pen");
	const [pen, setPen] = useState(0);
	const [noteColor, setNoteColor] = useState(0);
	const [tape, setTape] = useState("stripe");
	const [sticker, setSticker] = useState(stickers[0] ?? "🌷");
	const [strokes, setStrokes] = useState<Stroke[]>([]);
	const [items, setItems] = useState<(Item | null)[]>([]);
	const [history, setHistory] = useState<("stroke" | "item")[]>([]);
	const [tipVisible, setTipVisible] = useState(true);
	const drawing = useRef<{
		stroke?: Stroke;
		tape?: number;
		drag?: { index: number; from: [number, number]; item: Item };
	}>({});

	useEffect(() => loadHandwriting(), []);

	const toEm = (clientX: number, clientY: number): [number, number] => {
		const rect = rootRef.current?.getBoundingClientRect();
		return [
			round((clientX - (rect?.left ?? 0) - origin.x) / fs),
			round((clientY - (rect?.top ?? 0) - origin.y) / fs),
		];
	};

	// Repaint pen strokes on the canvas whenever they change.
	useEffect(() => {
		const canvas = canvasRef.current;
		const context = canvas?.getContext("2d");
		if (!canvas || !context) return;
		const ratio = window.devicePixelRatio || 1;
		const { width, height } = canvas.getBoundingClientRect();
		if (canvas.width !== Math.round(width * ratio)) {
			canvas.width = Math.round(width * ratio);
			canvas.height = Math.round(height * ratio);
		}
		context.setTransform(ratio, 0, 0, ratio, 0, 0);
		context.clearRect(0, 0, width, height);
		for (const stroke of strokes) {
			context.beginPath();
			context.strokeStyle = stroke.c;
			context.globalAlpha = stroke.hl ? 0.6 : 1;
			context.lineWidth = stroke.w * fs;
			context.lineCap = "round";
			context.lineJoin = "round";
			stroke.d.forEach(([x, y], index) => {
				const px = origin.x + x * fs;
				const py = origin.y + y * fs;
				if (index) context.lineTo(px, py);
				else context.moveTo(px, py);
			});
			if (stroke.d.length === 1) {
				const [x = 0, y = 0] = stroke.d[0] ?? [];
				context.lineTo(origin.x + x * fs + 0.1, origin.y + y * fs);
			}
			context.stroke();
		}
		context.globalAlpha = 1;
	}, [strokes, fs, origin.x, origin.y]);

	const addItem = (item: Item) => {
		setItems((list) => [...list, item]);
		setHistory((list) => [...list, "item"]);
	};
	const onCanvasDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
		event.preventDefault();
		event.currentTarget.setPointerCapture(event.pointerId);
		setTipVisible(false);
		const point = toEm(event.clientX, event.clientY);
		if (mode === "pen") {
			const tool = pens[pen] ?? pens[0];
			if (!tool) return;
			const stroke: Stroke = {
				c: tool.c,
				w: tool.w,
				d: [point],
				...(tool.hl ? { hl: 1 as const } : {}),
			};
			drawing.current.stroke = stroke;
			setStrokes((list) => [...list, stroke]);
			setHistory((list) => [...list, "stroke"]);
		} else if (mode === "tape") {
			drawing.current.tape = items.length;
			addItem({
				t: "tape",
				x1: point[0],
				y1: point[1],
				x2: point[0] + 0.01,
				y2: point[1],
				p: tape as "stripe",
			});
		} else if (mode === "note") {
			addItem({
				t: "note",
				x: round(point[0] - 1),
				y: round(point[1] - 0.6),
				w: 7,
				c: noteColors[noteColor] ?? "#FFF1A8",
				r: Math.round((Math.random() * 5 - 2.5) * 10) / 10,
				text: "",
			});
		} else {
			addItem({
				t: "stk",
				x: point[0],
				y: point[1],
				s: sticker,
				z: 1.8,
				r: Math.round(Math.random() * 24 - 12),
			});
		}
	};
	const onCanvasMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
		const point = toEm(event.clientX, event.clientY);
		const { stroke } = drawing.current;
		if (stroke) {
			const last = stroke.d[stroke.d.length - 1];
			if (last && Math.hypot(point[0] - last[0], point[1] - last[1]) > 0.05) {
				stroke.d = [...stroke.d, point];
				setStrokes((list) => [...list]);
			}
		} else if (drawing.current.tape !== undefined) {
			const index = drawing.current.tape;
			setItems((list) =>
				list.map((item, at) =>
					at === index && item?.t === "tape" ? { ...item, x2: point[0], y2: point[1] } : item,
				),
			);
		}
	};
	const onCanvasUp = () => {
		const index = drawing.current.tape;
		if (index !== undefined)
			setItems((list) =>
				list.map((item, at) =>
					at === index &&
					item?.t === "tape" &&
					Math.hypot(item.x2 - item.x1, item.y2 - item.y1) < 0.8
						? { ...item, x2: item.x1 + 4, y2: item.y1 }
						: item,
				),
			);
		drawing.current = {};
	};
	// Dragging a note or sticker.
	useEffect(() => {
		const move = (event: PointerEvent) => {
			const drag = drawing.current.drag;
			if (!drag) return;
			const [x, y] = toEm(event.clientX, event.clientY);
			const dx = x - drag.from[0];
			const dy = y - drag.from[1];
			setItems((list) =>
				list.map((item, at) => {
					if (at !== drag.index || !item) return item;
					const start = drag.item;
					if (start.t === "tape" && item.t === "tape")
						return {
							...item,
							x1: round(start.x1 + dx),
							y1: round(start.y1 + dy),
							x2: round(start.x2 + dx),
							y2: round(start.y2 + dy),
						};
					if (start.t !== "tape" && item.t !== "tape")
						return { ...item, x: round(start.x + dx), y: round(start.y + dy) };
					return item;
				}),
			);
		};
		const up = () => {
			drawing.current.drag = undefined;
		};
		window.addEventListener("pointermove", move);
		window.addEventListener("pointerup", up);
		return () => {
			window.removeEventListener("pointermove", move);
			window.removeEventListener("pointerup", up);
		};
	});

	const undo = () => {
		const last = history[history.length - 1];
		if (!last) return;
		setHistory((list) => list.slice(0, -1));
		if (last === "stroke") setStrokes((list) => list.slice(0, -1));
		else
			setItems((list) => {
				const next = [...list];
				while (next.length && next[next.length - 1] === null) next.pop();
				next.pop();
				return next;
			});
	};
	const finish = () => {
		const kept = items
			.filter((item): item is Item => !!item && !(item.t === "note" && !item.text?.trim()))
			.map((item) =>
				item.t === "note" ? { ...item, text: (item.text ?? "").trim().slice(0, 200) } : item,
			);
		const data = {
			strokes: strokes.filter((stroke) => stroke.d.length),
			items: kept as Decoration[],
		};
		if (!data.strokes.length && !data.items.length) return onCancel();
		if (JSON.stringify(data).length > DRAWING_LIMIT) {
			notify("그림이 너무 커요. 조금 줄여주세요", "critical");
			return;
		}
		onDone(data);
	};
	const passThrough = mode === "pen" || mode === "tape";
	return (
		<div ref={rootRef} className="absolute inset-0 z-30">
			<canvas
				ref={canvasRef}
				aria-label="꾸미기 캔버스"
				className="absolute inset-0 size-full cursor-crosshair touch-none"
				onPointerDown={onCanvasDown}
				onPointerMove={onCanvasMove}
				onPointerUp={onCanvasUp}
				onPointerCancel={onCanvasUp}
			/>
			<div
				className="pointer-events-none absolute size-0"
				style={{ left: origin.x, top: origin.y }}
			>
				{items.map((item, index) =>
					item ? (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: removed items stay as null, so indexes are stable.
							key={index}
							className={cn(
								"absolute",
								item.t === "note" &&
									"rounded-xs px-[0.6em] pt-[0.45em] pb-[0.55em] font-hand leading-tight text-note-ink shadow-[1px_3px_8px_rgb(0_0_0/0.16)]",
								item.t === "stk" && "drop-shadow-[0_2px_3px_rgb(0_0_0/0.25)] select-none",
								!passThrough && "pointer-events-auto cursor-grab touch-none",
							)}
							style={decorationStyle(item, fs)}
							onPointerDown={(event) => {
								if ((event.target as HTMLElement).closest("textarea,button")) return;
								event.preventDefault();
								drawing.current.drag = { index, from: toEm(event.clientX, event.clientY), item };
							}}
						>
							{item.t === "note" && (
								<textarea
									aria-label="메모지 내용"
									// biome-ignore lint/a11y/noAutofocus: 붙인 메모지에 바로 적습니다.
									autoFocus={!item.text}
									value={item.text ?? ""}
									maxLength={200}
									placeholder="메모를 적어보세요"
									onChange={(event) =>
										setItems((list) =>
											list.map((entry, at) =>
												at === index && entry?.t === "note"
													? { ...entry, text: event.target.value }
													: entry,
											),
										)
									}
									className="pointer-events-auto block min-h-[3.2em] w-full resize-none bg-transparent outline-none [field-sizing:content] placeholder:text-note-ink/60"
								/>
							)}
							{item.t === "stk" && item.s}
							<button
								type="button"
								aria-label="이 꾸미기 지우기"
								onClick={() =>
									setItems((list) => list.map((entry, at) => (at === index ? null : entry)))
								}
								className="pointer-events-auto absolute -top-3 -right-3 grid size-6 place-items-center rounded-full bg-foreground font-sans text-background before:absolute before:-inset-2.5 before:content-['']"
								style={item.t === "tape" ? { top: "50%", marginTop: -12, right: -14 } : undefined}
							>
								<XIcon className="size-3.5" />
							</button>
						</div>
					) : null,
				)}
			</div>
			{tipVisible && (
				<p className="pointer-events-none absolute top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-foreground/85 px-3.5 py-2 text-st10 font-medium whitespace-nowrap text-background">
					{tips[mode]}
				</p>
			)}
			<div
				role="toolbar"
				aria-label="꾸미기 도구"
				className="absolute inset-x-2 bottom-2 flex flex-col gap-2 rounded-[20px] bg-toolbar p-2.5 text-toolbar-foreground shadow-floating"
			>
				<fieldset className="m-0 flex min-w-0 rounded-xl border-0 bg-background/10 p-1">
					<legend className="sr-only">꾸미기 종류</legend>
					{(
						[
							["pen", "펜"],
							["note", "메모지"],
							["tape", "테이프"],
							["stk", "스티커"],
						] as const
					).map(([value, label]) => (
						<button
							key={value}
							type="button"
							aria-pressed={mode === value}
							onClick={() => {
								setMode(value);
								setTipVisible(true);
							}}
							className="h-9 flex-1 rounded-lg text-st9 font-semibold text-background/80 aria-pressed:bg-background aria-pressed:text-foreground"
						>
							{label}
						</button>
					))}
				</fieldset>
				<div className="flex min-h-11 items-center gap-1 overflow-x-auto [scrollbar-width:none]">
					{mode === "pen" &&
						pens.map((tool, index) => (
							<Swatch
								key={tool.c}
								label={`${tool.hl ? "형광펜" : "펜"} ${index + 1}`}
								selected={pen === index}
								onClick={() => setPen(index)}
							>
								<span
									className={cn("block rounded-full", tool.hl ? "h-3 w-6" : "size-6")}
									style={{ backgroundColor: tool.c }}
								/>
							</Swatch>
						))}
					{mode === "note" &&
						noteColors.map((color, index) => (
							<Swatch
								key={color}
								label={`메모지 색 ${index + 1}`}
								selected={noteColor === index}
								onClick={() => setNoteColor(index)}
							>
								<span
									className="block size-6 rounded-sm ring-1 ring-black/15"
									style={{ backgroundColor: color }}
								/>
							</Swatch>
						))}
					{mode === "tape" &&
						Object.entries(tapes).map(([key, background], index) => (
							<Swatch
								key={key}
								label={`테이프 ${index + 1}`}
								selected={tape === key}
								onClick={() => setTape(key)}
								wide
							>
								<span className="block h-5 w-10 rounded-xs" style={{ background }} />
							</Swatch>
						))}
					{mode === "stk" &&
						stickers.map((emoji) => (
							<Swatch
								key={emoji}
								label={`스티커 ${emoji}`}
								selected={sticker === emoji}
								onClick={() => setSticker(emoji)}
							>
								<span className="text-t3 leading-none">{emoji}</span>
							</Swatch>
						))}
				</div>
				<div className="flex items-center gap-1.5">
					<Button
						variant="ghost"
						className="h-11 text-background hover:bg-background/10 hover:text-background"
						onClick={undo}
						disabled={!history.length}
					>
						되돌리기
					</Button>
					<span className="flex-1" />
					<Button
						variant="ghost"
						className="h-11 text-background hover:bg-background/10 hover:text-background"
						onClick={onCancel}
					>
						취소
					</Button>
					<Button className="h-11 px-5" onClick={finish}>
						완료
					</Button>
				</div>
			</div>
		</div>
	);
}

function Swatch({
	label,
	selected,
	onClick,
	wide,
	children,
}: {
	label: string;
	selected: boolean;
	onClick: () => void;
	wide?: boolean;
	children: ReactNode;
}) {
	return (
		<button
			type="button"
			aria-label={label}
			aria-pressed={selected}
			onClick={onClick}
			className={cn(
				"grid h-11 shrink-0 place-items-center rounded-xl aria-pressed:bg-background/20 aria-pressed:ring-2 aria-pressed:ring-background",
				wide ? "w-14" : "w-11",
			)}
		>
			{children}
		</button>
	);
}
