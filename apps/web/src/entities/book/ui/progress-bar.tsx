import { cn } from "@/shared/lib";

/** A thin progress track. `value` is 0–100. */
export function ProgressBar({ value, className }: { value: number; className?: string }) {
	return (
		<div
			role="progressbar"
			aria-valuemin={0}
			aria-valuemax={100}
			aria-valuenow={value}
			className={cn("h-1 overflow-hidden rounded-full bg-muted", className)}
		>
			<div
				className="h-full rounded-full bg-primary transition-[width] duration-250"
				style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
			/>
		</div>
	);
}
