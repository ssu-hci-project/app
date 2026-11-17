import { SparklesIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/shared/lib";

const GRADIENT_ID = "ai-gradient";

/** Rendered once in `AppProviders`; `AiSparkleIcon` strokes with it. */
export function AiGradientDefs() {
	return (
		<svg width="0" height="0" aria-hidden="true" className="absolute">
			<defs>
				<linearGradient id={GRADIENT_ID} x1="0" y1="0" x2="1" y2="1">
					<stop offset="0.2" stopColor="#ff6600" />
					<stop offset="1" stopColor="#d25aca" />
				</linearGradient>
			</defs>
		</svg>
	);
}

export function AiSparkleIcon({ className, ...props }: ComponentProps<typeof SparklesIcon>) {
	return (
		<SparklesIcon
			aria-hidden="true"
			{...props}
			// Tailwind only generates literal class names, so the id is spelled out (same as GRADIENT_ID).
			className={cn("[&_path]:stroke-[url(#ai-gradient)]", className)}
		/>
	);
}
