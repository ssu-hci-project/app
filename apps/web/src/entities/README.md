# entities

Business/domain concepts and their canonical shape + CRUD primitives
(`todo`, `user`, `comment`). **No user-interaction or orchestration logic**
here — no forms, no "on submit", no toasts. That's what `features` is for.
An entity answers "what is a Todo and how do I fetch/create one," never
"what happens when the user clicks add."

## Segments

- `model/` — the entity's types, re-exported from `@app/contract` (the
  contract's zod schema is the single source of truth for the shape; don't
  hand-write a duplicate `interface`). Client-only derived types go here too.
- `api/` — TanStack Query read hooks built on `orpc` from `shared/api`, e.g.
  `useQuery(orpc.todo.list.queryOptions())` (see the sample `todo/api/queries.ts`).
  Query keys come from `orpc` (`orpc.<ns>.key()`), so never hand-write one.
- `ui/` — small presentational components that render **one instance** of
  the entity (a card/row, like the sample `todo/ui/todo-item.tsx`). No mutations, no
  forms — purely "given a Todo, render it."

## Import rules

`entities` → may only import from `shared`.
`entities` → may **not** import from another `entities` slice, or from
`features`/`widgets`/`pages`/`app`. If entity A needs entity B's data,
that composition happens one layer up (in a `feature` or `widget`), never
inside the entity itself.

Enforced by `steiger` (`fsd/no-cross-imports`, `fsd/no-higher-level-imports`)
— violations fail `bun run arch:lint` and block the commit.

## Data before the UI exists

There is no mock layer: the API runs locally with seed data
(`apps/api/seed.sql`). Replace the sample rows with your own, then
`bun run db:seed`.

## Naming

Singular noun, kebab-case if multi-word: `todo`, `user-profile`.

## Scaffolding

```bash
bun run new:slice -- --layer=entities --name=user
```
