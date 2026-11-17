import { useActivity } from "@stackflow/react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/shared/lib";
import { Button } from "./button";

/**
 * One Stackflow activity. A pushed screen slides in from the right and the one under it shifts left,
 * timed by `transitionDuration` in `app/stackflow/config.ts` (keyframes in `app/styles/index.css`).
 */
export function AppScreen({ children }: { children: ReactNode }) {
	const { transitionState, isActive, isRoot, zIndex } = useActivity();
	return (
		<div
			data-transition={transitionState}
			data-root={isRoot || undefined}
			data-covered={(!isActive && transitionState === "enter-done") || undefined}
			className="app-screen absolute inset-0 flex flex-col overflow-hidden bg-background"
			style={{ zIndex }}
		>
			{children}
		</div>
	);
}

export function AppScreenContent({ className, ...props }: ComponentProps<"div">) {
	return (
		<div
			className={cn("relative min-h-0 flex-1 overflow-y-auto overscroll-contain", className)}
			{...props}
		/>
	);
}

export function AppBar({ className, ...props }: ComponentProps<"header">) {
	return (
		<header
			className={cn(
				"flex h-[calc(3.5rem+env(safe-area-inset-top))] shrink-0 items-center gap-1 bg-card px-2 pt-[env(safe-area-inset-top)]",
				className,
			)}
			{...props}
		/>
	);
}

export function AppBarLeft({ className, ...props }: ComponentProps<"div">) {
	return <div className={cn("flex min-w-10 items-center px-2 first:px-0", className)} {...props} />;
}

export function AppBarMain({ title }: { title: string }) {
	return <h1 className="min-w-0 flex-1 truncate text-center text-lg font-bold">{title}</h1>;
}

export function AppBarRight({ className, ...props }: ComponentProps<"div">) {
	return (
		<div className={cn("ml-auto flex min-w-10 items-center justify-end", className)} {...props} />
	);
}

export function AppBarIconButton(props: ComponentProps<typeof Button>) {
	return <Button type="button" variant="ghost" size="icon" {...props} />;
}
