import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { ORPCError, onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { Hono } from "hono";
import { createDb } from "./db";
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

const app = new Hono<{ Bindings: Env }>();

app.use("/api/rpc/*", async (c, next) => {
	const { matched, response } = await rpcHandler.handle(c.req.raw, {
		prefix: "/api/rpc",
		context: { db: createDb(c.env.DB) },
	});
	if (matched) return c.newResponse(response.body, response);
	await next();
});

app.use("/api/*", async (c, next) => {
	const { matched, response } = await openAPIHandler.handle(c.req.raw, {
		prefix: "/api",
		context: { db: createDb(c.env.DB) },
	});
	if (matched) return c.newResponse(response.body, response);
	await next();
});

// Workers runtime requires the app as the module's default export.
export default app;
