import { defineConfig } from "drizzle-kit";

// Only used to generate SQL migrations from src/db/schema.ts.
// Applying them is wrangler's job (`bun run db:migrate`).
export default defineConfig({
	dialect: "sqlite",
	schema: "./src/db/schema.ts",
	out: "./migrations",
});
