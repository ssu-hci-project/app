# app

Full-stack monorepo: React 19 + Stackflow SPA (`apps/web`), Hono + oRPC API
on Cloudflare Workers with D1 (`apps/api`), and a shared typed contract
(`packages/contract`). Bun workspaces + Turborepo, with Biome, Steiger, knip
and tests enforced by a pre-commit hook.

## Quick start

```bash
bun run setup   # install, create the local D1, seed demo data
bun run dev     # http://localhost:3000  (API docs: /api/docs)
```

Deploy to Cloudflare (one Worker serves both the app and the API):

```bash
bunx wrangler login   # once
bun run deploy
```

This is an **initial template**: the `todo` feature, the names (`app`,
`app-db`) and the home screen are placeholders meant to be replaced. See
[Starting the real project](CLAUDE.md#starting-the-real-project) in
[`CLAUDE.md`](CLAUDE.md), which also covers the layout, commands and
conventions.
