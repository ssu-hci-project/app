# widgets

Large, self-contained, composite UI blocks that combine multiple
`features`/`entities` into one reusable section (a full navbar, a dashboard
panel, the `todo-board` in this template). The point of pulling something
out as a widget is the **isolation boundary**, not raw reuse count — a
widget used on a single page today is still worth it if it bundles enough
moving parts to deserve its own name and folder.

## Segments

- `ui/` — the composed component.
- `model/` — only if the widget needs to coordinate state across the
  features/entities it renders (e.g. syncing a filter between a list and a
  form). Most widgets won't need this.

## Import rules

`widgets` → may import from `features`, `entities`, `shared`.
`widgets` → may **not** import from another `widgets` slice, from `pages`,
or from `app`.

Enforced by `steiger` (`fsd/no-cross-imports`, `fsd/no-higher-level-imports`)
— violations fail `bun run arch:lint` and block the commit.

## Naming

kebab-case, named for what it is, not the page it happens to live on right
now: `todo-board`, not `home-page-section`.
