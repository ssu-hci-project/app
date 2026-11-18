import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/shared/lib";
import { Item, ItemContent, ItemTitle } from "./item";

/** Heading above a `List`. */
export function ListHeader({ className, ...props }: ComponentProps<"h2">) {
	return (
		<h2 className={cn("px-6 pt-6 pb-2 text-t5 font-bold text-strong", className)} {...props} />
	);
}

/** Full-bleed rows; each child is a `ListButton`. */
export function List({ className, ...props }: ComponentProps<"div">) {
	return <div className={cn("flex flex-col", className)} {...props} />;
}

export function ListButton({
	title,
	detail,
	onClick,
	leading,
	trailing,
}: {
	title: ReactNode;
	detail?: ReactNode;
	onClick: () => void;
	leading?: ReactNode;
	trailing?: ReactNode;
}) {
	return (
		<div className="flex items-center bg-card">
			<Item
				render={<button type="button" onClick={onClick} />}
				className="min-h-11 min-w-0 flex-1 cursor-pointer flex-nowrap gap-4 rounded-none border-0 px-6 py-3 text-left active:bg-muted"
			>
				{leading && <span className="shrink-0">{leading}</span>}
				<ItemContent className="min-w-0 gap-0">
					<ItemTitle className="line-clamp-none text-t5 leading-[1.35] font-bold">
						{title}
					</ItemTitle>
					{detail && <div className="text-t7 leading-[1.35] text-muted-foreground">{detail}</div>}
				</ItemContent>
			</Item>
			{trailing && <div className="shrink-0 pr-3">{trailing}</div>}
		</div>
	);
}
