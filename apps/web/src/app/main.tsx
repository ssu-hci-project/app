import "@/app/styles/index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppProviders } from "@/app/providers";
import { Stack } from "@/app/stackflow";

const rootElement = document.getElementById("root");
if (!rootElement) {
	throw new Error("Root element #root not found in index.html");
}

createRoot(rootElement).render(
	<StrictMode>
		<div
			id="app-frame"
			className="relative isolate mx-auto h-dvh w-full max-w-[430px] overflow-clip bg-background [transform:translateZ(0)] sm:shadow-xl"
		>
			<AppProviders>
				<Stack />
			</AppProviders>
		</div>
	</StrictMode>,
);
