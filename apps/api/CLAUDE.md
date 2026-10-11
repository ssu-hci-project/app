# apps/api

Hono on Cloudflare Workers. Every endpoint is an oRPC procedure implementing
`@app/contract`, served twice from the same router:

- `/api/rpc/*` — typed RPC, what `apps/web` calls
- `/api/*` — the same procedures as REST (paths from the contract's
  `.route()`), with interactive docs at `/api/docs`

## Layout

Roles, not an inventory — files under `routers/` and `test/` change with the
domain (the template ships a sample `todo` namespace to copy, then delete).

```
src/index.ts         Hono app + RPC/OpenAPI handlers (default export for Workers)
src/orpc.ts          `os` — the contract-bound builder + request Context (db)
src/router.ts        root router, one key per contract namespace
src/routers/<ns>.ts  one file per contract namespace
src/db/schema.ts     Drizzle tables — the DB source of truth
migrations/          generated SQL (drizzle-kit), applied by wrangler
seed.sql             local demo rows (INSERT OR IGNORE) — replace with your own
test/<ns>.test.ts    Vitest running inside workerd against a fresh D1
```

When the app needs more than one binding (KV, R2, a queue, a secret) or more
request context (e.g. the current user once auth exists), add it to
`wrangler.jsonc` / `Context` in `src/orpc.ts` and note it here.

## Rules

- **Contract first.** Never add a route straight to Hono. Add the procedure
  to `packages/contract`, then implement it with `os.<namespace>.<name>.handler(...)`.
  The handler's input/output types come from the contract.
- **Errors:** declare expected failures on the contract (`.errors({ NOT_FOUND: ... })`)
  and throw them with `errors.NOT_FOUND()`. Plain `throw new Error()` becomes
  a 500 and is logged.
- **DB changes:** edit `src/db/schema.ts` → `bun run db:generate` → review the
  SQL in `migrations/` → `bun run db:migrate`. Never edit an applied migration;
  generate a new one.
- **Bindings:** after changing `wrangler.jsonc`, run `bun run cf-typegen` to
  regenerate `worker-configuration.d.ts` (the global `Env` type). Don't
  hand-edit that file.
- **Tests:** add a test in `test/` for each new procedure, calling it through
  the typed oRPC client the way the sample test does. Each run gets a fresh
  D1 with all migrations applied.
- Local D1 state lives in `.wrangler/` (gitignored). Delete it to reset, then
  `bun run db:migrate && bun run db:seed` from the root.
