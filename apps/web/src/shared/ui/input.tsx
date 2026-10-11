import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/shared/lib";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
	({ className, ...props }, ref) => (
		<input
			ref={ref}
			className={cn(
				"h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
				className,
			)}
			{...props}
		/>
	),
);
Input.displayName = "Input";
