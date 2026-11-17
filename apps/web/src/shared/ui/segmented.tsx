import type { ReactNode } from "react";
import { cn } from "@/shared/lib";

/** A row of mutually exclusive options (iOS-style segmented control), 44px tall. */
export function Segmented<T extends string | number>({
	label,
	value,
	options,
	onValueChange,
	className,
}: {
	label: string;
	value: T;
	options: { value: T; label: ReactNode; className?: string }[];
	onValueChange: (value: T) => void;
	className?: string;
}) {
	return (
		<fieldset
			className={cn("m-0 flex h-11 min-w-0 gap-1 rounded-xl border-0 bg-muted p-1", className)}
		>
			<legend className="sr-only">{label}</legend>
			{options.map((option) => (
				<button
					key={String(option.value)}
					type="button"
					aria-pressed={option.value === value}
					onClick={() => onValueChange(option.value)}
					className={cn(
						"h-9 flex-1 rounded-lg text-sm font-semibold text-muted-foreground outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:shadow-sm",
						option.className,
					)}
				>
					{option.label}
				</button>
			))}
		</fieldset>
	);
}
