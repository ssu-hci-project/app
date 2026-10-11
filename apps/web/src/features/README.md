# features

슬라이스당 사용자 **행동** 하나입니다(`todo/add`, `like-post`,
`auth-by-email`). 행동을 일으키는 폼/버튼, 그 mutation, 부수 효과(토스트,
화면 이동)를 담습니다.

## 세그먼트

- `ui/`: 상호작용 컴포넌트(보통 폼이나 버튼).
- `model/`: mutation과 부수 효과를 감싼 훅(샘플
  `todo/add/model/use-create-todo.ts` 참고). mutation 후 캐시 갱신은 전역에서
  처리하므로 여기서 invalidate하지 않습니다(`apps/web/AGENTS.md` 참고).
- `api/`: 엔티티가 제공하지 않는 요청이 필요할 때만. 그 외에는 엔티티의
  `api/`를 재사용합니다.
