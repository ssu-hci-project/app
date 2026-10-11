# app

AI 에이전트가 코드 대부분을 작성하는 환경에서 빠르게 만들기 위한 풀스택
모노레포 스타터입니다. 모든 선택은 두 가지 원칙을 따릅니다.

1. **라이브러리가 이미 해결한 것은 직접 만들지 않는다.** 폼, 검증, 토스트,
   날짜, 클래스 병합, 서버 상태 캐싱, 접근성 있는 다이얼로그/드롭다운,
   타입이 맞는 API 호출까지 모두 이미 설치된 라이브러리가 있습니다. 새
   유틸리티를 쓰기 전에 [`apps/web/LIBRARIES.md`](apps/web/LIBRARIES.md)를
   확인하세요.
2. **컨벤션은 기억이 아니라 도구로 강제한다.** 폴더 구조(Feature-Sliced
   Design, [`apps/web/ARCHITECTURE.md`](apps/web/ARCHITECTURE.md) 참고), 코드
   스타일(Biome), 미사용 코드(knip), 타입과 테스트를 `pre-commit` 훅
   (`lefthook`)이 검사하고, 위반하면 **커밋이 막힙니다**.

**지금 무엇이 있는지는 문서보다 코드를 믿으세요.** 문서의 파일 목록은
예시입니다. 샘플 `todo` 도메인이 아직 남아 있다면 따라 할 패턴일 뿐 유지할
대상이 아닙니다. 템플릿을 실제 프로젝트로 바꿀 때는
[`.claude/skills/start-project/SKILL.md`](.claude/skills/start-project/SKILL.md)
(Claude Code에서는 `/start-project`)를 따르세요.

**문서는 구조와 함께 갱신합니다.** 앱이나 패키지를 추가하거나, 라이브러리를
바꾸거나, 컨벤션을 바꾸면 가장 가까운 `AGENTS.md`/`README.md`를 같은 커밋에서
고치세요. 규칙이 맞지 않게 되면 우회하지 말고 규칙과 lint 설정을 함께
바꾸세요.

## 구조

```
apps/web/            Vite + React 19 SPA (Stackflow, TanStack Query, shadcn, FSD)
apps/api/            Cloudflare Workers 위의 Hono, oRPC 라우터, Drizzle + D1
packages/contract/   web과 api가 공유하는 zod 스키마 + oRPC 계약
```

필요하면 `apps/*`나 `packages/*` 아래에 추가하세요(워크스페이스와 Turborepo가
자동으로 인식합니다). 각각 옆에 `AGENTS.md`를 두고, `CLAUDE.md`에는
`@AGENTS.md` 한 줄만 넣습니다.

`packages/contract`가 API의 단일 출처입니다. 여기서 프로시저를 바꾸면
`apps/api`(구현)와 `apps/web`(호출부) 모두 맞출 때까지 타입체크가 실패합니다.
앱별 규칙: [`apps/web/AGENTS.md`](apps/web/AGENTS.md),
[`apps/api/AGENTS.md`](apps/api/AGENTS.md).

## 명령어 (저장소 루트에서 실행)

```bash
bun run setup        # 최초 1회: 설치 + 로컬 DB 마이그레이션 + 시드 데이터
bun run dev          # web :3000, api :8787 (web이 /api를 api로 프록시)
bun run check        # lint + typecheck + arch:lint + test + knip. 완료라고 말하기 전에 실행
bun run build        # web 빌드 후, 그것을 포함한 api dry-run 번들
bun run deploy       # build → wrangler deploy → 원격 D1 마이그레이션 (`wrangler login` 필요)
bun run lint:fix     # 포맷/import 순서 자동 수정
bun run db:generate  # apps/api/src/db/schema.ts 변경으로부터 SQL 마이그레이션 생성
bun run db:migrate   # 로컬 D1에 마이그레이션 적용
bun run db:seed      # 로컬 D1에 데모 데이터 (재)삽입
bun run new:slice -- --layer=<entities|features|widgets|pages> --name=<kebab-case | group/name>
```

`bun run check`는 pre-commit 훅과 같은 검사를 저장소 전체에 대해 실행합니다.
통과할지 추측하지 말고, 사소하지 않은 변경 후에는 실행하세요. `bun run dev`
중에는 `http://localhost:3000/api/docs`에서 대화형 API 문서를 볼 수 있습니다.

## 기능을 0 to 1으로

1. **계약:** `packages/contract/src/`에 스키마와 프로시저를 추가합니다(도메인당 파일 하나).
2. **DB(필요하면)와 API:** `apps/api`에서 프로시저와 테스트를 구현합니다.
   절차는 [`apps/api/AGENTS.md`](apps/api/AGENTS.md#규칙)를 참고하세요.
3. **Web:** 해당 FSD 슬라이스 안에서 읽기는 `useQuery(orpc.<path>.queryOptions())`,
   쓰기는 `useMutation(orpc.<path>.mutationOptions())`로 합니다.
4. `bun run check`.

## Git 훅

`lefthook`이 커밋마다 실행됩니다.

- `pre-commit`: `bun run check`와 같은 검사입니다. 단, Biome은 스테이징된
  파일에 `--write`로 실행되고 수정분을 다시 스테이징합니다(`lefthook.yml` 참고).
- `commit-msg`: 첫 줄은 `type: 설명` 형식이어야 합니다(Conventional Commits,
  예: `feat: 로그인 화면 추가`).

훅이 실패하면 보고된 문제를 고치고 다시 커밋하세요. `--no-verify`로 우회하지
마세요.

## 알아둘 lint 규칙

- `apps/*/src/**`와 `packages/*/src/**`는 **named export만** 쓰고
  (`noDefaultExport`) **파일명은 kebab-case**입니다. 유일한 예외는 Workers
  런타임이 default export를 요구하는 `apps/api/src/index.ts`입니다.
- `knip`은 미사용 파일과 의존성이 있으면 실패합니다. 미사용 export는 경고일
  뿐이고, "Remove from ignoreDependencies" 설정 힌트도 실패가 아닙니다.

## 더 볼 문서

- [`apps/web/ARCHITECTURE.md`](apps/web/ARCHITECTURE.md): Feature-Sliced Design 레이어와 import 규칙
- [`apps/web/LIBRARIES.md`](apps/web/LIBRARIES.md): 설치된 것과 필요할 때 추가할 것
- [`AI_SKILLS.md`](AI_SKILLS.md): 이 저장소에 연결된 에이전트 스킬
