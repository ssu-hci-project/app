import type { ComponentProps } from "react";
import { cn } from "@/shared/lib";

export function BottomCta({ className, children, ...props }: ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col",
				className,
			)}
			{...props}
		>
			<div aria-hidden="true" className="h-9 bg-linear-to-b from-transparent to-background" />
			<div className="pointer-events-auto flex gap-2 bg-background px-5 pb-[max(20px,env(safe-area-inset-bottom))]">
				{children}
			</div>
		</div>
	);
}
