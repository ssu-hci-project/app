# apps/web

Vite + React 19 SPA, structured with Feature-Sliced Design. Read
[`ARCHITECTURE.md`](ARCHITECTURE.md) and the `README.md` of the layer you
are touching before adding files; reach for [`LIBRARIES.md`](LIBRARIES.md)
before writing a helper.

- **Screens** are Stackflow activities: register them in
  `src/app/stackflow/config.ts` + `stack.tsx`, build them as `pages` slices
  (see `src/pages/README.md`). Navigate with `useFlow().push(...)`.
- **Data** comes from the API through `orpc` in `src/shared/api`:
  `useQuery(orpc.todo.list.queryOptions())`,
  `useMutation(orpc.todo.create.mutationOptions(...))`, and invalidate with
  `queryClient.invalidateQueries({ queryKey: orpc.todo.key() })`. Types come
  from `@app/contract`. Never `fetch` the API by hand.
- **UI** primitives live in `src/shared/ui` (shadcn on Base UI). Add more
  with `bunx shadcn@latest add <component>` from this directory.
- `/api` is proxied to the API during `bun run dev`, and served by the same
  Worker in production, so there is no API base URL to configure.
