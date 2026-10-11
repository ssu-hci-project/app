# app

App-wide bootstrap: entrypoint, Stackflow wiring, global providers, global styles.
**No business logic. No reusable UI components.** If you're tempted to write a
component here, it belongs in `pages` or `widgets` instead.

## Segments

- `stackflow/` — screen navigation ([Stackflow](https://stackflow.so)).
  `config.ts` lists every activity (screen) with its name, URL and params;
  `stack.tsx` maps each name to a page component and sets up the plugins
  (`basic-ui` for the app bar and iOS-style transitions, `history-sync` so
  each screen has a URL). Adding a screen means one entry in each of those
  two files, plus a `pages` slice. Keep this folder as wiring only: no JSX
  beyond the component map, no data fetching.
- `providers/` — every app-wide context provider composed in one place
  (`AppProviders`). A new global provider (theme, auth context, etc.) gets
  added here, once, not sprinkled across pages.
- `styles/` — the single Tailwind entry (`@import "tailwindcss"` + `@theme`)
  and any true global CSS.

## Import rules

`app` may import from `pages`, `widgets`, `features`, `entities`, `shared`.
**Nothing may import from `app`** — it's the top of the stack, nothing sits
above it.
