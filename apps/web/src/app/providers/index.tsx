import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { type ReactNode, useLayoutEffect } from "react";
import { useMediaQuery } from "usehooks-ts";
import { queryClient } from "@/shared/api";
import { MotionProvider, Toaster, TooltipProvider } from "@/shared/ui";

/**
 * All app-wide context providers, composed in one place.
 * Route components should never reach for a provider directly —
 * add it here so every page gets it for free.
 */
export function AppProviders({ children }: { children: ReactNode }) {
	const dark = useMediaQuery("(prefers-color-scheme: dark)");
	useLayoutEffect(() => {
		document.documentElement.classList.toggle("dark", dark);
		document.documentElement.style.colorScheme = dark ? "dark" : "light";
	}, [dark]);
	return (
		<QueryClientProvider client={queryClient}>
			<MotionProvider>
				<TooltipProvider>
					{children}
					{/* 하단 내비게이션·쪽 넘김 막대 위로 띄워요. */}
					<Toaster
						position="bottom-center"
						offset={{ bottom: 96, left: 0, right: 0 }}
						mobileOffset={{ bottom: 96, left: 0, right: 0 }}
					/>
				</TooltipProvider>
				{import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
			</MotionProvider>
		</QueryClientProvider>
	);
}
