# app

A full-stack monorepo starter for building fast while an AI agent does most
of the typing. Two ideas drive every choice here:

1. **Don't hand-roll what a library already solved.** Forms, validation,
   toasts, dates, class merging, server-state caching, accessible
   dialogs/dropdowns, typed API calls — all have a library already
   installed. See [`apps/web/LIBRARIES.md`](apps/web/LIBRARIES.md) before
   writing a new utility.
2. **Convention is enforced mechanically, not by memory.** Folder structure
   (Feature-Sliced Design, see [`apps/web/ARCHITECTURE.md`](apps/web/ARCHITECTURE.md)),
   code style (Biome), unused code (knip), types and tests are checked by a
   `pre-commit` hook (`lefthook`) that **blocks the commit** on violation.

**Trust the code over the docs** for what exists right now; file lists in
docs are illustrative. If the sample `todo` domain is still here, it is a
pattern to copy, not a requirement — to turn the template into a real
project, follow [`.claude/skills/start-project/SKILL.md`](.claude/skills/start-project/SKILL.md)
(`/start-project` in Claude Code).

**Keep docs in step with structure.** When you add an app or package, swap a
library or change a convention, update the nearest `AGENTS.md`/`README.md` in
the same commit. If a rule stops fitting, change the rule *and* its lint
config together rather than working around it.

## Layout

```
apps/web/            Vite + React 19 SPA (Stackflow, TanStack Query, shadcn, FSD)
apps/api/            Hono on Cloudflare Workers, oRPC router, Drizzle + D1
packages/contract/   zod schemas + oRPC contract shared by web and api
```

Add more under `apps/*` or `packages/*` as needed (workspaces and Turborepo
pick them up automatically), with an `AGENTS.md` next to each one and a
`CLAUDE.md` containing just `@AGENTS.md`.

`packages/contract` is the single source of truth for the API. Change a
procedure there and both `apps/api` (implementation) and `apps/web`
(callers) fail typecheck until they match. App-specific rules:
[`apps/web/AGENTS.md`](apps/web/AGENTS.md), [`apps/api/AGENTS.md`](apps/api/AGENTS.md).

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

`bun run check` runs the same checks as the pre-commit hook over the whole
repo. Run it after any non-trivial change instead of guessing whether it'll
pass. Open `http://localhost:3000/api/docs` during `bun run dev` for
interactive API docs.

## Adding a feature end to end

1. **Contract:** add the schema and procedure in `packages/contract/src/` (one file per domain).
2. **DB (if needed)** and **API:** implement the procedure and its test in
   `apps/api` — workflow in [`apps/api/AGENTS.md`](apps/api/AGENTS.md#rules).
4. **Web:** read with `useQuery(orpc.<path>.queryOptions())`, write with
   `useMutation(orpc.<path>.mutationOptions())` inside the matching FSD slice.
5. `bun run check`.

## Git hooks

`lefthook` runs on every commit:

- `pre-commit`: the same checks as `bun run check`, except Biome runs with
  `--write` on staged files and re-stages its fixes (see `lefthook.yml`).
- `commit-msg`: the first line must be `type: 설명` (Conventional Commits,
  e.g. `feat: 로그인 화면 추가`).

If a hook fails, fix the reported issue and recommit — don't bypass with
`--no-verify`.

## Lint rules worth knowing

- `apps/*/src/**` and `packages/*/src/**` use **named exports only**
  (`noDefaultExport`) and **kebab-case file names**. The one exception is
  `apps/api/src/index.ts`, which the Workers runtime needs as a default export.
- `knip` fails on unused files and dependencies; unused exports are only
  warnings, and its "Remove from ignoreDependencies" configuration hints are
  not failures.

## More docs

- [`apps/web/ARCHITECTURE.md`](apps/web/ARCHITECTURE.md) — Feature-Sliced Design layers and import rules
- [`apps/web/LIBRARIES.md`](apps/web/LIBRARIES.md) — what's installed vs. add-when-needed
- [`AI_SKILLS.md`](AI_SKILLS.md) — agent skills wired into this repo
