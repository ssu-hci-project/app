# apps/web

Feature-Sliced Design으로 구성한 Vite + React 19 SPA입니다. 레이어와 import
규칙은 [`ARCHITECTURE.md`](ARCHITECTURE.md), 세그먼트는 각 레이어의
`README.md`에 있습니다. 헬퍼를 쓰기 전에 [`LIBRARIES.md`](LIBRARIES.md)를
확인하세요.

- **화면**은 Stackflow 액티비티입니다. `pages` 슬라이스로 만들고
  `src/app/stackflow/`에 등록합니다(`src/app/README.md` 참고).
- **대상 환경**은 모바일입니다. 화면과 상호작용은 작은 뷰포트와 터치를 기준으로
  설계하고, 데스크톱 전용 화면이나 사용 흐름을 별도로 만들지 않습니다.
- **라우팅과 이동**은 Stackflow를 사용합니다. 화면별 액티비티와 URL, 파라미터를
  `src/app/stackflow/config.ts`에 등록하고 `stack.tsx`에 컴포넌트를 연결합니다.
  `useFlow()`의 `push`와 `pop`으로 이동하며, `history-sync`를 통해 URL과
  브라우저 뒤로 가기가 스택과 동기화되도록 합니다. 독서 화면에서 다른 화면을
  거쳐 돌아올 때 독서 맥락을 유지할 수 있도록 흐름을 설계합니다.
- 같은 화면의 하단 메뉴·책장 탭·필터·페이지·모임 선택 변경은 `useStepFlow(...).replaceStep()`으로 현재 파라미터와 URL만 갱신합니다. 이런 내부 상태 변경에 `useFlow().replace()`를 사용해 액티비티 전환 애니메이션을 발생시키지 않습니다.
- **데이터**는 `src/shared/api`의 `orpc`로 API에서 가져옵니다:
  `useQuery(orpc.<ns>.<proc>.queryOptions())`,
  `useMutation(orpc.<ns>.<proc>.mutationOptions(...))`. mutation 훅에서
  invalidate하지 마세요. `shared/api/query-client.ts`의 `MutationCache`가
  mutation이 끝날 때마다 활성 쿼리를 모두 다시 가져옵니다. 즉각적인 반응이
  필요하면 낙관적 업데이트를 쓰세요. 타입은 `@app/contract`에서 옵니다. API를
  직접 `fetch`하지 마세요.
- **폼**은 손으로 복사한 zod 스키마가 아니라 계약의 스키마
  스키마로 검증합니다. 그래야 폼과 API가 어긋나지 않습니다.
  사용자에게 보이는 메시지는 계약 스키마에 둡니다.
- **색상**은 테마 토큰(`text-muted-foreground`, `text-destructive`,
  `border-input`, `bg-primary`…)을 쓰고, `text-slate-400` 같은 원시 팔레트
  클래스는 쓰지 않습니다. 그래야 테마를 일관되게 유지할 수 있습니다.
- 색상 테마는 현재 라이트 모드로 고정합니다. `src/app/styles/index.css`의 SEED
  의미 토큰을 기준으로 기존 shadcn 토큰을 연결하며, 종이색 배경과 숲색 주요
  동작을 사용합니다. 책갈피 강조색은 `--bookmark`로 관리합니다. 다크 모드는
  별도 팔레트와 두 UI 시스템의 동기화를 검증한 후 도입합니다.
- **UI** 프리미티브는 `src/shared/ui`(Base UI 기반 shadcn)에 있습니다. 이
  디렉터리에서 `bunx shadcn@latest add <component>`로 추가하세요.
  `components.json`이 이미 `shared/ui`와 `shared/lib`를 가리킵니다.
- **SEED Design** 컴포넌트는 `@seed-design/react`에서 사용하며, 스타일은 Vite 플러그인이 로드합니다. 기존 shadcn UI와 함께 점진적으로 적용합니다.
- 화면 아이콘은 당근 공식 `@karrotmarket/react-monochrome-icon`을 사용합니다. 하단 내비게이션은 SEED 가이드에 따라 Fill 아이콘으로 통일하고 색상으로 선택 상태를 구분합니다.
- 상단 내비게이션과 Page Banner는 SEED CLI의 공식 스니펫(`shared/ui`)을 사용합니다. `seed-design.json`이 생성 경로를 관리합니다.
- 화면의 추가 액션(새 기록, 새 모임 등)은 본문 버튼 대신 SEED `FloatingActionButton`(extended, 아이콘+라벨)으로 두고, `MobileScreen`의 `fab` prop으로 넘깁니다. 우하단 20px 위치, safe area, 스낵바 겹침 방지, BottomSheet보다 아래 쌓이는 순서는 `MobileScreen`이 처리합니다.
- 한 화면의 고대비 버튼(Brand/Neutral Solid)이나 FAB은 하나입니다. Brand 색은 사람을 잇는 행동(공유, 초대, 모임)에만 씁니다. 화면 이동이 아닌 보조 액션은 앱바 우측 아이콘, 삭제·나가기처럼 되돌릴 수 없는 행동은 앱바 더보기 → `SwipeableMenuSheet`의 Critical 항목 → Alert Dialog 순서로 둡니다(`ui:menu-sheet`는 deprecated).
- 바텀시트와 메뉴 시트는 Activity가 아니므로 `shared/ui/overlay.tsx`가 모바일 프레임(`#app-frame`)으로 portal하고 다음 단계 z-index를 줍니다. 열림 상태는 `useStepOverlay()`로 `overlay` step 파라미터에 두어, 뒤로 가기가 시트를 먼저 닫습니다. 새 시트는 `overlay.bind("키")`로 연결하고 각 액티비티 파라미터에 `overlay?: string`이 등록돼 있어야 합니다. 앱 프레임은 `overflow: clip`이라 포커스 이동으로 스크롤되지 않습니다.
- 작성 화면처럼 키보드와 함께 쓰는 CTA는 `MobileScreen`의 `footer` prop으로 하단에 고정합니다. 화면 안내·경고는 일반 텍스트가 아니라 SEED `Callout`(안내는 Informative, 데이터 유실 위험은 Warning)으로 화면당 하나만 둡니다.
- 독서 화면은 앱 안 리더입니다. 본문은 `reading.getPage`로 한 쪽씩 받고(다음 쪽은 미리 받음), 쪽 이동은 `MobileScreen` footer의 `PageBar`(이전·다음·`WheelPicker` 시트)로 합니다. 본문에서 문장을 고르면 FAB 대신 `ContextualFloatingButton`을 띄워 그 구절로 기록을 엽니다(떠 있는 버튼은 한 번에 하나). 다른 독자의 기록은 "책갈피 N"으로 개수만 보이고 시트를 열 때만 불러옵니다. 새 생각은 숫자 없는 Neutral Weak Badge로만 알립니다.
- 작성 화면의 질문 목록은 열자마자 보이고, AI 질문은 화면을 열 때 한 번만 `reading.generateQuestions`로 요청합니다. 입력은 쪽과 고른 구절뿐이고, 본문 맥락은 서버가 만듭니다. 쓰던 생각을 AI에 보내지 마세요.
- AI 기능 표시는 `AiSparkleIcon`(`shared/ui/ai-icon.tsx`)을 씁니다. SEED `$gradient.highlight-magic`을 SVG 채우기로 옮긴 것이고, 정의(`AiGradientDefs`)는 `AppProviders`에서 한 번 렌더링합니다. AI 결과가 있을 때만 Magic 톤 Callout으로 안내합니다.
- 판본이 `판본 미확인`이거나 앱에서 읽는 작품(`sourceUrl` 있음)이면 판본을 노출하지 않습니다. 출처와 이용 조건은 리더의 "책 정보" 시트에서 보여줍니다. 책 메타 표기는 `@/entities/book`의 `bookByline`/`editionLabel`을 씁니다.
- Tailwind 4는 `@seed-design/tailwind4-theme`로 SEED 토큰을 사용합니다. CSS layer 순서는 HTML head와 스타일 진입점에서 선언하며, SEED base·직접 recipe import는 `.layered.css`를 사용합니다. Vite의 `seed-layered` condition으로 내부 스타일도 일치시킵니다.
- 기록 작성은 별도 액티비티에서 개인 저장이 기본입니다. 공개 범위 선택은 공식 Field Button·Radio Select Box를 사용하고 확정 버튼 전에는 서버 상태를 바꾸지 않습니다. 알림은 공식 SEED Snackbar로 모바일 프레임 하단에 표시합니다.
- `/api`는 `bun run dev` 중에는 API로 프록시되고, 프로덕션에서는 같은 Worker가
  제공하므로 API base URL을 설정할 필요가 없습니다.
