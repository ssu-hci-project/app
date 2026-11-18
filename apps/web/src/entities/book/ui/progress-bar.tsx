import { m } from "motion/react";
import { cn } from "@/shared/lib";

/** A thin progress track. `value` is 0–100. */
export function ProgressBar({ value, className }: { value: number; className?: string }) {
	return (
		<div
			role="progressbar"
			aria-valuemin={0}
			aria-valuemax={100}
			aria-valuenow={value}
			className={cn("h-[5px] overflow-hidden rounded-[2.5px] bg-progress-track", className)}
		>
			<m.div
				initial={false}
				className="h-full rounded-[2.5px] bg-primary"
				animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
			/>
		</div>
	);
}
