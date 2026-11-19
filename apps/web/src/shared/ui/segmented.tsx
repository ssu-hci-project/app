import { m } from "motion/react";
import { type ReactNode, useId } from "react";
import { cn } from "@/shared/lib";

/** TDS fixed segmented control, L: 48px tall with 40px items. */
export function Segmented<T extends string | number>({
	label,
	value,
	options,
	onValueChange,
	className,
	indicatorClassName,
}: {
	label: string;
	value: T;
	options: { value: T; label: ReactNode; className?: string }[];
	onValueChange: (value: T) => void;
	className?: string;
	indicatorClassName?: string;
}) {
	const selectionId = useId();
	return (
		<fieldset
			className={cn(
				"m-0 flex h-12 min-w-0 rounded-xl border-0 bg-neutral-weak px-[5px] py-1",
				className,
			)}
		>
			<legend className="sr-only">{label}</legend>
			{options.map((option) => (
				<button
					key={String(option.value)}
					type="button"
					aria-pressed={option.value === value}
					onClick={() => onValueChange(option.value)}
					className={cn(
						"relative isolate h-10 min-w-0 flex-1 rounded-lg px-2 text-t5 leading-[1.252] font-medium text-muted-foreground outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:font-semibold aria-pressed:text-foreground",
						option.className,
					)}
				>
					{option.value === value && (
						<m.span
							layoutId={selectionId}
							className={cn(
								"absolute inset-0 -z-10 rounded-lg bg-card shadow-[0_1px_1px_rgb(0_0_0/9%)]",
								indicatorClassName,
							)}
						/>
					)}
					{option.label}
				</button>
			))}
		</fieldset>
	);
}
