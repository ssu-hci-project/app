# pages

화면(Stackflow 액티비티)당 슬라이스 하나입니다. 로직보다는 레이아웃과 조합이
대부분입니다. 페이지를 import하는 곳은 `app/stackflow/stack.tsx`뿐입니다.

## 세그먼트

- `ui/`: 페이지 컴포넌트(예: `ui/home-page.tsx`). 타입은
  `ActivityComponentType<"HomePage">`로 지정하고, 내용은
  `@stackflow/plugin-basic-ui`의 `<AppScreen>`으로 감쌉니다(앱 바와 전환 효과).
  이동은 `@stackflow/react`의 `useFlow()`로 합니다:
  `push("TodoDetailPage", { id })`, `pop()`.
- `model/`: 렌더링하는 어느 widget/feature에도 속하지 않는 페이지 로컬
  상태가 있을 때만. 드뭅니다.

액티비티 이름은 PascalCase 컴포넌트 이름입니다(`TodoDetailPage`). 두 페이지가
같은 블록을 써야 하면 `widgets` 슬라이스로 만드세요.
