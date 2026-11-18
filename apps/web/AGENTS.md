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
  mutation 성공 시 변경 범위에 해당하는 활성 쿼리를 다시 가져옵니다. 잦은 진도 저장은 mutation의 `meta.invalidates`에 책 목록·독서 달력 키만 지정합니다. 홈 목록과 달력은 화면이 가려져 있는 동안 재조회하지 않고, 다시 활성화되면 오래된 데이터를 갱신합니다. 즉각적인 반응이
  필요하면 낙관적 업데이트를 쓰세요. 타입은 `@app/contract`에서 옵니다. API를
  직접 `fetch`하지 마세요.
- **폼**은 손으로 복사한 zod 스키마가 아니라 계약의 스키마
  스키마로 검증합니다. 그래야 폼과 API가 어긋나지 않습니다.
  사용자에게 보이는 메시지는 계약 스키마에 둡니다. 입력의 `maxLength`·글자 수 표시는 계약의 `textLimits`를 씁니다.
- **색상**은 테마 토큰(`text-muted-foreground`, `text-destructive`,
  `border-input`, `bg-primary`…)을 쓰고, `text-slate-400` 같은 원시 팔레트
  클래스는 쓰지 않습니다. 그래야 테마를 일관되게 유지할 수 있습니다.
- 색상 테마는 `AppProviders`에서 시스템 설정을 따라 루트 `.dark`와 `color-scheme`을 동기화합니다.
  `src/app/styles/index.css`의 shadcn 토큰에 메인 `#008081`·서브 `#66B2B2`을 둡니다. 책갈피·경고·AI 강조색은
  `--bookmark`/`--warning`/`--magic`으로 관리합니다. `.dark`의 강조색도 같은 메인·서브 색을 쓰며,
  선택 배경은 어두운 배경에 서브 색을 섞고 포커스 링은 서브 색을 사용합니다.
- **UI** 프리미티브는 `src/shared/ui`(Base UI 기반 shadcn)에 있습니다. 이
  디렉터리에서 `bunx shadcn@latest add <component>`로 추가하세요.
  `components.json`이 이미 `shared/ui`와 `shared/lib`를 가리킵니다.
- 아이콘은 `shared/ui`의 TDS 아이콘을 우선 사용합니다(`tds-icon.tsx`, 출처는 `TDS.md`). 대응하는 리소스가 없는 로딩 아이콘만 `lucide-react`를 사용합니다.
- 화면은 `shared/ui`의 `AppScreen`(Stackflow `transitionState`로 밀어 넣는 전환)과 `MobileScreen`(앱바·본문·`fab`·`contextual`·`footer` 배치)으로 만듭니다.
- 화면의 추가 액션(새 기록, 새 모임 등)은 본문 버튼 대신 `FloatingActionButton`으로 두고 `MobileScreen`의 `fab` prop으로 넘깁니다. 위치와 safe area는 `MobileScreen`이 처리합니다.
- 한 화면의 고대비 버튼(`Button` 기본 variant)이나 FAB은 하나입니다. 화면 이동이 아닌 보조 액션은 앱바 우측 아이콘, 삭제·나가기처럼 되돌릴 수 없는 행동은 앱바 더보기 → `MenuSheet`의 critical 항목 → `AlertDialog` 순서로 둡니다.
- 바텀시트(`BottomSheet`)와 메뉴 시트(`MenuSheet`)는 shadcn `Drawer`이며 Activity가 아닙니다. Drawer·AlertDialog·토스트는 `appFrame()`으로 모바일 프레임(`#app-frame`) 안에 portal합니다. 열림 상태는 `useStepOverlay()`로 `overlay` step 파라미터에 두어, 뒤로 가기가 시트를 먼저 닫습니다. 새 시트는 `overlay.bind("키")`로 연결하고 각 액티비티 파라미터에 `overlay?: string`이 등록돼 있어야 합니다. 앱 프레임은 `overflow: clip`이라 포커스 이동으로 스크롤되지 않습니다.
- 작성 화면처럼 키보드와 함께 쓰는 CTA는 `MobileScreen`의 `footer` prop으로 하단에 고정합니다. 화면 안내·경고는 일반 텍스트가 아니라 `Alert`로 화면당 하나만 둡니다.
- 독서 화면은 `books.chapter`로 장·문단을 받아 CSS columns로 화면 크기에 맞게 쪽을 나눕니다.
  진도는 `progress.save`로 장과 장 안 비율을 저장합니다. 구절의 밑줄·메모·질문·꾸미기는
  `traces`, AI 질문은 `questions.generate`를 사용합니다. 쓰던 생각을 AI에 보내지 마세요.
- AI 기능 표시는 `AiSparkleIcon`(`shared/ui/ai-icon.tsx`)을 씁니다. TDS twinkle 리소스를 메인/서브 테마 색으로 표시합니다. AI 결과가 있을 때만 `--magic` 톤 `Alert`로 안내합니다.
- 판본이 `판본 미확인`이거나 앱에서 읽는 작품(`sourceUrl` 있음)이면 판본을 노출하지 않습니다. 출처와 이용 조건은 리더의 "책 정보" 시트에서 보여줍니다. 저자·판본 표기는 `@/entities/book`의 `bookByline`을, 사람 이름은 `@/entities/profile`의 `personName`을 씁니다.
- 기록 작성은 별도 액티비티에서 개인 저장이 기본입니다. 공개 범위 선택은 `Field` 안의 버튼과 `ChoiceGroup`(카드형 라디오)을 사용하고 확정 버튼 전에는 서버 상태를 바꾸지 않습니다. 알림은 `useNotice()` 토스트로 모바일 프레임 하단에 표시합니다.
- `/api`는 `bun run dev` 중에는 API로 프록시되고, 프로덕션에서는 같은 Worker가
  제공하므로 API base URL을 설정할 필요가 없습니다.

- 독서 진도 저장 콜백은 `useCallback`으로 안정화하고, 저장 effect는 장·쪽·비율 같은 값에만 반응합니다. 쿼리 결과 객체나 mutation 객체의 변경으로 다시 저장하지 마세요. `use-reading-progress.test.ts`가 렌더·조회 갱신 후 요청이 반복되지 않는지 검사합니다. 훅 테스트는 `@testing-library/react` + `happy-dom`을 사용합니다.

- 낙관적 업데이트는 `shared/api/optimistic-mutations.ts`에서 API별로 정의하고 `OptimisticCache`가
  겹치는 쓰기 요청을 독립 레이어로 관리합니다. 실패한 요청만 제거하고 다른 성공/대기 변경은
  유지합니다. 성공 응답은 임시 ID를 실제 ID로 바꾸며, 대기 중인 쓰기가 끝난 뒤 다시 조회합니다.
  반응·책 담기의 연속 변경은 mutation `scope`로 서버 실행 순서를 맞춥니다.
- 책 상세는 목록·검색 캐시의 책을 `findCachedBook`으로 `placeholderData`에 넣어 위쪽부터 바로 그리고, 리더가 열 장과 흔적 목록을 미리 받습니다.
- 책 탐색·내 서재는 `books.listPage` + `useBookPages`로 20권씩 커서 페이지네이션합니다.
  `InfiniteLoader`는 IntersectionObserver로 다음 묶음을 받고 수동 더 보기/재시도도 제공합니다.
  본문 레이아웃에 필요한 흔적은 유지하고, 흔적·같은 질문 답변 시트의 카드는 20개씩 그립니다.
- 공통 UI의 TDS 출처와 크기·상태 매핑은 `src/shared/ui/TDS.md`에 있습니다. 글자 크기는 TDS 단계(`text-t5`, `text-st9` 등)만 쓰고, 칩·텍스트 버튼·아이콘 버튼은 `Chip`·`TextButton`·`IconButton`을 씁니다.

- `SearchField`, `TabBar`, `ChoiceCard`, `ListButton` 등 공통 컴포넌트를 조합하고 같은 UI를
  페이지에서 다시 만들지 마세요. 책 행은 `BookRow`가 `ListButton`을 조합합니다.

- Motion은 `MotionProvider`에서 지연 로딩하고 동작 줄이기를 따릅니다. 공통 `Segmented`, `ReactionButton`, `AnimatedListItem`에서 사용하며, 화면 전환과 시트는 기존 처리를 유지합니다.

- 반응 8종은 네이티브 이모지를 직접 그리지 않고 `ReactionEmoji`로 표시합니다. 선택기·본문 마커·흔적 카드·반응 개수에 같은 TDS 원본을 사용하고 API에는 기존 Unicode 값을 그대로 보냅니다. 반응 액션은 상태와 관계없이 `SmileIcon`, 질문은 `QuestionIcon`, 꾸미기는 `PencilIcon`을 사용합니다. 별도의 AI 기능 표시는 `AiSparkleIcon`을 씁니다.
