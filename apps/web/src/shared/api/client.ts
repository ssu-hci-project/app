import type { Contract } from "@app/contract";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

// Same-origin in both dev (Vite proxies /api to wrangler) and production
// (one Worker serves the app and the API), so no base URL to configure.
let sessionReady: Promise<void> | undefined;
const link = new RPCLink({
	url: `${window.location.origin}/api/rpc`,
	fetch: async (request, init) => {
		// Bootstrap one HttpOnly cookie before parallel queries can create separate readers.
		sessionReady ??= fetch("/api/session")
			.then((response) => {
				if (!response.ok) throw new Error("세션을 시작하지 못했어요");
			})
			.catch((error) => {
				sessionReady = undefined;
				throw error;
			});
		await sessionReady;
		return fetch(request, init);
	},
});

/** Typed API client — call procedures directly when needed. */
export const client: ContractRouterClient<Contract> = createORPCClient(link);

/**
 * TanStack Query helpers for every procedure:
 * `useQuery(orpc.reading.listBooks.queryOptions())` and the corresponding
 * mutation options provide typed access and query keys.
 * Invalidation after mutations is global (see `query-client.ts`).
 */
export const orpc = createTanstackQueryUtils(client);
