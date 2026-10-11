# widgets

Large, self-contained blocks that combine several `features`/`entities` into
one section (a navbar, a dashboard panel, the sample `todo-board`). The point
is the **isolation boundary**, not reuse count — a widget used on one page is
still worth it if it bundles enough moving parts.

## Segments

- `ui/` — the composed component.
- `model/` — only to coordinate state across what it renders (e.g. a filter
  shared by a list and a form). Most widgets don't need it.
