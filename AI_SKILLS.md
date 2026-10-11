# 이 저장소에 연결된 AI 스킬

저장소와 함께 배포되는 에이전트 가이드입니다. 한 세션만이 아니라 모든 팀원의
에이전트가 같은 도움을 받습니다.

- **shadcn**: `.claude/skills/shadcn`에 설치(`skills.sh`,
  `shadcn-ui/ui/skills/shadcn`). 컴포넌트 API, 조합 패턴, 테마, CLI 워크플로를
  다루고, `components.json`이나 shadcn 컴포넌트를 다룰 때 자동으로 로드됩니다.
- **es-toolkit `recommend`**: `.claude/skills/recommend`에 설치(`skills.sh`,
  `toss/es-toolkit`). 필요에 맞는 es-toolkit 함수를 찾아줍니다("이미 있는
  헬퍼인가?"). 저장소의 "직접 만들지 않는다" 원칙을 돕습니다. 정확한 시그니처는
  [`apps/web/LIBRARIES.md`](apps/web/LIBRARIES.md)의 es-toolkit 행을 참고하세요.
- **TanStack Query** 스킬은 `@tanstack/intent`로 필요할 때만 씁니다(자동 로드
  안 됨): `bunx @tanstack/intent@latest list` 후
  `bunx @tanstack/intent@latest load <package>#<skill>`. 내용은 설치된 패키지
  버전에 맞춰져 있습니다.
- **start-project**: `.claude/skills/start-project`. 템플릿을 실제 프로젝트로
  바꾸는 일회성 절차입니다.

Stackflow, oRPC, Hono, Drizzle은 이 저장소에 에이전트 스킬이 없습니다. 문서는
https://stackflow.so, https://orpc.dev, https://hono.dev,
https://orm.drizzle.team 에 있습니다. Turborepo가 `AGENTS.md`에 자동으로 쓰는
블록은 꺼져 있고(`turbo.json`의 `agentGuidance: false`), 버전에 맞는 문서는
`node_modules/turbo/docs/`에 있습니다.

## es-toolkit 스킬에 대해

- **`recommend`만 남겼습니다.** es-toolkit은 `guide`(설치/import 설정, 여기선
  이미 완료)와 `migrate`(lodash 마이그레이션, 이 저장소엔 lodash 없음)도
  배포하지만, 그 `docs/` 트리가 `recommend`의 것과 동일한 복사본이라
  제거했습니다.
- **`docs/`는 가지치기했습니다.** `skills.sh --copy`는 업스트림 VitePress
  사이트 전체(약 13MB)를 가져옵니다. `docs/reference/**`와 `SKILL.md`가 읽는
  최상위 페이지 몇 개만 남겼습니다. `bunx skills update`는 전부 다시 복사하므로
  업데이트 후에는 다시 정리하세요.
- **워크플로의 2단계는 여기서 동작하지 않습니다.** es-toolkit 소스 트리인
  `src/{category}/*.ts`를 grep하는데, 소스는 가져오지 않았습니다. 스킬은
  `docs/reference/`(4단계)로 넘어가고, 시그니처의 기준은 설치된 `.d.ts`
  파일입니다.
- **`/es-toolkit:migrate` 언급은 연결된 곳이 없습니다.** 해당 스킬은
  제거했습니다. lodash를 쓰지 않으므로 무시하세요.
