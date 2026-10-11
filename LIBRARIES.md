# Reach for a library before writing a helper

| Need                                     | Use                                                    |
| ----------------------------------------- | -------------------------------------------------------- |
| forms + validation                        | `react-hook-form` + `zod` (`@hookform/resolvers/zod`)   |
| server state (fetch/cache/mutate)         | `@tanstack/react-query` — never `useEffect` + `useState` for a fetch |
| client/UI state                           | `zustand`                                                |
| HTTP                                      | `axios` via `shared/api`'s `apiClient` — never a new `axios.create()` per feature |
| toasts                                    | `sonner`'s `toast(...)` — `<Toaster />` is already mounted in `app/providers` |
| dates                                     | `dayjs` (`shared/lib/dayjs.ts`, `relativeTime` + `ko` locale already configured) |
| conditional/merged Tailwind classes       | `cn()` (`shared/lib/cn.ts` — clsx + tailwind-merge)      |
| Tailwind style variants (button size/variant, etc.) | `class-variance-authority`                    |
| debounce/throttle, groupBy/pick/omit, etc. | `es-toolkit`                                            |
| common hooks (useLocalStorage, useDebounce, useMediaQuery, useClickOutside) | `usehooks-ts`                     |
| accessible dialog/dropdown/tooltip/select/etc.        | `bunx shadcn@latest add <component>` — generates into `shared/ui`, built on Base UI. Never hand-roll a focus-trapped modal or a custom dropdown |
| icons                                     | `lucide-react` (already shadcn's own default)            |
| env vars                                  | `shared/config/env.ts` — add to the zod schema before reading a new `VITE_*` var anywhere |

If you're about to write a `debounce`, a manual fetch-loading-error
`useState` trio, a custom toast component, a hand-rolled classname
concatenation, or your own accessible modal/dropdown — stop, one of the
above already does it.

## Add when actually needed (not installed by default)

| Need                       | Use                    | Notes |
|----------------------------| ------------------------ | ------- |
| animation/transitions      | `motion` (ex-framer-motion) | heavier than a hackathon usually needs — reach for it only when a feature genuinely needs layout/gesture animation ||
| date picker UI             | `react-day-picker` v9   | pair with `react-hook-form` via `Controller`; pulls in `date-fns` alongside our `dayjs`, that's fine |
| drag-and-drop reordering   | `@dnd-kit/react`        | accessible by default |
| data table                 | `@tanstack/react-table` | fits the existing TanStack ecosystem |
| long list virtualization   | `@tanstack/react-virtual` | only once a list is actually long |
| command palette (⌘K)       | `cmdk`                  | still the dominant choice as of 2026 |
