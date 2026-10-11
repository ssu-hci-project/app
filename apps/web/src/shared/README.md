# shared

비즈니스와 무관한 구성 요소입니다. "Todo"나 "User"가 무엇인지 알아야 한다면
`entities`나 `features`에 속합니다. 슬라이스 없이 세그먼트만 있고, 세그먼트끼리는
서로 import할 수 있습니다.

## 세그먼트

- `ui/`: 도메인 지식이 없는 UI 프리미티브. Base UI 기반 shadcn 컴포넌트
  (`Dialog`, `DropdownMenu`, `Tooltip`…)와 직접 쓴 컴포넌트(shadcn 레지스트리에
  없는 프리미티브는 `ui/button.tsx` 패턴을 따름). Base UI는 Radix의 `asChild`가
  아니라 `render` prop으로 조합합니다:
  `<DialogTrigger render={<Button variant="ghost" />}>`.
- `api/`: 타입이 있는 oRPC `client`, 그 TanStack Query 헬퍼 `orpc`, 그리고
  단일 `queryClient`.
- `lib/`: 작은 순수 헬퍼(`cn`, 설정된 `dayjs`). 추가하기 전에
  [`LIBRARIES.md`](../../LIBRARIES.md)를 확인하고, 새 헬퍼는 `lib/index.ts`에서
  export합니다.
- `config/`, `hooks/`: 아직 없습니다. 필요할 때만 만드세요(환경 변수용
  `config/env.ts`는 `LIBRARIES.md` 참고. `hooks/`는 shadcn이 컴포넌트에 필요한
  훅을 넣는 곳이기도 합니다).
