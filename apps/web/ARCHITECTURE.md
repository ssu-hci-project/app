# Architecture: Feature-Sliced Design

| Layer | Holds | May import | Slice naming |
| --- | --- | --- | --- |
| `app/` | bootstrap: Stackflow, providers, global styles — no business logic | everything below | — (segments only) |
| `pages/` | one slice per screen; composes the layers below | widgets, features, entities, shared | screen name: `home`, `todo-detail` |
| `widgets/` | large composed UI blocks (several features/entities together) | features, entities, shared | what it is, not where it lives: `todo-board` |
| `features/` | one user action per slice | entities, shared | verb: `like-post`, or grouped by entity: `todo/add` |
| `entities/` | domain data: types, read queries, one-instance UI | shared | singular noun: `todo`, `user-profile` |
| `shared/` | business-agnostic primitives (ui kit, API client, `cn`) | its own segments | — (segments only) |

- Layers only import **downward**, and slices in the same layer never import
  each other. Shared logic moves down a layer (`entities` if data-shaped,
  `shared` if generic).
- Import a slice only through its `index.ts` public API.
- Names are kebab-case. When several features act on the same entity, group
  them (`todo/add`, `todo/delete`): Steiger's `fsd/repetitive-naming` rejects
  `add-todo` + `delete-todo` side by side.

`bun run arch:lint` (Steiger) enforces these rules and fails the commit on
a violation. Each layer's `README.md` covers only its segments and
layer-specific conventions.

Scaffold slices with the generator instead of creating folders by hand:

```bash
bun run new:slice -- --layer=features --name=todo/archive
```
