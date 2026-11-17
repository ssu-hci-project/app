import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/shared/lib";
import { Item, ItemContent, ItemTitle } from "./item";

/** Heading above a `List`. */
export function ListHeader({ className, ...props }: ComponentProps<"h2">) {
	return (
		<h2
			className={cn("px-4 pt-3 pb-1 text-sm font-bold text-muted-foreground", className)}
			{...props}
		/>
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
}: {
	title: ReactNode;
	detail?: ReactNode;
	onClick: () => void;
}) {
	return (
		<Item
			render={<button type="button" onClick={onClick} />}
			className="cursor-pointer rounded-none px-4 py-3 text-left active:bg-muted"
		>
			<ItemContent>
				<ItemTitle className="line-clamp-none text-base">{title}</ItemTitle>
				{detail && <div className="text-sm text-muted-foreground">{detail}</div>}
			</ItemContent>
		</Item>
	);
}
