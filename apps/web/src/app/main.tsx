import "@stackflow/plugin-basic-ui/index.css";
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
		<AppProviders>
			<Stack />
		</AppProviders>
	</StrictMode>,
);
