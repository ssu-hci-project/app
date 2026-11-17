import { reactionEmojis } from "@app/contract";
import {
	HighlighterIcon,
	MessageSquareTextIcon,
	PenLineIcon,
	SmileIcon,
	SparklesIcon,
	UnderlineIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib";

export type ToolbarAction = "underline" | "memo" | "react" | "question" | "decorate" | "traces";

function Tool({
	icon,
	label,
	active,
	onClick,
}: {
	icon: ReactNode;
	label: string;
	active?: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			aria-pressed={active}
			onClick={onClick}
			className={cn(
				"flex h-13 w-14 shrink-0 flex-col items-center justify-center gap-1 rounded-xl text-[11px] leading-none font-semibold outline-none focus-visible:ring-2 focus-visible:ring-background active:bg-background/15 [&_svg]:size-5",
				active && "bg-background text-foreground active:bg-background",
			)}
		>
			{icon}
			{label}
		</button>
	);
}

/**
 * Floating tools for the selected passage, placed under it (or above when there is no room).
 * `top` is relative to the reading area.
 */
export function SelectionToolbar({
	top,
	underlined,
	traceCount,
	emojiOpen,
	emojiAbove,
	onAction,
	onEmoji,
}: {
	top: number;
	underlined: boolean;
	traceCount: number;
	emojiOpen: boolean;
	emojiAbove: boolean;
	onAction: (action: ToolbarAction) => void;
	onEmoji: (emoji: (typeof reactionEmojis)[number]) => void;
}) {
	return (
		<div className="absolute inset-x-2 z-20 flex flex-col items-center" style={{ top }}>
			{emojiOpen && emojiAbove && <EmojiRow onEmoji={onEmoji} className="mb-2" />}
			<div
				role="toolbar"
				aria-label="고른 구절에 남기기"
				className="toolbar-in flex max-w-full items-center rounded-2xl bg-toolbar p-1 text-background shadow-[0_6px_20px_rgb(0_0_0/0.25)]"
			>
				<Tool
					icon={underlined ? <HighlighterIcon /> : <UnderlineIcon />}
					label={underlined ? "밑줄 지우기" : "밑줄"}
					active={underlined}
					onClick={() => onAction("underline")}
				/>
				<Tool icon={<MessageSquareTextIcon />} label="메모" onClick={() => onAction("memo")} />
				<Tool
					icon={<SmileIcon />}
					label="반응"
					active={emojiOpen}
					onClick={() => onAction("react")}
				/>
				<Tool icon={<SparklesIcon />} label="질문" onClick={() => onAction("question")} />
				<Tool icon={<PenLineIcon />} label="꾸미기" onClick={() => onAction("decorate")} />
				{traceCount > 0 && (
					<>
						<span aria-hidden="true" className="mx-0.5 h-8 w-px bg-background/25" />
						<Tool
							icon={
								<span className="text-base leading-5 font-bold tabular-nums">{traceCount}</span>
							}
							label="흔적"
							onClick={() => onAction("traces")}
						/>
					</>
				)}
			</div>
			{emojiOpen && !emojiAbove && <EmojiRow onEmoji={onEmoji} className="mt-2" />}
		</div>
	);
}

function EmojiRow({
	onEmoji,
	className,
}: {
	onEmoji: (emoji: (typeof reactionEmojis)[number]) => void;
	className?: string;
}) {
	return (
		<fieldset
			className={cn(
				"toolbar-in m-0 flex min-w-0 rounded-full border-0 bg-card p-1 shadow-[0_6px_24px_rgb(0_0_0/0.18)]",
				className,
			)}
		>
			<legend className="sr-only">반응 고르기</legend>
			{reactionEmojis.map((emoji) => (
				<button
					key={emoji}
					type="button"
					onClick={() => onEmoji(emoji)}
					className="grid size-11 place-items-center rounded-full text-[22px] outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-muted"
				>
					{emoji}
				</button>
			))}
		</fieldset>
	);
}
