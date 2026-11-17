import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { ReactNode } from "react";
import { queryClient } from "@/shared/api";
import { AiGradientDefs, Toaster, TooltipProvider } from "@/shared/ui";

/**
 * All app-wide context providers, composed in one place.
 * Route components should never reach for a provider directly —
 * add it here so every page gets it for free.
 */
export function AppProviders({ children }: { children: ReactNode }) {
	return (
		<QueryClientProvider client={queryClient}>
			<AiGradientDefs />
			<TooltipProvider>
				{children}
				{/* 하단 내비게이션·쪽 넘김 막대 위로 띄워요. */}
				<Toaster position="bottom-center" offset={{ bottom: 96 }} mobileOffset={{ bottom: 96 }} />
			</TooltipProvider>
			{import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
		</QueryClientProvider>
	);
}
