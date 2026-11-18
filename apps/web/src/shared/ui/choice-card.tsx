import { m } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib";
import { Button } from "./button";

export function ChoiceCard({
	selected,
	onSelect,
	children,
	className,
}: {
	selected: boolean;
	onSelect: () => void;
	children: ReactNode;
	className?: string;
}) {
	return (
		<Button
			render={<m.button whileTap={{ scale: 0.99 }} />}
			type="button"
			variant="outline"
			aria-pressed={selected}
			onClick={onSelect}
			className={cn(
				"h-auto min-h-14 min-w-0 justify-start rounded-xl px-4 py-3 text-left text-t6 leading-[22px] font-normal whitespace-normal break-keep",
				selected && "border-primary bg-muted font-semibold text-strong ring-1 ring-primary",
				className,
			)}
		>
			{children}
		</Button>
	);
}
