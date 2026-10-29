# app

앱 전체 부트스트랩입니다. **비즈니스 로직과 재사용 UI 컴포넌트는 두지
않습니다.** 컴포넌트는 `pages`나 `widgets`에 속합니다.

`main.tsx`는 앱을 최대 430px 너비의 모바일 화면으로 가운데 배치합니다.
작은 화면에서는 전체 너비를 사용합니다. 래퍼의 transform은 Stackflow 화면과
fixed 내비게이션의 기준을 모바일 프레임 안으로 제한하므로 유지하세요.

## 세그먼트

- `stackflow/`: 화면 내비게이션([Stackflow](https://stackflow.so)).
  `config.ts`는 모든 액티비티(이름, URL, 파라미터)를 나열하고, `stack.tsx`는
  각 이름을 페이지 컴포넌트에 연결하고 플러그인을 설정합니다(앱 바와 전환
  효과용 SEED `seedPlugin`, 화면마다 URL을 갖게 하는 `history-sync`). 연결 코드만
  둡니다. 컴포넌트 맵 외의 JSX나 데이터 조회는 넣지 않습니다.
- `providers/`: 앱 전역 context provider를 `AppProviders`에서 한 번에
  조합합니다. 새 전역 provider(테마, 인증 등)는 페이지가 아니라 여기에
  추가합니다.
- `styles/`: 유일한 Tailwind 진입점(`@import "tailwindcss"` + `@theme`)과
  진짜 전역 CSS.
