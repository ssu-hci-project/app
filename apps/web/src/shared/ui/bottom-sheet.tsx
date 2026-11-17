import { XIcon } from "lucide-react";
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
}: {
	title: ReactNode;
	description?: ReactNode;
	children: ReactNode;
}) {
	return (
		<DrawerContent>
			<DrawerHeader className="relative pr-14 text-left group-data-[swipe-axis=y]/drawer-popup:text-left">
				<DrawerTitle className="text-lg font-bold">{title}</DrawerTitle>
				{description && <DrawerDescription>{description}</DrawerDescription>}
				<DrawerClose
					render={<Button variant="ghost" size="icon" className="absolute top-2 right-2" />}
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
}: {
	className?: string;
	children: ReactNode;
}) {
	return (
		<div
			className={cn(
				"min-h-0 overflow-y-auto px-4 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]",
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
				<DrawerTitle className="text-sm text-muted-foreground">{title}</DrawerTitle>
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
				<span className="text-base font-medium">{label}</span>
				{description && <span className="text-sm text-muted-foreground">{description}</span>}
			</span>
		</button>
	);
}
