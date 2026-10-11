# apps/web

Vite + React 19 SPA, structured with Feature-Sliced Design: layers and
import rules in [`ARCHITECTURE.md`](ARCHITECTURE.md), segments in each
layer's `README.md`. Check [`LIBRARIES.md`](LIBRARIES.md) before writing a
helper.

- **Screens** are Stackflow activities built as `pages` slices and registered
  in `src/app/stackflow/` (see `src/app/README.md`).
- **Data** comes from the API through `orpc` in `src/shared/api`:
  `useQuery(orpc.<ns>.<proc>.queryOptions())`,
  `useMutation(orpc.<ns>.<proc>.mutationOptions(...))`. Don't invalidate in
  mutation hooks: the `MutationCache` in `shared/api/query-client.ts` refetches
  all active queries after every mutation. For instant feedback use an
  optimistic update (see `features/todo/toggle/model/use-toggle-todo.ts`).
  Types come from `@app/contract`. Never `fetch` the API by hand.
- **Forms** validate with the contract's schema (`todoSchema.pick(...)`), not
  a hand-copied zod schema, so the form and the API can't disagree. Put
  user-facing messages on the contract schema.
- **Colors** use theme tokens (`text-muted-foreground`, `text-destructive`,
  `border-input`, `bg-primary`…), never raw palette classes like
  `text-slate-400`, so light/dark themes stay correct.
- **UI** primitives live in `src/shared/ui` (shadcn on Base UI). Add more
  with `bunx shadcn@latest add <component>` from this directory;
  `components.json` already points it at `shared/ui` and `shared/lib`.
- `/api` is proxied to the API during `bun run dev`, and served by the same
  Worker in production, so there is no API base URL to configure.
