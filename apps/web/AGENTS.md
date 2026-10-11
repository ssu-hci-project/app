# apps/web

Feature-Sliced Design으로 구성한 Vite + React 19 SPA입니다. 레이어와 import
규칙은 [`ARCHITECTURE.md`](ARCHITECTURE.md), 세그먼트는 각 레이어의
`README.md`에 있습니다. 헬퍼를 쓰기 전에 [`LIBRARIES.md`](LIBRARIES.md)를
확인하세요.

- **화면**은 Stackflow 액티비티입니다. `pages` 슬라이스로 만들고
  `src/app/stackflow/`에 등록합니다(`src/app/README.md` 참고).
- **데이터**는 `src/shared/api`의 `orpc`로 API에서 가져옵니다:
  `useQuery(orpc.<ns>.<proc>.queryOptions())`,
  `useMutation(orpc.<ns>.<proc>.mutationOptions(...))`. mutation 훅에서
  invalidate하지 마세요. `shared/api/query-client.ts`의 `MutationCache`가
  mutation이 끝날 때마다 활성 쿼리를 모두 다시 가져옵니다. 즉각적인 반응이
  필요하면 낙관적 업데이트를 쓰세요(`features/todo/toggle/model/use-toggle-todo.ts`
  참고). 타입은 `@app/contract`에서 옵니다. API를 직접 `fetch`하지 마세요.
- **폼**은 손으로 복사한 zod 스키마가 아니라 계약의 스키마
  (`todoSchema.pick(...)`)로 검증합니다. 그래야 폼과 API가 어긋나지 않습니다.
  사용자에게 보이는 메시지는 계약 스키마에 둡니다.
- **색상**은 테마 토큰(`text-muted-foreground`, `text-destructive`,
  `border-input`, `bg-primary`…)을 쓰고, `text-slate-400` 같은 원시 팔레트
  클래스는 쓰지 않습니다. 그래야 라이트/다크 테마가 유지됩니다.
- **UI** 프리미티브는 `src/shared/ui`(Base UI 기반 shadcn)에 있습니다. 이
  디렉터리에서 `bunx shadcn@latest add <component>`로 추가하세요.
  `components.json`이 이미 `shared/ui`와 `shared/lib`를 가리킵니다.
- `/api`는 `bun run dev` 중에는 API로 프록시되고, 프로덕션에서는 같은 Worker가
  제공하므로 API base URL을 설정할 필요가 없습니다.
