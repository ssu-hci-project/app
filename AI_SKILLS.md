# AI skills wired into this project

Three libraries in this stack ship official, actively-maintained agent skills
— all are installed project-locally so any teammate cloning the repo gets
the same guidance, not just this session:

- **shadcn** — installed at `.claude/skills/shadcn` (via `skills.sh`,
  `shadcn-ui/ui/skills/shadcn`). Covers correct component APIs, composition
  patterns, theming, and the CLI workflow. Loads automatically when working
  with `components.json` / shadcn components.
- **es-toolkit** — installed at `.claude/skills/{guide,migrate,recommend}`
  (via `skills.sh`, `toss/es-toolkit`). Covers API usage/import patterns, Lodash
  migration, and function recommendations. Official LLM documentation is also
  available at `https://es-toolkit.dev/llms-full.txt`.
- **TanStack Query** — wired via `AGENTS.md`'s `intent-skills` block
  (`@tanstack/intent`). Run `bunx @tanstack/intent@latest list` to see
  available skills and `bunx @tanstack/intent@latest load <package>#<skill>`
  to pull one in before touching data-fetching code — the content is
  versioned against the installed package, so it won't go stale like
  memorized API knowledge.

Stackflow ships no agent skill; its docs are at https://stackflow.so.

No other library in this stack publishes an official skill as of this writing
— don't assume one exists just because it shows up as available in a given
session; that may just be a skill built into the coding agent itself, not
something this repo ships.

## es-toolkit skills: pruned `docs/`

`skills.sh --copy` vendors each es-toolkit skill's *entire* upstream
VitePress docs site (multi-locale pages, `.vitepress` build config, images,
etc.) — as installed, `guide`/`migrate`/`recommend` were ~13MB each and
100% identical to one another. Each `SKILL.md` only actually reads a
handful of files, so `docs/` in each of the three has been pruned down to
just that (see each `SKILL.md`'s `Workflow`/`Search local docs` section for
the current list — e.g. `usage.md`, `intro.md`, `bundle-size.md`,
`performance.md`, `reference/**`), bringing the three skills to ~1MB each.

Two things to know if you touch these again:

- **`bunx skills update` will re-bloat.** It re-copies the full upstream
  `docs/` tree, wiping this pruning. Re-run the prune (keep only the files
  each `SKILL.md` actually references) after any update.
- **A few `SKILL.md` references are already dead upstream**, independent of
  this pruning: `benchmarks/`, `src/{category}/*.ts` (strict) and
  `src/compat/{category}/*.ts` (compat), and `docs/compatibility.md` (the
  real file is `docs/compat/intro.md`, but `migrate/SKILL.md` names the
  wrong path). Not fixed here — restoring them would mean vendoring the
  library's full source tree, which reintroduces the bloat this cleanup
  removes. The skills still work without them; those steps just silently
  find nothing.
