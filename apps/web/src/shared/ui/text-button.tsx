import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/shared/lib";

const textButtonVariants = cva(
	"inline-flex shrink-0 items-center gap-0.5 rounded-md leading-[1.252] font-semibold outline-none transition-opacity focus-visible:ring-3 focus-visible:ring-ring/50 active:opacity-60 disabled:opacity-30",
	{
		variants: {
			size: { xs: "text-t7", sm: "text-st9", md: "text-t6", lg: "text-t5" },
			tone: { sub: "text-sub", primary: "text-brand", strong: "text-strong" },
			underline: { true: "underline underline-offset-2" },
		},
		defaultVariants: { size: "md", tone: "sub" },
	},
);

export function TextButton({
	size,
	tone,
	underline,
	className,
	...props
}: ComponentProps<"button"> & VariantProps<typeof textButtonVariants>) {
	return (
		<button
			type="button"
			className={cn(textButtonVariants({ size, tone, underline }), className)}
			{...props}
		/>
	);
}
