import type { Contract } from "@app/contract";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

// Same-origin in both dev (Vite proxies /api to wrangler) and production
// (one Worker serves the app and the API), so no base URL to configure.
const link = new RPCLink({ url: `${window.location.origin}/api/rpc` });

/** Typed API client — call procedures directly when needed. */
export const client: ContractRouterClient<Contract> = createORPCClient(link);

/**
 * TanStack Query helpers for every procedure:
 * `useQuery(orpc.reading.listBooks.queryOptions())` and the corresponding
 * mutation options provide typed access and query keys.
 * Invalidation after mutations is global (see `query-client.ts`).
 */
export const orpc = createTanstackQueryUtils(client);
