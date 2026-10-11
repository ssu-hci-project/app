# entities

Business/domain concepts and their canonical shape + CRUD primitives
(`todo`, `user`, `comment`). **No user-interaction or orchestration logic**
here — no forms, no "on submit", no toasts. That's what `features` is for.
An entity answers "what is a Todo and how do I fetch/create one," never
"what happens when the user clicks add."

## Segments

- `model/` — the zod schema + inferred TS type. The schema is the single
  source of truth for the shape; don't hand-write a duplicate `interface`
  next to it.
- `api/` — raw `axios` calls through `shared/api`'s `apiClient`, plus the
  TanStack Query hooks and the query-key factory (see `todo/api/queries.ts`
  for the `todoKeys` pattern — always centralize keys here, never inline a
  query key at the call site).
- `ui/` — small presentational components that render **one instance** of
  the entity (a card/row, like `todo/ui/todo-item.tsx`). No mutations, no
  forms — purely "given a Todo, render it."

## Import rules

`entities` → may only import from `shared`.
`entities` → may **not** import from another `entities` slice, or from
`features`/`widgets`/`pages`/`app`. If entity A needs entity B's data,
that composition happens one layer up (in a `feature` or `widget`), never
inside the entity itself.

Enforced by `steiger` (`fsd/no-cross-imports`, `fsd/no-higher-level-imports`)
— violations fail `bun run arch:lint` and block the commit.

## Mocking before the backend exists

Set `VITE_USE_MOCK=true` in `.env` to serve an entity from an in-memory
mock instead of a real request — useful before the backend is ready, or as
a demo-day fallback if it goes down. See `todo/api/mock.ts` +
the `if (env.VITE_USE_MOCK)` branch in `todo/api/todo-api.ts` for the
pattern: keep the mock in its own `mock.ts` next to the real calls, gate
each function on the flag, return data shaped exactly like the real
response. Copy this file-for-file into a new entity rather than inventing
a different mocking approach per entity.

## Naming

Singular noun, kebab-case if multi-word: `todo`, `user-profile`.

## Scaffolding

```bash
bun run new:slice -- --layer=entities --name=user
```
