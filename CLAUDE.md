# app

A full-stack monorepo for building fast (an HCI class project) while an AI
agent does most of the typing. Two ideas drive every choice here:

1. **Don't hand-roll what a library already solved.** Forms, validation,
   toasts, dates, class merging, server-state caching, accessible
   dialogs/dropdowns, typed API calls — all have a library already
   installed. See [`apps/web/LIBRARIES.md`](apps/web/LIBRARIES.md) before
   writing a new utility.
2. **Convention is enforced mechanically, not by memory.** Folder structure
   (Feature-Sliced Design, see [`apps/web/ARCHITECTURE.md`](apps/web/ARCHITECTURE.md)),
   code style (Biome), unused code (knip), types and tests are checked by a
   `pre-commit` hook (`lefthook`) that **blocks the commit** on violation.

## Layout

```
apps/web/            Vite + React 19 SPA (Stackflow, TanStack Query, shadcn, FSD)
apps/api/            Hono on Cloudflare Workers, oRPC router, Drizzle + D1
packages/contract/   zod schemas + oRPC contract shared by web and api
```

`packages/contract` is the single source of truth for the API. Change a
procedure there and both `apps/api` (implementation) and `apps/web`
(callers) fail typecheck until they match. Each app has its own
`CLAUDE.md` with app-specific rules: [`apps/web/CLAUDE.md`](apps/web/CLAUDE.md),
[`apps/api/CLAUDE.md`](apps/api/CLAUDE.md).

## Stack

Bun workspaces · Turborepo · React 19 · Vite · Stackflow · TanStack Query ·
oRPC · Hono · Cloudflare Workers + D1 · Drizzle ORM · Zustand · Tailwind CSS
v4 · Base UI + shadcn · Biome · Steiger · Knip · Vitest · Lefthook

## Commands (run from the repo root)

```bash
bun run setup        # first time: install + local DB migrations + seed data
bun run dev          # web on :3000, api on :8787 (web proxies /api to it)
bun run check        # lint + typecheck + arch:lint + test + knip — run before saying you're done
bun run build        # web build, then api dry-run bundle that includes it
bun run deploy       # build → wrangler deploy → remote D1 migrations (needs `wrangler login`)
bun run lint:fix     # auto-fix formatting/import order
bun run db:generate  # SQL migration from apps/api/src/db/schema.ts changes
bun run db:migrate   # apply migrations to the local D1
bun run db:seed      # (re)insert demo rows into the local D1
bun run new:slice -- --layer=<entities|features|widgets|pages> --name=<kebab-case | group/name>
```

`bun run check` mirrors what the pre-commit hook runs. Run it after any
non-trivial change instead of guessing whether it'll pass. Open
`http://localhost:3000/api/docs` during `bun run dev` for interactive API docs.

## Adding a feature end to end

1. **Contract:** add the schema and procedure in `packages/contract/src/`.
2. **DB (if needed):** edit `apps/api/src/db/schema.ts`, then
   `bun run db:generate && bun run db:migrate`.
3. **API:** implement the procedure in `apps/api/src/routers/` and add a test
   in `apps/api/test/`.
4. **Web:** read with `useQuery(orpc.<path>.queryOptions())`, write with
   `useMutation(orpc.<path>.mutationOptions())` inside the matching FSD slice.
5. `bun run check`.

## More docs

- [`apps/web/ARCHITECTURE.md`](apps/web/ARCHITECTURE.md) — Feature-Sliced Design layers and import rules
- [`apps/web/LIBRARIES.md`](apps/web/LIBRARIES.md) — what's installed vs. add-when-needed
- [`AI_SKILLS.md`](AI_SKILLS.md) — agent skills wired into this repo

## Git hooks

`lefthook` runs on every commit:

- `pre-commit` (parallel): `biome check --write` on staged files (fixes are
  re-staged automatically), typecheck, `steiger`, and `knip`.
- `commit-msg`: the first line must be `type: 설명` (Conventional Commits,
  e.g. `feat: 로그인 화면 추가`).

If a hook fails, fix the reported issue and recommit — don't bypass with
`--no-verify`.

## Lint rules worth knowing

- `apps/*/src/**` and `packages/*/src/**` use **named exports only**
  (`noDefaultExport`) and **kebab-case file names**. The one exception is
  `apps/api/src/index.ts`, which the Workers runtime needs as a default export.
- `knip` fails on unused files and dependencies; unused exports are warnings.
  `apps/web/src/shared/ui/**` (the shadcn kit) is exempt from export checks, and
  `zustand`/`usehooks-ts`/`es-toolkit` are kept installed on purpose.
