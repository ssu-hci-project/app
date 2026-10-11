# pages

One slice per screen (Stackflow activity), mostly layout and composition,
not logic. Only `app/stackflow/stack.tsx` imports a page.

## Segments

- `ui/` — the page component (e.g. `ui/home-page.tsx`). Type it as
  `ActivityComponentType<"HomePage">` and wrap the content in `<AppScreen>`
  from `@stackflow/plugin-basic-ui` (app bar and transitions). Navigate with
  `useFlow()` from `@stackflow/react`: `push("TodoDetailPage", { id })`,
  `pop()`.
- `model/` — only for page-local state that belongs to no single
  widget/feature. Rare.

The activity name is the PascalCase component name (`TodoDetailPage`). If
two pages need the same block, make it a `widgets` slice.
