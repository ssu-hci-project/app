# shared

Business-agnostic building blocks. If it needs to know what a "Todo" or a
"User" is, it belongs in `entities` or `features`. No slices, only segments,
which may import each other.

## Segments

- `ui/` — UI primitives with zero domain knowledge: shadcn components on
  Base UI (`Dialog`, `DropdownMenu`, `Tooltip`…) plus hand-written ones
  (`ui/button.tsx` is the pattern for a primitive not in the shadcn
  registry). Base UI composes via a `render` prop, not Radix's `asChild`:
  `<DialogTrigger render={<Button variant="ghost" />}>`.
- `api/` — the typed oRPC `client`, its TanStack Query helpers `orpc`, and the
  single `queryClient`.
- `lib/` — small pure helpers (`cn`, configured `dayjs`). Check
  [`LIBRARIES.md`](../../LIBRARIES.md) before adding one; export new ones from
  `lib/index.ts`.
- `config/`, `hooks/` — not present yet. Create them only when needed
  (`config/env.ts` for env vars, see `LIBRARIES.md`; `hooks/` is also where
  shadcn drops hooks its components need).
