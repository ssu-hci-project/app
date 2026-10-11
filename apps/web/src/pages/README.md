# pages

One slice per screen (Stackflow activity). A page **composes** `widgets` +
`features` + `entities` into what actually renders for that screen — it should mostly be
layout and composition, not logic.

## Segments

- `ui/` — the page component (e.g. `ui/home-page.tsx`). Type it as
  `ActivityComponentType<"HomePage">` and wrap the content in `<AppScreen>`
  from `@stackflow/plugin-basic-ui` (gives the app bar and transitions).
  Navigate with `useFlow()` from `@stackflow/react`:
  `push("TodoDetailPage", { id })`, `pop()`.
- `model/` — only if the page itself needs local state that doesn't belong
  to any single widget/feature it renders. Rare — most pages don't need this
  segment at all.

## Import rules

`pages` → may import from `widgets`, `features`, `entities`, `shared`.
`pages` → may **not** import from another `pages` slice (each page is
isolated — if two pages need the same block, that block is a `widgets`
slice, not a shared page import) or from `app`.

Enforced by `steiger`'s `fsd/no-cross-imports` and
`fsd/no-higher-level-imports` rules — a violation fails `bun run arch:lint`
and blocks the commit.

## Naming

kebab-case, named for the screen: `home`, `todo-detail`, `settings`. The
activity name is the PascalCase component name (`TodoDetailPage`). Public
API is the slice's `index.ts` — only `app/stackflow/stack.tsx` should ever
import a page, and always through that
`index.ts`, never by reaching into `pages/home/ui/home-page.tsx` directly.
