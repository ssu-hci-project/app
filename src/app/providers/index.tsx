import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { queryClient } from "@/shared/api";
import { TooltipProvider } from "@/shared/ui";

/**
 * All app-wide context providers, composed in one place.
 * Route components should never reach for a provider directly —
 * add it here so every page gets it for free.
 */
export function AppProviders({ children }: { children: ReactNode }) {
	return (
		<QueryClientProvider client={queryClient}>
			<TooltipProvider>
				{children}
				<Toaster richColors position="top-center" />
			</TooltipProvider>
			{import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
		</QueryClientProvider>
	);
}
