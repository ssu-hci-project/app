# entities

Domain concepts: their shape, read queries and one-instance UI. An entity
answers "what is a Todo and how do I fetch it", never "what happens when the
user clicks add" — no forms, submit handlers or toasts (that's `features`).

## Segments

- `model/` — the entity's types, re-exported from `@app/contract` (never a
  hand-written duplicate `interface`). Client-only derived types go here too.
- `api/` — TanStack Query read hooks on `orpc` (see the sample
  `todo/api/queries.ts`). Query keys come from `orpc`, never by hand.
- `ui/` — presentational components for **one instance** (a card/row, like the
  sample `todo/ui/todo-item.tsx`). No mutations.

There is no mock layer: the API runs locally with seed data
(`apps/api/seed.sql`).
