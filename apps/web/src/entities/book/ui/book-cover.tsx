import type { Book } from "@app/contract";
import { cn } from "@/shared/lib";

const sizes = {
	sm: "h-20 w-14 rounded-[3px_7px_7px_3px] p-1.5",
	md: "h-[156px] w-[108px] rounded-[3px_7px_7px_3px] px-3 pt-3.5 pb-3 pl-4",
	lg: "h-[216px] w-[150px] rounded-[3px_7px_7px_3px] px-4 pt-5 pb-4 pl-[22px]",
} as const;

/**
 * A generated cover: the book's colour, a serif title and a darker spine edge on the left.
 * Titles only appear from the medium size up; the small cover is a colour chip with a spine.
 */
export function BookCover({
	book,
	size = "sm",
	className,
}: {
	book: Pick<Book, "title" | "author" | "color">;
	size?: keyof typeof sizes;
	className?: string;
}) {
	return (
		<div
			aria-hidden="true"
			className={cn(
				"relative flex shrink-0 flex-col justify-between overflow-hidden text-white shadow-[inset_4px_0_0_rgb(0_0_0/0.16),0_4px_12px_rgb(0_0_0/0.12)]",
				"after:pointer-events-none after:absolute after:inset-0 after:bg-linear-[115deg] after:from-white/15 after:via-white/0 after:to-black/10",
				sizes[size],
				className,
			)}
			style={{ backgroundColor: book.color }}
		>
			{size !== "sm" && (
				<>
					<div>
						<p
							className={cn(
								"line-clamp-4 font-serif font-semibold tracking-tight break-keep",
								size === "lg" ? "text-xl leading-snug" : "text-[15px] leading-tight",
							)}
						>
							{book.title}
						</p>
						<span className="mt-2 block h-0.5 w-[18px] bg-white/70" />
					</div>
					<p className={cn("truncate opacity-85", size === "lg" ? "text-xs" : "text-[10px]")}>
						{book.author}
					</p>
				</>
			)}
		</div>
	);
}
