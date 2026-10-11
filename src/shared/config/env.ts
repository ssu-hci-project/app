import { z } from "zod";

const envSchema = z.object({
	VITE_API_BASE_URL: z.string().url().default("http://localhost:8787"),
	// Env vars are always strings, so a plain z.coerce.boolean() would treat
	// the string "false" as truthy — enum + transform avoids that footgun.
	VITE_USE_MOCK: z
		.enum(["true", "false"])
		.default("false")
		.transform((v) => v === "true"),
});

/** Validated env vars. Throws at startup if `.env` is missing or malformed. */
export const env = envSchema.parse(import.meta.env);
