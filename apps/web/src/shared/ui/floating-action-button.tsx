import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/shared/lib";
import { Button } from "./button";

/** The screen's one floating action. Placed by `MobileScreen`'s `fab` prop. */
export function FloatingActionButton({
	icon,
	label,
	extended = true,
	className,
	...props
}: { icon: ReactNode; label: string; extended?: boolean } & ComponentProps<typeof Button>) {
	return (
		<Button
			aria-label={extended ? undefined : label}
			className={cn(
				"h-14 rounded-full shadow-lg [&_svg:not([class*='size-'])]:size-6",
				extended ? "px-5 text-base" : "w-14 px-0",
				className,
			)}
			{...props}
		>
			{icon}
			{extended && label}
		</Button>
	);
}
