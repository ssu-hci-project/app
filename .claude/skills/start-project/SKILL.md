---
name: start-project
description: Turn this starter template into the real project — rename, delete the sample todo domain, reset migrations, prune docs. Use once, when the app's direction is decided.
---

# Starting the real project

This repo began as a template. Do this once, when the actual app's direction
is decided.

## What is durable vs. placeholder

| Durable — keep unless deliberately changed | Placeholder — expected to be replaced |
| --- | --- |
| The tooling (Bun, Turborepo, Biome, Steiger, knip, lefthook, Vitest) | The sample `todo` domain, end to end (contract, router, table, test, web slices) |
| Contract-first API (`packages/contract` → `apps/api` → `apps/web`) | The page title `App`, the home screen and its about dialog |
| FSD layering and the lint rules that enforce it | `apps/api/seed.sql` rows and the sample migration |
| One Worker serving the SPA and `/api` | Anything listed as "currently" or "e.g." in a doc |

## Steps

1. **Rename** — `name` and `database_name` in `apps/api/wrangler.jsonc` (the
   Worker name becomes the `*.workers.dev` URL; renaming an already-deployed
   Worker creates a new one), `<title>` in `apps/web/index.html`. The
   `@app/*` package scope can stay.
2. **Remove the sample domain** — `todo` in `packages/contract/src/`,
   `apps/api/src/routers/`, `apps/api/src/router.ts`, `apps/api/src/db/schema.ts`,
   `apps/api/test/`, `apps/api/seed.sql`, and `apps/web/src/{entities,features,widgets}/`;
   then rebuild the home page. `bun run check` (typecheck + knip) lists
   anything left dangling; it passes with the sample fully removed (knip
   only warns about the now-unused `orpc`/`dayjs` exports).
3. **Reset migrations (only before the first deploy)** — delete
   `apps/api/migrations/` and `apps/api/.wrangler/`, define your tables, then
   `bun run db:generate && bun run setup`. After the first deploy, never
   rewrite an applied migration — generate a new one.
4. **Prune `ignoreDependencies`** in `knip.json` — it pre-lists the template's
   toolkit (`zustand`, `usehooks-ts`, `es-toolkit`, `react-hook-form`,
   `@hookform/resolvers`, `zod` in web; `@orpc/client` in api) so deleting the
   sample doesn't block commits. Remove what the real app doesn't use (and
   uninstall it), and entries knip reports as "Remove from ignoreDependencies".
5. **Update the docs** that mention the sample
   (`grep -ri todo --include=*.md .`): point examples at a real slice, and
   drop the "If the sample `todo` domain is still here" sentence from the
   root `AGENTS.md`.
