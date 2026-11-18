import type { ReactNode } from "react";
import { cn } from "@/shared/lib";
import { Button } from "./button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "./drawer";
import { XIcon } from "./tds-icon";

type SheetProps = { open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode };

/** A bottom sheet bound to `useStepOverlay().bind(key)`. */
export function BottomSheet({ open, onOpenChange, children }: SheetProps) {
	return (
		<Drawer open={open} onOpenChange={onOpenChange}>
			{children}
		</Drawer>
	);
}

export function BottomSheetContent({
	title,
	description,
	children,
	className,
}: {
	title: ReactNode;
	description?: ReactNode;
	children: ReactNode;
	className?: string;
}) {
	return (
		<DrawerContent className={className}>
			<DrawerHeader className="relative px-6 pt-[21px] pr-16 pb-0 text-left group-data-[swipe-axis=y]/drawer-popup:text-left">
				<DrawerTitle className="text-t4 leading-[1.35] font-bold">{title}</DrawerTitle>
				{description && <DrawerDescription className="break-keep">{description}</DrawerDescription>}
				<DrawerClose
					render={<Button variant="ghost" size="icon" className="absolute top-2 right-2 size-11" />}
					aria-label="닫기"
				>
					<XIcon />
				</DrawerClose>
			</DrawerHeader>
			{children}
		</DrawerContent>
	);
}

export function BottomSheetBody({
	className,
	children,
	withFooter,
}: {
	className?: string;
	children: ReactNode;
	/** The sheet has a `BottomSheetFooter`, which takes care of the safe area. */
	withFooter?: boolean;
}) {
	return (
		<div
			className={cn(
				"min-h-0 flex-1 overflow-y-auto px-6 pt-4",
				withFooter ? "pb-4" : "pb-[calc(1.5rem+env(safe-area-inset-bottom))]",
				className,
			)}
		>
			{children}
		</div>
	);
}

/** Buttons pinned under a sheet's scrolling body, e.g. [취소][남기기]. */
export function BottomSheetFooter({
	className,
	children,
}: {
	className?: string;
	children: ReactNode;
}) {
	return (
		<div
			className={cn(
				"flex shrink-0 gap-2 bg-popover px-5 pt-[34px] pb-[calc(20px+env(safe-area-inset-bottom))] *:flex-1",
				className,
			)}
		>
			{children}
		</div>
	);
}

/** A swipe-to-dismiss action list, opened from an app bar "more" button. */
export function MenuSheet({ open, onOpenChange, children }: SheetProps) {
	return (
		<Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
			{children}
		</Drawer>
	);
}

export function MenuSheetContent({ title, children }: { title: ReactNode; children: ReactNode }) {
	return (
		<DrawerContent>
			<DrawerHeader className="text-left group-data-[swipe-axis=y]/drawer-popup:text-left">
				<DrawerTitle className="text-st9 text-muted-foreground">{title}</DrawerTitle>
			</DrawerHeader>
			<div className="flex flex-col px-2 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))]">
				{children}
			</div>
			<DrawerClose className="sr-only">닫기</DrawerClose>
		</DrawerContent>
	);
}

export function MenuSheetItem({
	icon,
	label,
	description,
	tone,
	onClick,
}: {
	icon?: ReactNode;
	label: ReactNode;
	description?: ReactNode;
	tone?: "critical";
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"flex min-h-14 w-full items-center gap-3 rounded-lg px-3 py-2 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-muted [&_svg]:size-6 [&_svg]:shrink-0",
				tone === "critical" && "text-destructive",
			)}
		>
			{icon}
			<span className="flex flex-col">
				<span className="text-st8 font-medium">{label}</span>
				{description && <span className="text-st9 text-muted-foreground">{description}</span>}
			</span>
		</button>
	);
}
