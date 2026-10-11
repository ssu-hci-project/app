# features

One user-facing **action** per slice (`todo/add`, `like-post`,
`auth-by-email`): the form/button that triggers it, its mutation, and its
side effects (toast, navigation).

## Segments

- `ui/` — the interactive component (usually a form or a button).
- `model/` — the hook wrapping the mutation + side effects (see the sample
  `todo/add/model/use-create-todo.ts`). Cache refresh after a mutation is
  global, so don't invalidate here — see `apps/web/AGENTS.md`.
- `api/` — only for a request the entity doesn't already expose; otherwise
  reuse the entity's `api/`.
