# AI skills wired into this project

Agent guidance that ships with the repo, so every teammate's agent gets the
same help, not just one session's:

- **shadcn**, installed at `.claude/skills/shadcn` (via `skills.sh`,
  `shadcn-ui/ui/skills/shadcn`). It covers component APIs, composition
  patterns, theming and the CLI workflow, and loads automatically when working
  with `components.json` or shadcn components.
- **es-toolkit `recommend`**, installed at `.claude/skills/recommend` (via
  `skills.sh`, `toss/es-toolkit`). It finds the right es-toolkit function for a
  need ("is there already a helper for this?"), which serves the repo's
  "don't hand-roll it" rule. For exact signatures, read the installed typings
  in `apps/web/node_modules/es-toolkit/dist/<category>/<fn>.d.ts`. They carry
  JSDoc and `@example`s and always match the installed version.
- **TanStack Query** is wired via `AGENTS.md`'s `intent-skills` block
  (`@tanstack/intent`), which `CLAUDE.md` imports. Run
  `bunx @tanstack/intent@latest list` to see the available skills and
  `bunx @tanstack/intent@latest load <package>#<skill>` to pull one in before
  touching data-fetching code. The content is versioned against the installed
  package.

Stackflow, oRPC, Hono and Drizzle ship no agent skill in this repo. Their
docs are at https://stackflow.so, https://orpc.dev, https://hono.dev and
https://orm.drizzle.team. Turborepo writes its own guidance block into
`AGENTS.md` (bundled docs matching the installed version).

## About the es-toolkit skill

- **Only `recommend` is kept.** es-toolkit also publishes `guide`
  (install/import setup, already done here) and `migrate` (lodash migration,
  and this repo has no lodash). They were removed because their `docs/` trees
  were identical copies of `recommend`'s.
- **`docs/` is pruned.** `skills.sh --copy` vendors the whole upstream
  VitePress site (~13MB). Only `docs/reference/**` and the few top-level pages
  `SKILL.md` reads are kept. `bunx skills update` re-copies everything, so
  prune again after an update.
- **Step 2 of its workflow is dead here.** It greps `src/{category}/*.ts`,
  es-toolkit's source tree, which isn't vendored. The skill falls back to
  `docs/reference/` (step 4), and the installed `.d.ts` files above are the
  authoritative signature source.
- **Its mentions of `/es-toolkit:migrate` point nowhere.** That skill was
  removed. Lodash isn't used here, so ignore them.
