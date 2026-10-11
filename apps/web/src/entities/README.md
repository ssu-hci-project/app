# entities

도메인 개념의 형태, 조회 쿼리, 단건 UI입니다. 엔티티는 "Todo가 무엇이고
어떻게 가져오는가"에 답하고, "사용자가 추가를 누르면 무슨 일이 일어나는가"에는
답하지 않습니다. 폼, 제출 핸들러, 토스트는 두지 않습니다(그건 `features`).

## 세그먼트

- `model/`: `@app/contract`에서 재export한 엔티티 타입(손으로 쓴 중복
  `interface` 금지). 클라이언트 전용 파생 타입도 여기에 둡니다.
- `api/`: `orpc` 기반 TanStack Query 조회 훅(샘플 `todo/api/queries.ts` 참고).
  쿼리 키는 `orpc`에서 가져오고 직접 쓰지 않습니다.
- `ui/`: **단건**을 표시하는 프레젠테이션 컴포넌트(샘플
  `todo/ui/todo-item.tsx` 같은 카드/행). mutation은 넣지 않습니다.

mock 레이어는 없습니다. API가 시드 데이터(`apps/api/seed.sql`)로 로컬에서
실행됩니다.
