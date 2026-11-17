import { Spinner } from "@/shared/ui";
import { useImportProgress } from "../model/import-book";

/** Covers the screen while a book is read and uploaded. */
export function ImportProgressOverlay() {
	const progress = useImportProgress((state) => state.progress);
	if (!progress) return null;
	const [title, detail] =
		progress.stage === "open"
			? ["책을 여는 중이에요", progress.name]
			: progress.stage === "parse"
				? ["책을 읽는 중이에요", `${progress.done} / ${progress.total}`]
				: ["서재에 저장하는 중이에요", `${progress.percent}%`];
	return (
		<div
			role="status"
			aria-live="polite"
			className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background/95 px-6 text-center"
		>
			<Spinner className="size-8 text-primary" />
			<p className="text-base font-semibold">{title}</p>
			<p className="max-w-full truncate text-[13px] text-muted-foreground tabular-nums">{detail}</p>
		</div>
	);
}

/** Full-screen hint while a file is dragged over a screen that accepts it. */
export function DropHint() {
	return (
		<div className="pointer-events-none absolute inset-0 z-40 grid place-items-center bg-secondary/95 p-6 text-center">
			<p className="text-lg font-bold text-secondary-foreground">놓으면 서재에 올려요</p>
		</div>
	);
}
