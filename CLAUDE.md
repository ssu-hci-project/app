# app

A full-stack monorepo starter for building fast (an HCI class project) while
an AI agent does most of the typing. Two ideas drive every choice here:

1. **Don't hand-roll what a library already solved.** Forms, validation,
   toasts, dates, class merging, server-state caching, accessible
   dialogs/dropdowns, typed API calls — all have a library already
   installed. See [`apps/web/LIBRARIES.md`](apps/web/LIBRARIES.md) before
   writing a new utility.
2. **Convention is enforced mechanically, not by memory.** Folder structure
   (Feature-Sliced Design, see [`apps/web/ARCHITECTURE.md`](apps/web/ARCHITECTURE.md)),
   code style (Biome), unused code (knip), types and tests are checked by a
   `pre-commit` hook (`lefthook`) that **blocks the commit** on violation.

## This is a starter, not the product

This repo is the **initial template**. The real app will reshape it: the
sample domain gets deleted, screens and tables get added, apps or packages
may be added, and libraries may be swapped. Read every doc with that in
mind.

| Durable — keep unless deliberately changed | Placeholder — expected to be replaced |
| --- | --- |
| The tooling (Bun, Turborepo, Biome, Steiger, knip, lefthook, Vitest) | The sample `todo` domain, end to end (contract, router, table, test, web slices) |
| Contract-first API (`packages/contract` → `apps/api` → `apps/web`) | The page title `App`, the home screen and its about dialog |
| FSD layering and the lint rules that enforce it | `apps/api/seed.sql` rows and the sample migration |
| One Worker serving the SPA and `/api` | Anything listed as "currently" or "e.g." in a doc |

So:

- **`todo` in a doc is an example of a pattern, not a requirement.** Copy the
  pattern for your own domain; don't keep `todo` around because a doc
  mentions it. When the sample is deleted, point those examples at a real
  slice instead.
- **Trust the code over the docs** for what exists right now. Docs describe
  rules and workflows; file lists in them are illustrative.
- **Keep docs in step with structure.** When you add an app or package,
  delete the sample, swap a library or change a convention, update the
  nearest `CLAUDE.md`/`README.md` in the same commit. If a rule stops
  fitting, change the rule *and* its lint config together rather than
  working around it.
- To turn the template into the real project, follow
  [Starting the real project](#starting-the-real-project) below.

## Layout

```
apps/web/            Vite + React 19 SPA (Stackflow, TanStack Query, shadcn, FSD)
apps/api/            Hono on Cloudflare Workers, oRPC router, Drizzle + D1
packages/contract/   zod schemas + oRPC contract shared by web and api
```

Add more under `apps/*` or `packages/*` as the project needs (workspaces and
Turborepo pick them up automatically); add a `CLAUDE.md` next to each one.

`packages/contract` is the single source of truth for the API. Change a
procedure there and both `apps/api` (implementation) and `apps/web`
(callers) fail typecheck until they match. Each app has its own
`CLAUDE.md` with app-specific rules: [`apps/web/CLAUDE.md`](apps/web/CLAUDE.md),
[`apps/api/CLAUDE.md`](apps/api/CLAUDE.md).

## Stack

Bun workspaces · Turborepo · React 19 · Vite · Stackflow · TanStack Query ·
oRPC · Hono · Cloudflare Workers + D1 · Drizzle ORM · Zustand · Tailwind CSS
v4 · Base UI + shadcn · Biome · Steiger · Knip · Vitest (API tests; web has
none yet) · Lefthook

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

`bun run check` runs the same checks as the pre-commit hook, over the whole
repo instead of staged files. Run it after any
non-trivial change instead of guessing whether it'll pass. Open
`http://localhost:3000/api/docs` during `bun run dev` for interactive API docs.

## Adding a feature end to end

1. **Contract:** add the schema and procedure in `packages/contract/src/` (one file per domain, like the sample `todo.ts`).
2. **DB (if needed):** edit `apps/api/src/db/schema.ts`, then
   `bun run db:generate && bun run db:migrate`.
3. **API:** implement the procedure in `apps/api/src/routers/` and add a test
   in `apps/api/test/`.
4. **Web:** read with `useQuery(orpc.<path>.queryOptions())`, write with
   `useMutation(orpc.<path>.mutationOptions())` inside the matching FSD slice.
5. `bun run check`.

## Starting the real project

Do this once, when the actual app's direction is decided:

1. **Rename** — `name` and `database_name` in `apps/api/wrangler.jsonc` (the
   Worker name becomes the `*.workers.dev` URL), `<title>` in
   `apps/web/index.html`. The `@app/*` package scope can stay.
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
4. **Update the docs** that mention the sample (`grep -ri todo --include=*.md .`).

## More docs

- [`apps/web/ARCHITECTURE.md`](apps/web/ARCHITECTURE.md) — Feature-Sliced Design layers and import rules
- [`apps/web/LIBRARIES.md`](apps/web/LIBRARIES.md) — what's installed vs. add-when-needed
- [`AI_SKILLS.md`](AI_SKILLS.md) — agent skills wired into this repo

## Git hooks

`lefthook` runs on every commit:

- `pre-commit` (parallel): `biome check --write` on staged files (fixes are
  re-staged automatically), typecheck, `steiger`, `knip`, and tests.
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
  the template's pre-installed toolkit (`zustand`, `usehooks-ts`, `es-toolkit`,
  `react-hook-form` + `@hookform/resolvers` + `zod` in web; `@orpc/client`
  for api tests) is listed in `knip.json`'s `ignoreDependencies` so deleting
  the sample doesn't block commits. While the sample still uses some of them,
  knip prints "Remove from ignoreDependencies" configuration hints — that's
  expected, not a failure. Prune that list once you know what the real app
  uses.
