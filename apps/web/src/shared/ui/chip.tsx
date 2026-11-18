import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/shared/lib";
import { XIcon } from "./tds-icon";

const chipVariants = cva(
	"relative inline-flex shrink-0 items-center justify-center gap-1 overflow-clip rounded-full border-[0.66px] border-neutral-weak bg-neutral-weak leading-[1.252] font-semibold whitespace-nowrap text-sub outline-none select-none transition-colors after:absolute after:inset-0 after:bg-black/5 after:opacity-0 focus-visible:ring-3 focus-visible:ring-ring/50 active:after:opacity-100 disabled:opacity-30",
	{
		variants: {
			size: {
				s: "min-h-8 min-w-13 px-[11px] text-t7",
				m: "min-h-9.5 min-w-15 px-3.5 text-t6",
			},
			variant: {
				fill: "aria-pressed:border-chip-selected-border aria-pressed:bg-chip-selected aria-pressed:text-background",
				weak: "aria-pressed:border-primary/20 aria-pressed:bg-accent aria-pressed:text-brand",
			},
		},
		defaultVariants: { size: "s", variant: "fill" },
	},
);

type ChipStyle = VariantProps<typeof chipVariants>;

export function Chip({
	selected,
	size,
	variant,
	className,
	...props
}: ComponentProps<"button"> & ChipStyle & { selected?: boolean }) {
	return (
		<button
			type="button"
			aria-pressed={selected}
			className={cn(chipVariants({ size, variant }), className)}
			{...props}
		/>
	);
}

export function RemovableChip({
	children,
	onSelect,
	onRemove,
	removeLabel,
	size,
}: ChipStyle & {
	children: ReactNode;
	onSelect: () => void;
	onRemove: () => void;
	removeLabel: string;
}) {
	return (
		<span className={cn(chipVariants({ size }), "gap-0 px-0")}>
			<button type="button" onClick={onSelect} className="h-full self-stretch pr-1 pl-[11px]">
				{children}
			</button>
			<button
				type="button"
				aria-label={removeLabel}
				onClick={onRemove}
				className="grid h-full self-stretch place-items-center pr-2.5 pl-0.5 text-muted-foreground"
			>
				<XIcon className="size-4" />
			</button>
		</span>
	);
}
