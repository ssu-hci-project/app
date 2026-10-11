# apps/web

Vite + React 19 SPA, structured with Feature-Sliced Design. Read
[`ARCHITECTURE.md`](ARCHITECTURE.md) and the `README.md` of the layer you
are touching before adding files; reach for [`LIBRARIES.md`](LIBRARIES.md)
before writing a helper.

- **Screens** are Stackflow activities: register them in
  `src/app/stackflow/config.ts` + `stack.tsx`, build them as `pages` slices
  (see `src/pages/README.md`). Navigate with `useFlow().push(...)`.
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
  with `bunx shadcn@latest add <component>` from this directory.
- `/api` is proxied to the API during `bun run dev`, and served by the same
  Worker in production, so there is no API base URL to configure.

The template ships a sample `todo` stack (`entities/todo`, `features/todo/*`,
`widgets/todo-board`, used by `pages/home`) as a working example of every
layer. Copy its shape for real features, then delete it; the layer READMEs
cite it only as an example.
