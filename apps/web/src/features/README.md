# features

One user-facing **action** per slice — a verb, not a noun
(`add-todo`, `like-post`, `auth-by-email`). A feature wraps an entity's data
operation with everything needed to actually perform it from the UI: the
form/button, the mutation hook, and the side effects (toast, redirect,
cache invalidation).

## Segments

- `ui/` — the interactive component (usually a form or a button).
- `model/` — the hook orchestrating the mutation/query + side effects
  (see `add-todo/model/use-create-todo.ts` for the pattern: mutate →
  invalidate the entity's query key → toast).
- `api/` — only if this feature needs a request the entity doesn't already
  expose. Default to reusing the entity's `api/`; don't duplicate a fetch
  call here.

## Import rules

`features` → may import from `entities`, `shared`.
`features` → may **not** import from another `features` slice. If two
features need to share logic, that logic belongs in the `entities` layer
(if it's data-shaped) or `shared` (if it's generic) — not copy-pasted, and
not imported feature-to-feature.
`features` → may **not** import `widgets`, `pages`, or `app`.

Enforced by `steiger` (`fsd/no-cross-imports`, `fsd/no-higher-level-imports`)
— violations fail `bun run arch:lint` and block the commit.

## Naming

`<verb>-<noun>` kebab-case: `add-todo`, `delete-todo`, `toggle-completed`.

## Scaffolding

```bash
bun run new:slice -- --layer=features --name=delete-todo
```
generates the segment folders + `index.ts` for you — don't hand-type the
boilerplate.
