# app

A frontend template built for building fast during a hackathon while an AI
agent does most of the typing. Two ideas drive every choice here:

1. **Don't hand-roll what a library already solved.** Every "usually
   reimplemented per project" concern (forms, validation, toasts, date
   formatting, class merging, HTTP, server-state caching, accessible
   dialogs/dropdowns) has a library already installed — see
   [`LIBRARIES.md`](LIBRARIES.md) before writing a new utility.
2. **Convention is enforced mechanically, not by memory.** Folder structure
   (Feature-Sliced Design, see [`ARCHITECTURE.md`](ARCHITECTURE.md)) and
   code style (Biome) are checked by a `pre-commit` hook (`lefthook`) that
   **blocks the commit** on violation. You don't need to remember the
   rules — if you get them wrong, the commit simply won't go through and
   will tell you why.

## Stack

Bun · Vite (Rolldown) · React 19 · Stackflow (screen stack + URL sync) · TanStack
Query · Zustand · Tailwind CSS v4 · Base UI + shadcn CLI · lucide-react ·
Biome · Steiger (FSD architecture lint) · Knip (unused files/deps) · Lefthook (git hooks)

## Commands

```bash
bun run dev          # start dev server
bun run build         # tsc -b && vite build
bun run check          # lint + typecheck + arch:lint + knip — run this before saying you're done
bun run lint:fix        # auto-fix formatting/import order
bun run new:slice -- --layer=<entities|features|widgets|pages> --name=<kebab-case>
```

`bun run check` is the single command that mirrors what the pre-commit hook
runs. Run it after any non-trivial change instead of guessing whether it'll
pass.

## More docs

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — Feature-Sliced Design layers, import
  rules, and the scaffolding generator
- [`LIBRARIES.md`](LIBRARIES.md) — what's already installed vs. add-when-needed
- [`AI_SKILLS.md`](AI_SKILLS.md) — official agent skills wired into this repo
  (shadcn, es-toolkit, TanStack) and what's deliberately *not* configured (MCP)

## Git hooks

`lefthook` runs on every commit:

- `pre-commit` (parallel): `biome check --write` on staged files (fixes are
  re-staged automatically), `tsc -b`, `steiger`, and `knip`.
- `commit-msg`: the first line must be `type: 설명` (Conventional Commits,
  e.g. `feat: 로그인 화면 추가`).

If a hook fails, fix the reported issue and recommit — don't bypass with
`--no-verify`.

## Lint rules worth knowing

- `src/**` uses **named exports only** (`noDefaultExport`) and **kebab-case
  file names** (`useFilenamingConvention`).
- `knip` fails on unused files and dependencies; unused exports are warnings.
  `src/shared/ui/**` (the shadcn kit) is exempt from export checks, and
  `zustand`/`usehooks-ts` are kept installed on purpose (see `LIBRARIES.md`).
