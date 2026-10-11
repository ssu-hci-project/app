# app

풀스택 모노레포: React 19 + Stackflow SPA(`apps/web`), Cloudflare Workers +
D1 위의 Hono + oRPC API(`apps/api`), 그리고 둘이 공유하는 타입 계약
(`packages/contract`). Bun 워크스페이스 + Turborepo이고, Biome, Steiger, knip,
테스트를 pre-commit 훅이 강제합니다.

## 빠른 시작

```bash
bun run setup   # 설치, 로컬 D1 생성, 데모 데이터 시드
bun run dev     # http://localhost:3000  (API 문서: /api/docs)
```

Cloudflare에 배포(Worker 하나가 앱과 API를 함께 제공):

```bash
bunx wrangler login   # 최초 1회
bun run deploy        # Worker `hci`, D1 `hci-db` (apps/api/wrangler.jsonc)
```

이 저장소는 **초기 템플릿**입니다. `todo` 기능, 페이지 제목, 홈 화면은 교체될
플레이스홀더입니다. 전환 절차는
[`.claude/skills/start-project/SKILL.md`](.claude/skills/start-project/SKILL.md)
(Claude Code에서는 `/start-project`)를 참고하세요. 구조, 명령어, 컨벤션은
[`AGENTS.md`](AGENTS.md)에 있습니다.
