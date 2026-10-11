# Architecture: Feature-Sliced Design

```
src/
  app/       bootstrap: Stackflow, providers, global styles — no business logic
  pages/     one slice per route, composes widgets+features+entities
  widgets/   large composed UI blocks (multiple features/entities combined)
  features/  one user action per slice, verb-named (todo/add, like-post)
  entities/  domain data + CRUD (todo, user) — no interaction logic
  shared/    generic, business-agnostic primitives (ui kit, API client, cn)
```

**Every directory has its own `README.md` — read it before adding a file to
that layer.** It covers that layer's segments, import rules, and naming
convention in more depth than this file does. Start here:
[`src/app/README.md`](src/app/README.md) ·
[`src/pages/README.md`](src/pages/README.md) ·
[`src/widgets/README.md`](src/widgets/README.md) ·
[`src/features/README.md`](src/features/README.md) ·
[`src/entities/README.md`](src/entities/README.md) ·
[`src/shared/README.md`](src/shared/README.md)

The short version of the import rule: layers only import **downward**
(`app → pages → widgets → features → entities → shared`), and slices
within the same layer never import each other. This is not just a
convention — `bun run arch:lint` (Steiger) checks it and fails the commit
if it's violated. The template's sample `todo` stack (`src/entities/todo/`,
`src/features/todo/`, `src/widgets/todo-board/`, `src/pages/home/`) shows the
whole stack wired together — copy that pattern for a new slice, and delete the
sample once real features exist.

**Always scaffold new slices with the generator, don't hand-create
folders:**
```bash
bun run new:slice -- --layer=features --name=todo/archive
```
