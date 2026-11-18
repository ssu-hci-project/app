import { m } from "motion/react";
import { cn } from "@/shared/lib";
import { PopOnSelect } from "./motion";
import { ReactionEmoji } from "./reaction-emoji";

export function ReactionButton({
	emoji,
	count,
	selected,
	disabled,
	onClick,
}: {
	emoji: string;
	count: number;
	selected: boolean;
	disabled?: boolean;
	onClick: () => void;
}) {
	return (
		<m.button
			layout="position"
			whileTap={{ scale: 0.92 }}
			type="button"
			aria-label={`${emoji} 반응 ${count}개`}
			aria-pressed={selected}
			disabled={disabled}
			onClick={onClick}
			className={cn(
				"flex h-8 items-center gap-1 rounded-full bg-neutral-weak px-2.5 text-t7 font-semibold text-sub outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none",
				selected && "bg-accent text-brand ring-1 ring-primary/20",
			)}
		>
			<PopOnSelect selected={selected}>
				<ReactionEmoji emoji={emoji} decorative className="size-4" />
			</PopOnSelect>
			<m.span
				key={count}
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				className="tabular-nums"
			>
				{count}
			</m.span>
		</m.button>
	);
}
