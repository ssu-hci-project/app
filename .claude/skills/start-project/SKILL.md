---
name: start-project
description: 이 스타터 템플릿을 실제 프로젝트로 전환한다. 이름 변경, 샘플 todo 도메인 삭제, 마이그레이션 초기화, 문서 정리. 앱 방향이 정해졌을 때 한 번 사용.
---

# 실제 프로젝트 시작하기

이 저장소는 템플릿에서 출발했습니다. 실제 앱의 방향이 정해졌을 때 한 번
진행하세요.

## 유지할 것과 교체할 것

| 유지 (의도적으로 바꾸지 않는 한 그대로) | 플레이스홀더 (교체 예정) |
| --- | --- |
| 툴링 (Bun, Turborepo, Biome, Steiger, knip, lefthook, Vitest) | 샘플 `todo` 도메인 전체 (계약, 라우터, 테이블, 테스트, web 슬라이스) |
| 계약 우선 API (`packages/contract` → `apps/api` → `apps/web`) | 페이지 제목 `App`, 홈 화면과 소개 다이얼로그 |
| FSD 레이어와 이를 강제하는 lint 규칙 | `apps/api/seed.sql` 데이터와 샘플 마이그레이션 |
| SPA와 `/api`를 함께 제공하는 Worker 하나 | 문서에서 "현재" 또는 "예:"로 소개된 모든 것 |

## 절차

1. **이름 변경**: `apps/api/wrangler.jsonc`의 `name`과 `database_name`(Worker
   이름이 `*.workers.dev` URL이 되고, 이미 배포된 Worker의 이름을 바꾸면 새
   Worker가 생깁니다), `apps/web/index.html`의 `<title>`. `@app/*` 패키지
   스코프는 그대로 둬도 됩니다.
2. **샘플 도메인 삭제**: `packages/contract/src/`, `apps/api/src/routers/`,
   `apps/api/src/router.ts`, `apps/api/src/db/schema.ts`, `apps/api/test/`,
   `apps/api/seed.sql`, `apps/web/src/{entities,features,widgets}/`의 `todo`를
   지운 뒤 홈 페이지를 다시 만듭니다. `bun run check`(typecheck + knip)가 남은
   잔재를 알려줍니다. 샘플을 모두 지워도 통과합니다(knip은 쓰이지 않게 된
   `orpc`/`dayjs` export에 대해 경고만 합니다).
3. **마이그레이션 초기화 (첫 배포 전에만)**: `apps/api/migrations/`와
   `apps/api/.wrangler/`를 삭제하고 테이블을 정의한 뒤
   `bun run db:generate && bun run setup`. 첫 배포 이후에는 적용된
   마이그레이션을 절대 다시 쓰지 말고 새로 생성하세요.
4. **`ignoreDependencies` 정리**: `knip.json`에는 샘플을 지워도 커밋이 막히지
   않도록 템플릿 툴킷(web의 `zustand`, `usehooks-ts`, `es-toolkit`,
   `react-hook-form`, `@hookform/resolvers`, `zod`; api의 `@orpc/client`)이
   미리 등록돼 있습니다. 실제 앱이 쓰지 않는 것은 제거(및 패키지 삭제)하고,
   knip이 "Remove from ignoreDependencies"로 알려주는 항목도 지우세요.
5. **문서 갱신**: 샘플을 언급하는 문서(`grep -ri todo --include=*.md .`)에서
   예시를 실제 슬라이스로 바꾸고, 루트 `AGENTS.md`의 "샘플 `todo` 도메인이 아직
   남아 있다면" 문장을 지우세요.
