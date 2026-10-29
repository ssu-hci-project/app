import { env } from "cloudflare:workers";
import type { Contract } from "@app/contract";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";
import app from "../src/index";

export function createReader(): ContractRouterClient<Contract> {
	let cookie = "";
	return createORPCClient(
		new RPCLink({
			url: "http://test.local/api/rpc",
			fetch: async (request) => {
				const next = new Request(request);
				if (cookie) next.headers.set("cookie", cookie);
				const response = await app.fetch(next, env);
				cookie = response.headers.get("set-cookie")?.split(";")[0] ?? cookie;
				return response;
			},
		}),
	);
}
