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
- 로컬 D1 상태는 `.wrangler/`(gitignore 대상)에 있습니다. 초기화하려면 삭제한
  뒤 루트에서 `bun run db:migrate && bun run db:seed`를 실행하세요.
- `/api/*`는 서버가 발급한 `reading_session` HttpOnly 쿠키로 익명 사용자를 식별합니다. 세션은 30일 만료이며 HTTPS에서는 Secure를 사용합니다. 클라이언트가 작성자 ID를 입력하지 않고 서버 Context의 `userId`로 책갈피·답변 작성자와 독서 상태를 저장합니다. 기존 작성자 없는 기록은 공용 이전 기록으로 유지합니다.
- `reading.getBook`은 개인별 현재 페이지를 반환하고 `saveProgress`는 페이지와 마지막 열람 시점을 저장합니다. 세션 쿠키를 삭제하거나 다른 브라우저를 사용하면 새 사용자로 시작합니다.
- `reading.listRecent`는 내가 연 책을 마지막 열람 순으로 현재 쪽·아직 참여 중인 마지막 모임과 함께 돌려줍니다. `reading.pageNoteCount`는 한 쪽에 남은 다른 독자의 기록 수만 돌려주고 본문은 보내지 않습니다(모임 지정 시 멤버십 확인).
- 새 기록은 `notes.create`와 기존 `reading.createBookmark` 모두 비공개로 저장합니다. `notes` 라우터가 본인 기록 목록·수정·삭제·공개 범위를 관리하고, 모임 공유·조회는 서버에서 멤버십과 같은 책·판본인지 확인합니다. 기존 기록은 `legacy` 공개 상태로 보존하며 작성자 없는 기록을 임의 소유자로 연결하지 않습니다.
- `groups` 라우터는 초대 미리보기·명시적 가입·탈퇴를 분리합니다. 새 초대 코드는 헷갈리는 문자(0/O, 1/I/L)를 뺀 8자 대문자이고 대소문자 구분 없이 찾습니다. 예전 UUID 코드도 계속 유효합니다. 탈퇴하면 해당 모임에 공유한 본인 기록은 비공개가 됩니다. 공유 이벤트와 기록 변경은 D1 batch로 함께 반영합니다.
- 읽음 상태는 기록별 공유 버전으로 관리합니다. 모임 페이지 요청만으로 읽음 처리하지 않으며, 웹은 열린 시트에서 실제 보인 기록만 `markSeen`으로 확인합니다. 이전 버전의 확인 요청은 새 버전을 소비하지 않습니다.
- AI 질문 생성은 Gemini API를 사용합니다. 로컬 `apps/api/.dev.vars`에
  `GEMINI_API_KEY`를 설정하고, 배포 시 Workers secret으로 등록하세요. 키가 없거나
  생성이 실패하면 기본 질문을 반환합니다. 무료 티어에는 테스트용 데이터만 쓰세요.
- 앱 안 본문은 `book_pages`에 고정 쪽으로 저장합니다. 쪽은 `src/lib/paginate.ts`(문단 우선, 약 600자)로 한 번만 나누고, 시드와 `reading.createBook({ text })`가 같은 함수를 씁니다. 쪽 나누기를 바꾸면 기존 기록의 쪽 번호가 어긋나므로, 이미 쓰인 작품은 다시 나누지 마세요.
- 작품을 추가할 때는 저자 사망 후 보호기간이 끝난 원작만 넣고(번역본 제외), 출처 URL과 이용 조건을 `books/<id>.json`에 남깁니다.
- `reading.generateQuestions`는 클라이언트가 보낸 맥락을 받지 않습니다. 서버가 `src/lib/question-context.ts`로 현재 쪽과 직전 쪽 끝부분, 고른 구절만 묶어 보냅니다. 다음 쪽 본문이나 개인 기록을 넣지 마세요.
