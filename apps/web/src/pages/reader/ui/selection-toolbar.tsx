import { reactionEmojis } from "@app/contract";
import type { ReactNode, Ref } from "react";
import { cn } from "@/shared/lib";
import {
	Button,
	MessageSquareTextIcon,
	PencilIcon,
	QuestionIcon,
	ReactionEmoji,
	SmileIcon,
	UnderlineIcon,
} from "@/shared/ui";

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
		<Button
			variant="ghost"
			size="icon"
			type="button"
			aria-pressed={active}
			onClick={onClick}
			className={cn(
				"flex h-13 w-14 min-w-0 shrink flex-col items-center justify-center gap-1 rounded-xl text-st11 leading-none font-semibold outline-none focus-visible:ring-2 focus-visible:ring-background active:bg-background/15 [&_svg]:size-5",
				active && "bg-background text-foreground active:bg-background",
			)}
		>
			{icon}
			{label}
		</Button>
	);
}

/**
 * Floating tools for the selected passage, placed under it (or above when there is no room).
 * Placement is measured relative to the reading area.
 */
export function SelectionToolbar({
	placement,
	toolbarRef,
	underlined,
	traceCount,
	emojiOpen,
	onAction,
	onEmoji,
}: {
	placement: { top: number; above: boolean } | null;
	toolbarRef: Ref<HTMLDivElement>;
	underlined: boolean;
	traceCount: number;
	emojiOpen: boolean;
	onAction: (action: ToolbarAction) => void;
	onEmoji: (emoji: (typeof reactionEmojis)[number]) => void;
}) {
	return (
		<div
			ref={toolbarRef}
			className={cn(
				"pointer-events-none absolute inset-x-2 z-20 flex flex-col items-center gap-2",
				!placement && "invisible",
			)}
			style={{ top: placement?.top ?? 0, maxHeight: "calc(100% - 16px)" }}
		>
			{emojiOpen && placement?.above && <EmojiRow onEmoji={onEmoji} />}
			<div
				role="toolbar"
				aria-label="고른 구절에 남기기"
				className="toolbar-in pointer-events-auto flex max-w-full shrink-0 items-center rounded-2xl bg-toolbar p-1 text-toolbar-foreground shadow-floating"
			>
				<Tool
					icon={<UnderlineIcon />}
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
				<Tool icon={<QuestionIcon />} label="질문" onClick={() => onAction("question")} />
				<Tool icon={<PencilIcon />} label="꾸미기" onClick={() => onAction("decorate")} />
				{traceCount > 0 && (
					<>
						<span aria-hidden="true" className="mx-0.5 h-8 w-px bg-background/25" />
						<Tool
							icon={<span className="text-st8 leading-5 font-bold tabular-nums">{traceCount}</span>}
							label="흔적"
							onClick={() => onAction("traces")}
						/>
					</>
				)}
			</div>
			{emojiOpen && !placement?.above && <EmojiRow onEmoji={onEmoji} />}
		</div>
	);
}

function EmojiRow({ onEmoji }: { onEmoji: (emoji: (typeof reactionEmojis)[number]) => void }) {
	return (
		<fieldset className="toolbar-in pointer-events-auto m-0 min-h-0 min-w-0 max-w-full overflow-y-auto rounded-2xl border-0 bg-card p-1 shadow-floating min-[376px]:rounded-full">
			<legend className="sr-only">반응 고르기</legend>
			<div className="grid grid-cols-4 min-[376px]:grid-cols-8">
				{reactionEmojis.map((emoji) => (
					<Button
						variant="ghost"
						size="icon"
						key={emoji}
						type="button"
						onClick={() => onEmoji(emoji)}
						className="grid size-11 place-items-center rounded-full text-t3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-muted"
					>
						<ReactionEmoji emoji={emoji} />
					</Button>
				))}
			</div>
		</fieldset>
	);
}
