import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { ORPCError, onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { createDb } from "./db";
import { sessions } from "./db/schema";
import { router } from "./router";

// Log server faults only; expected client errors (400/404…) are just responses.
function logServerError(error: unknown) {
	if (error instanceof ORPCError && error.status < 500) return;
	console.error(error);
}

/** Typed RPC endpoint used by apps/web (`/api/rpc/*`). */
const rpcHandler = new RPCHandler(router, {
	interceptors: [onError(logServerError)],
});

/** The same procedures as plain REST + interactive docs at `/api/docs`. */
const openAPIHandler = new OpenAPIHandler(router, {
	interceptors: [onError(logServerError)],
	plugins: [
		new OpenAPIReferencePlugin({
			schemaConverters: [new ZodToJsonSchemaConverter()],
			docsPath: "/docs",
			specGenerateOptions: {
				info: { title: "App API", version: "1.0.0" },
				servers: [{ url: "/api" }],
			},
		}),
	],
});

const app = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

app.use("/api/*", async (c, next) => {
	const db = createDb(c.env.DB);
	const token = getCookie(c, "reading_session");
	const session = token
		? await db.select().from(sessions).where(eq(sessions.id, token)).get()
		: undefined;
	if (session && session.expiresAt > new Date().toISOString()) {
		c.set("userId", session.userId);
	} else {
		const id = crypto.randomUUID();
		const userId = crypto.randomUUID();
		await db
			.insert(sessions)
			.values({ id, userId, expiresAt: new Date(Date.now() + 30 * 86400000).toISOString() });
		setCookie(c, "reading_session", id, {
			httpOnly: true,
			sameSite: "Lax",
			secure: new URL(c.req.url).protocol === "https:",
			path: "/",
			maxAge: 30 * 86400,
		});
		c.set("userId", userId);
	}
	await next();
});

app.use("/api/rpc/*", async (c, next) => {
	const { matched, response } = await rpcHandler.handle(c.req.raw, {
		prefix: "/api/rpc",
		context: {
			db: createDb(c.env.DB),
			userId: c.get("userId"),
			geminiApiKey: (c.env as Env & { GEMINI_API_KEY?: string }).GEMINI_API_KEY,
		},
	});
	if (matched) return c.newResponse(response.body, response);
	await next();
});

app.use("/api/*", async (c, next) => {
	const { matched, response } = await openAPIHandler.handle(c.req.raw, {
		prefix: "/api",
		context: {
			db: createDb(c.env.DB),
			userId: c.get("userId"),
			geminiApiKey: (c.env as Env & { GEMINI_API_KEY?: string }).GEMINI_API_KEY,
		},
	});
	if (matched) return c.newResponse(response.body, response);
	await next();
});

// Workers runtime requires the app as the module's default export.
export default app;
