# 헬퍼를 쓰기 전에 라이브러리부터

| 필요한 것 | 사용할 것 |
| --- | --- |
| SEED Design | `@seed-design/react`와 `@seed-design/css`, Vite 플러그인으로 컴포넌트 스타일과 라이트 색상 모드 적용 |
| 폼 + 검증 | `react-hook-form` + `zod` (`@hookform/resolvers/zod`) |
| 서버 상태 (조회/캐시/변경) | `@tanstack/react-query`. 조회에 `useEffect` + `useState`를 쓰지 않음 |
| 클라이언트/UI 상태 | `zustand` |
| API 호출 | `shared/api`의 `orpc` (`orpc.<ns>.<proc>.queryOptions()` 등). 타입은 `@app/contract`에서. 직접 쓴 `fetch` 금지 |
| 알림 | SEED `Snackbar` + `useSnackbarAdapter` (`shared/ui`). 전역 Provider가 모바일 프레임 하단에 표시하며 하단 내비게이션은 `SnackbarAvoidOverlap`으로 겹침을 방지 |
| 날짜 | `shared/lib`에서 import한 `dayjs` (플러그인과 로케일은 `shared/lib/dayjs.ts`에서 설정) |
| 조건부/병합 Tailwind 클래스 | `cn()` (`shared/lib/cn.ts`, clsx + tailwind-merge) |
| Tailwind 스타일 변형 (버튼 size/variant 등) | `class-variance-authority` |
| debounce/throttle, groupBy/pick/omit 등 | `es-toolkit`. 함수는 `recommend` 스킬로 찾고, 시그니처는 `node_modules/es-toolkit/dist/<category>/<fn>.d.ts`에서 확인 (JSDoc + 예제, 설치된 버전과 일치) |
| 공용 훅 (useLocalStorage, useDebounce, useMediaQuery, useClickOutside) | `usehooks-ts` |
| 접근성 있는 dialog/dropdown/tooltip/select 등 | `bunx shadcn@latest add <component>`. Base UI 기반으로 `shared/ui`에 생성. 포커스 트랩 모달이나 커스텀 드롭다운을 직접 만들지 않음 |
| 아이콘 | 당근 공식 `@karrotmarket/react-monochrome-icon`. 하단 내비게이션은 Fill 스타일로 통일 |
| 환경 변수 | 현재는 없음. `VITE_*` 변수를 추가하면 zod 스키마로 `shared/config/env.ts`를 만들고 그곳에서만 읽음 |

`debounce`, 직접 짠 fetch-loading-error `useState` 3종 세트, 커스텀 토스트
컴포넌트, 손으로 이어 붙인 className, 직접 만든 접근성 모달/드롭다운을 쓰려는
참이라면 멈추세요. 위 라이브러리가 이미 해줍니다.

## 실제로 필요할 때 추가 (기본 설치 안 됨)

| 필요한 것 | 사용할 것 | 비고 |
| --- | --- | --- |
| 애니메이션/전환 | `motion` (구 framer-motion) | 프로토타입에는 보통 과함. 레이아웃/제스처 애니메이션이 정말 필요할 때만 |
| 날짜 선택 UI | `react-day-picker` v9 | `react-hook-form`과 `Controller`로 연결. `dayjs`와 별도로 `date-fns`가 따라오지만 괜찮음 |
| 드래그 앤 드롭 정렬 | `@dnd-kit/react` | 기본적으로 접근성 지원 |
| 데이터 테이블 | `@tanstack/react-table` | 기존 TanStack 생태계와 맞음 |
| 긴 목록 가상화 | `@tanstack/react-virtual` | 목록이 실제로 길어졌을 때만 |
| 커맨드 팔레트 (⌘K) | `cmdk` | |
