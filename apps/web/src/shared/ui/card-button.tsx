import type { ComponentProps } from "react";
import { cn } from "@/shared/lib";

/** A tappable grey surface card: continue reading, trace previews. */
export function CardButton({ className, ...props }: ComponentProps<"button">) {
	return (
		<button
			type="button"
			className={cn(
				"rounded-2xl bg-neutral-weak p-4 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-neutral-pressed",
				className,
			)}
			{...props}
		/>
	);
}
