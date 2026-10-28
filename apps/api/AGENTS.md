# apps/api

Cloudflare Workers 위의 Hono입니다. 모든 엔드포인트는 `@app/contract`를
구현한 oRPC 프로시저이고, 같은 라우터가 두 방식으로 제공됩니다.

- `/api/rpc/*`: 타입이 있는 RPC. `apps/web`이 호출하는 쪽
- `/api/*`: 같은 프로시저를 REST로(경로는 계약의 `.route()`에서), 대화형
  문서는 `/api/docs`

## 구조

파일 목록이 아니라 역할입니다. `routers/`와 `test/` 아래 파일은 도메인에 따라
바뀝니다.

```
src/index.ts         Hono 앱 + RPC/OpenAPI 핸들러 (Workers용 default export)
src/orpc.ts          `os`: 계약에 묶인 빌더 + 요청 Context (db)
src/router.ts        루트 라우터, 계약 네임스페이스당 키 하나
src/routers/<ns>.ts  계약 네임스페이스당 파일 하나
src/db/schema.ts     Drizzle 테이블, DB의 단일 출처
migrations/          생성된 SQL (drizzle-kit), wrangler가 적용
seed.sql             로컬 데모 데이터 (INSERT OR IGNORE), 직접 바꿔 쓰세요
test/<ns>.test.ts    새 D1에 대해 workerd 안에서 실행되는 Vitest
```

바인딩(KV, R2, 큐, 시크릿)이나 요청 컨텍스트(예: 인증 도입 후 현재 사용자)가
더 필요해지면 `wrangler.jsonc` / `src/orpc.ts`의 `Context`에 추가하고 여기에
적어두세요.

## 규칙

- **계약 우선.** Hono에 라우트를 직접 추가하지 마세요. `packages/contract`에
  프로시저를 추가한 뒤 `os.<namespace>.<name>.handler(...)`로 구현합니다.
  핸들러의 입출력 타입은 계약에서 옵니다.
- **에러:** 예상되는 실패는 계약에 선언하고(`.errors({ NOT_FOUND: ... })`)
  `errors.NOT_FOUND()`로 던집니다. 그냥 `throw new Error()`는 500이 되고
  로그에 남습니다.
- **DB 변경:** `src/db/schema.ts` 수정 → `bun run db:generate` →
  `migrations/`의 SQL 검토 → `bun run db:migrate`. 이미 적용된 마이그레이션은
  절대 수정하지 말고 새로 생성하세요.
- **바인딩:** `wrangler.jsonc`를 바꾼 뒤에는 `bun run cf-typegen`으로
  `worker-configuration.d.ts`(전역 `Env` 타입)를 다시 생성합니다. 이 파일은
  직접 수정하지 마세요.
- **테스트:** 새 프로시저마다 `test/`에 테스트를 추가하고, 기존 테스트처럼
  타입이 있는 oRPC 클라이언트로 호출합니다. 실행마다 모든 마이그레이션이
  적용된 새 D1을 받습니다.
- 로컬 D1 상태는 `.wrangler/`(gitignore 대상)에 있습니다. 초기화하려면 삭제한
  뒤 루트에서 `bun run db:migrate && bun run db:seed`를 실행하세요.
- AI 질문 생성은 Gemini API를 사용합니다. 로컬 `apps/api/.dev.vars`에
  `GEMINI_API_KEY`를 설정하고, 배포 시 Workers secret으로 등록하세요. 키가 없거나
  생성이 실패하면 기본 질문을 반환합니다. 무료 티어에는 테스트용 데이터만 쓰세요.
