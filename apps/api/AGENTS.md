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
books/               앱에서 읽는 저작권 만료 작품: <id>.txt(원문) + <id>.json(출처, 이용 조건)
scripts/build-seed.ts books/로 seed.sql을 생성 (`bun run seed:build`)
seed.sql             생성 파일. 직접 고치지 말고 books/를 바꾼 뒤 다시 생성
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
- 배포 계정은 `wrangler.jsonc`의 `account_id`(chili.tomat0@icloud.com 계정)와 D1 `database_id`로 고정합니다. 다른 계정으로 `wrangler login`하면 배포가 권한 오류로 멈추고 새 Worker나 빈 DB를 만들지 않습니다. 배포하려면 그 계정의 Cloudflare Members로 초대받으세요.
- 로컬 D1 상태는 `.wrangler/`(gitignore 대상)에 있습니다. 초기화하려면 삭제한
  뒤 루트에서 `bun run db:migrate && bun run db:seed`를 실행하세요.
- **교환독서 모델**(`profile`·`libraries`·`books`·`saved`·`progress`·`reads`·`traces`·`reactions`·`questions`):
  흔적은 서재(`libraries`) 안에서만 보입니다. 서재 단위 프로시저는 `libraryId`를 받고
  `routers/access.ts`의 `requireMember`/`requireBook`으로 멤버십과 책 공개 범위를 확인합니다.
  `books.library_id`가 null이면 모든 서재가 함께 읽는 퍼블릭 도메인 책입니다.
- 본문은 `book_chapters` + `book_paragraphs`(장·문단)에 저장합니다. 흔적은 (장, 문단, 글자 범위)로
  위치를 가리키므로 이미 쓰인 책의 문단을 다시 나누지 마세요. 시드 문단은 `src/lib/paragraphs.ts`의
  `splitParagraphs`로 만들고, 장 구분이 없는 작품은 책 제목을 단 1장입니다.
- 전자책 올리기는 `books.uploadBegin` → `uploadChunk`(장 단위 문단 배열, 요청당 6만 자 이하) →
  `uploadFinish`입니다. 끝나기 전 책은 `status = uploading`으로 숨깁니다. 파싱은 웹에서 합니다.
- `libraries.list`가 처음 불릴 때 개인 서재 `나의 서재`를 만들고, 시드의 샘플 서재(`src/lib/sample.ts`)
  흔적을 복사해 기본 책에 다른 독자의 흔적이 보이게 합니다. 샘플 서재에는 참여할 수 없습니다.
- `questions.generate`는 장 제목, 고른 구절, 구절 앞뒤 장 본문(최대 3500자,
  `passageContext`)만 Gemini에 보냅니다. 다른 독자의 흔적은 보내지 않고, 실패하면 기본 질문 6개 중 3개를 돌려줍니다.
- 마이그레이션 `0009_exchange_reading`이 모임을 서재로(같은 id·초대 코드), 600자 쪽을 문단으로,
  개인·모임 쪽 기록과 질문 답을 그 쪽 첫 문단 첫 문장의 메모/질문 흔적으로 옮깁니다. `legacy` 공개 기록은 옮기지 않습니다.
- `/api/*`는 서버가 발급한 `reading_session` HttpOnly 쿠키로 익명 사용자를 식별합니다. 세션은 30일 만료이며 HTTPS에서는 Secure를 사용합니다. 클라이언트가 작성자 ID를 입력하지 않고 서버 Context의 `userId`로 책갈피·답변 작성자와 독서 상태를 저장합니다. 기존 작성자 없는 기록은 공용 이전 기록으로 유지합니다.
- 책 API와 타입은 `books`/`Book` 하나만 사용합니다. 구형 `reading`·`notes`·`groups` API와
  `LegacyBook`은 제거했습니다. 진도는 `progress`, 기록은 `traces`, 모임은 `libraries`를 사용합니다.
- 구형 테이블(`book_pages`, `bookmarks`, `reading_progress` 등)과 `books.page_count`는
  데이터 보관과 마이그레이션을 위해 남겨 두며 런타임에서 읽거나 쓰지 않습니다.
  마이그레이션 0009가 기존 데이터를 옮기고, 0010은 이후 생성된 구형 책의 본문을
  장·문단으로 옮깁니다. 기존 장·문단의 위치와 보관된 원본 기록은 바꾸지 않습니다.
- AI 질문 생성은 Gemini API를 사용합니다. 로컬 `apps/api/.dev.vars`에
  `GEMINI_API_KEY`를 설정하고, 배포 시 Workers secret으로 등록하세요. 키가 없거나
  생성이 실패하면 기본 질문을 반환합니다. 무료 티어에는 테스트용 데이터만 쓰세요.
- 작품을 추가할 때는 저자 사망 후 보호기간이 끝난 원작만 넣고(번역본 제외), 출처 URL과 이용 조건을 `books/<id>.json`에 남깁니다.
- Worker는 `wrangler.jsonc`의 `placement.region`으로 서울(`gcp:asia-northeast3`)에 고정합니다. Gemini가 일부 지역의 호출을 400 "User location is not supported"로 거절하기 때문이고, D1 기본 위치(ICN)와도 가깝습니다. 지우면 AI 질문이 간헐적으로 기본 질문으로 대체됩니다.

- `books.listPage`는 서재 가시성과 내 서재/담은 책/올린 책 필터를 서버에서 적용하고,
  `(createdAt, id)` 내림차순 커서로 최대 40권(기본 20권)을 반환합니다. 같은 시각의 책이나
  이전 페이지 삭제·새 책 추가가 있어도 다음 페이지에 중복되지 않습니다.
- `books.search`는 책 결과와 흔적 검색 결과에 필요한 책 제목을 반환하므로 웹이 전체 책 목록을 미리 받을 필요가 없습니다.
  D1의 바인딩 제한을 넘지 않도록 책 메타 집계와 작성자 조회는 나누고, 검색은 서브쿼리로 범위를 제한합니다.
