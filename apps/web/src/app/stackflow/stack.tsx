import { historySyncPlugin } from "@stackflow/plugin-history-sync";
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic";
import {
	content,
	errorHandler,
	loading,
	stackflow,
	structuredActivityComponent,
	useActivity,
} from "@stackflow/react";
import { useEffect } from "react";
import { GroupBookPage } from "@/pages/group-book";
import { GroupNewPage } from "@/pages/group-new";
import { GroupReadyPage } from "@/pages/group-ready";
import { HomePage } from "@/pages/home";
import { InvitePage } from "@/pages/invite";
import { AppScreen, LoadingSkeleton, ResultSection } from "@/shared/ui";
import { config } from "./config";

const preloadErrors = new WeakSet<object>();
window.addEventListener("vite:preloadError", (event) => {
	const { payload } = event as Event & { payload: unknown };
	if (typeof payload === "object" && payload !== null) preloadErrors.add(payload);
});

function ActivityLoading() {
	return (
		<AppScreen>
			<div className="flex-1 px-5 pt-[calc(3.5rem+env(safe-area-inset-top))]">
				<LoadingSkeleton shape="article" />
			</div>
		</AppScreen>
	);
}

function ActivityError({ error }: { error: unknown }) {
	const { isActive, transitionState } = useActivity();
	useEffect(() => {
		// Wait for history sync to commit the book URL before reloading.
		if (!isActive || transitionState !== "enter-done") return;
		if (typeof error !== "object" || !error || !preloadErrors.has(error)) return;
		const key = "exchange-reading:preload-recovery";
		try {
			if (sessionStorage.getItem(key) === import.meta.url) return;
			sessionStorage.setItem(key, import.meta.url);
		} catch {
			return;
		}
		window.location.reload();
	}, [error, isActive, transitionState]);
	return (
		<AppScreen>
			<div className="grid flex-1 place-items-center">
				<ResultSection
					title="화면을 열지 못했어요"
					action={{ label: "새로고침", onClick: () => window.location.reload() }}
				/>
			</div>
		</AppScreen>
	);
}

export const { Stack } = stackflow({
	config,
	components: {
		HomePage,
		BookPage: structuredActivityComponent<"BookPage">({
			content: async () => ({
				default: content<"BookPage">((await import("@/pages/book")).BookPage),
			}),
			loading: loading<"BookPage">(ActivityLoading),
			errorHandler: errorHandler<"BookPage">(ActivityError),
		}),
		ReaderPage: structuredActivityComponent<"ReaderPage">({
			content: async () => ({
				default: content<"ReaderPage">((await import("@/pages/reader")).ReaderPage),
			}),
			loading: loading<"ReaderPage">(ActivityLoading),
			errorHandler: errorHandler<"ReaderPage">(ActivityError),
		}),
		InvitePage,
		GroupNewPage,
		GroupReadyPage,
		GroupBookPage,
	},
	plugins: [
		basicRendererPlugin(),
		historySyncPlugin({
			config,
			fallbackActivity: () => "HomePage",
		}),
	],
});
