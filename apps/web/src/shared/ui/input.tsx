import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/shared/lib";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
	({ className, ...props }, ref) => (
		<input
			data-slot="input"
			ref={ref}
			className={cn(
				"h-[54px] w-full rounded-xl border border-input bg-muted px-4 text-t5 leading-[1.5] font-medium text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-40 aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive",
				className,
			)}
			{...props}
		/>
	),
);
Input.displayName = "Input";
