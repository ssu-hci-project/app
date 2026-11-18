import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/shared/lib";

const iconButtonVariants = cva(
	"relative inline-grid shrink-0 place-items-center rounded-full outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-30 [&_svg:not([class*='size-'])]:size-6",
	{
		variants: {
			variant: {
				clear: "active:bg-neutral-weak",
				fill: "bg-neutral-weak active:bg-[color-mix(in_oklch,var(--neutral-weak),var(--foreground)_10%)]",
			},
			size: { md: "size-10", lg: "size-11" },
		},
		defaultVariants: { variant: "clear", size: "lg" },
	},
);

export function IconButton({
	variant,
	size,
	className,
	...props
}: ComponentProps<"button"> & VariantProps<typeof iconButtonVariants> & { "aria-label": string }) {
	return (
		<button
			type="button"
			className={cn(iconButtonVariants({ variant, size }), className)}
			{...props}
		/>
	);
}
