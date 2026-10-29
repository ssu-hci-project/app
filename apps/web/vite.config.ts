import path from "node:path";
import { seedDesignPlugin } from "@seed-design/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react(), tailwindcss(), seedDesignPlugin({ colorMode: "light-only" })],
	resolve: {
		conditions: ["seed-layered", "module", "browser", "development|production"],
		alias: {
			"@": path.resolve(import.meta.dirname, "./src"),
		},
	},
	server: {
		port: 3000,
		// apps/api runs on wrangler dev (8787); same-origin /api in dev and prod.
		proxy: {
			"/api": "http://localhost:8787",
		},
	},
});
