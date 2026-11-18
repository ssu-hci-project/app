import type * as React from "react";

import { cn } from "@/shared/lib/cn";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
	return (
		<textarea
			data-slot="textarea"
			className={cn(
				"flex field-sizing-content min-h-[54px] resize-none w-full rounded-xl border border-input bg-muted px-4 py-3.5 text-t5 leading-[25.5px] font-medium text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:bg-[color-mix(in_oklch,var(--primary)_5%,var(--muted))] focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive",
				className,
			)}
			{...props}
		/>
	);
}

export { Textarea };
