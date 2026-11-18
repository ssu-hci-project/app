import { cn } from "@/shared/lib";

/** The chosen passage, quoted with a primary rule on the left. */
export function PassageQuote({ quote, className }: { quote: string; className?: string }) {
	return (
		<blockquote
			className={cn(
				"line-clamp-2 border-l-[3px] border-primary pl-2.5 font-serif text-st9 leading-5 text-muted-foreground",
				className,
			)}
		>
			“{quote}”
		</blockquote>
	);
}
