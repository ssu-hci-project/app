import { env } from "cloudflare:workers";
import type { Contract } from "@app/contract";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";
import app from "../src/index";

/** A typed client with its own session cookie, like one browser. */
export function createReader(
	overrides: Partial<Cloudflare.Env & { GEMINI_API_KEY: string }> = {},
): ContractRouterClient<Contract> {
	let cookie = "";
	return createORPCClient(
		new RPCLink({
			url: "http://test.local/api/rpc",
			fetch: async (request) => {
				const next = new Request(request);
				if (cookie) next.headers.set("cookie", cookie);
				const response = await app.fetch(next, { ...env, ...overrides });
				cookie = response.headers.get("set-cookie")?.split(";")[0] ?? cookie;
				return response;
			},
		}),
	);
}
