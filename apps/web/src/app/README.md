# app

App-wide bootstrap. **No business logic, no reusable UI components** — a
component belongs in `pages` or `widgets`.

## Segments

- `stackflow/` — screen navigation ([Stackflow](https://stackflow.so)):
  `config.ts` lists every activity (name, URL, params), `stack.tsx` maps each
  name to a page component and sets up the plugins (`basic-ui` for the app
  bar and transitions, `history-sync` so each screen has a URL). Wiring only:
  no JSX beyond the component map, no data fetching.
- `providers/` — every app-wide context provider, composed once in
  `AppProviders`. A new global provider (theme, auth…) goes here, not into
  pages.
- `styles/` — the single Tailwind entry (`@import "tailwindcss"` + `@theme`)
  and any true global CSS.
