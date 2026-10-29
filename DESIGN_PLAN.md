# 독서 기획과 SEED를 연결하는 구현 계획

이 문서는 기획·디자인·구현을 연결하는 기준이다. 조사 근거와 한계는 [PRODUCT_PLAN.md](PRODUCT_PLAN.md)를
따른다. 아래 기본값·화면 구성·공개 정책은 조사로 확정된 선호가 아니라 다음
프로토타입에서 검증할 제품 결정이다. SEED의 시각 규칙과 제품의 공개 정책은
서로 다른 근거로 관리한다.

현재 1~4단계의 핵심 흐름을 구현했다. layered CSS와 공식 Tailwind 토큰,
개인 기록·수정·삭제·파일 보관, 모임의 초대·참여·공유 확정·철회, 새 의견 안내를
연결했다. 루트 책장 탐색은 `/?section=books&tab=notes&filter=…`로 복원한다.
읽음 상태는 계획의 페이지별 커서보다 세밀한 기록별 공유 버전을 사용하며,
IntersectionObserver로 보인 기록만 확인한다. 실제 사용자 평가와 질문 UI는 후속 단계다.

## 1. 경험의 중심과 범위

핵심 흐름은 **읽던 장면으로 돌아오기 → 내 생각 보관 → 원할 때 다른 생각 열기 →
원하는 모임에 공유 → 나중에 다시 찾기**다. 감상을 쓰거나 완독하지 않아도
다른 생각을 볼 수 있다. 모임 참여 여부에 따른 접근 권한은 이 열람 선택과 별개다.

첫 구현은 같은 판본의 책을 각자 읽는 초대 모임으로 좁힌다. 실물 책 순환이나
다음 독자만 기록을 보는 방식은 별도 실험으로 남긴다. 기본 하단 메뉴는 홈·책장
두 개를 유지하며, 모임은 홈과 책의 상세 맥락에서 접근한다.

기능의 중심을 기록 개수·완독률 대신 공개 범위를 이해하고 자신의 속도로 돌아오는
경험에 둔다. 개인 저장은 기본이며, 공유와 대화는 선택이다.

## 2. 먼저 고칠 스타일 기반

현재 코드에서는 `base.css`와 recipe CSS를 unlayered로 가져오고 Tailwind 4는
layered CSS를 생성한다. 따라서 일부 컴포넌트에서 Tailwind 높이·색·배치가
기대한 대로 적용되지 않을 수 있다. 이를 단순히 className 추가로 해결하지 않는다.

1. 공식 Tailwind 4 가이드에 따라 `@seed-design/tailwind4-theme`의 호환성을 확인한다.
2. SEED의 layered base와 recipe를 사용하고 Vite의 `seed-layered` 해석 조건을 설정한다.
   명시적 `.css` import도 점검하여 일반 CSS와 layered CSS가 섞이지 않게 한다.
3. `theme, base, seed-base, components, seed-components, utilities` 순서를 선언한다.
   개발 서버와 빌드 청크에서도 같은 순서인지 확인한다.
4. `px-x4`, `gap-x3`, `text-fg-neutral`처럼 공식 토큰 유틸리티로 배치를 표현한다.
   SEED 내부 높이·패딩을 덮어써 다른 종류의 컴포넌트로 바꾸지 않는다.
5. 기존 shadcn 의미 토큰 연결과 숲색 브랜드 테마는 상태별 대비를 확인한다.
   Neutral은 읽기, Brand는 핵심 동작, Positive/Critical은 결과에 사용한다.

Cascade Layers 문서는 Experimental이다. 이 변경은 독립 작업으로 검증하며
자동 스타일 로딩, 직접 recipe import, 기존 shadcn 스타일을 함께 비교한다.
이는 사용자 선호를 바꾸는 작업이 아니라 스타일 적용 순서를 명확히 하는 작업이다.

근거: [Tailwind CSS](https://seed-design.io/react/getting-started/styling/tailwind-css),
[Cascade Layers](https://seed-design.io/react/getting-started/styling/cascade-layers),
[Color Roles](https://seed-design.io/foundations/color/color-role).

## 3. 화면별 기획과 컴포넌트

| 화면·진입 | 사용자가 해결할 일 | 정보와 SEED 구성 | 주요 동작과 완료 조건 |
| --- | --- | --- | --- |
| 홈 `/` | 지금 읽던 책으로 돌아오기 | Root Top Navigation의 왼쪽 Text 제목, 오른쪽은 실제 기능이 있는 아이콘. List Header + 이어 읽기 List. 참여 모임 List | 행에서 읽던 페이지로 이동. 새 의견이 있을 때만 상태 안내. 타인의 감상 본문은 노출하지 않음 |
| 책장 `/books` | 책 또는 내 기록 찾기 | Root Top Navigation, Line Tabs `책 / 내 기록`. 책은 List, 내 기록은 책·페이지·날짜·공개 상태를 가진 List | 탭 전환은 서로 다른 콘텐츠 탐색. 내 기록 안에서만 Segmented Control `전체 / 나만 보기 / 공유`로 즉시 필터 |
| 독서 `/books/:bookId?page=…&groupId=…` | 현재 장면 확인·기록 시작·다른 관점 확인 | Standard Top Navigation, 책·판본과 페이지 맥락, 페이지 입력과 보조 이동 버튼, 내 기록 요약 List | 주요 CTA는 `생각 남기기`. 페이지 이동·`다른 생각 열기`는 낮은 강조. 뒤로 가기와 다시 방문 시 맥락 복원 |
| 기록 작성·수정 | 자유롭게 쓰고 개인 보관 | 별도 Stackflow 화면, Text Field Textarea, 페이지·선택 구절 맥락, 하단 Action Button | 새 기록은 `나만 보기`를 지속 안내하고 `내 기록에 저장`. 성공 시 기록 상세로 복귀. 공유된 기록 수정은 대상 모임과 `공유 기록 수정`을 명시 |
| 다른 생각 열기 | 해당 장면의 다양한 해석 읽기 | Bottom Sheet의 제목·설명·본문·닫기. 접힌 상태에서는 내용 미리보기 없음 | 성공적으로 조회하고 실제 표시한 범위만 읽음 처리. 짧은 감상 읽기에 집중. 많은 기록은 전체 목록 화면으로 이동 |
| 기록 상세 `/notes/:noteId` | 다시 읽고 공개 범위 바꾸기 | 본문은 Neutral의 읽기용 Text, 메타데이터는 Muted. 공개 상태 Badge, 공개 범위 Field Button | 내용 읽기와 편집·삭제·공개 범위 조정. Badge 자체를 버튼처럼 쓰지 않음 |
| 공개 범위 선택 | 누가 볼지 이해하고 결정 | Field Button이 Bottom Sheet를 열고 단일 선택 Radio Select Box 표시. 모임명과 설명, 별도 확정 버튼 | 선택만으로 서버 공개 안 됨. 확정할 때만 변경. 실패하면 기존 공개 상태 유지 |
| 모임 상세·초대 | 같은 책을 읽을 상대와 연결 | Standard Top Navigation, 책·판본 정보, 참여자 목록, 초대 미리보기, 가입 Action Button | 초대 링크를 보는 것만으로 가입하지 않음. `이 모임에 참여`를 눌러 가입 확정 후 모임 기록 접근 |

표의 URL은 목표 계약이다. 현재 구현된 URL과 구분하여 Stackflow config와 함께
추가한다. 루트 탭·책장 내부 탭·필터도 뒤로 가기와 새로고침에서 복원되게 하고,
기록에서 원래 페이지로 돌아올 때 책·모임·스크롤 위치를 보존한다.

같은 책의 모임을 바꿔도 개인 기록은 내 기록으로 남는다. 다른 모임의 공유 기록이
이전 모임의 캐시나 미리보기에 섞이지 않도록 조회 키에 모임 ID를 포함한다.

## 4. 개인 기록과 공유의 인터랙션

```text
페이지에서 생각 남기기
  → 개인 기록 작성 → 내 기록에 저장 → 기록 상세 [나만 보기]
  → 공개 범위 선택 → 모임 선택 → 이 모임에 공유 → [OO 모임에 공유]

기존 공유 기록
  → 공개 범위 선택 → 나만 보기 → 나만 보기로 변경 → [나만 보기]
```

- 새 기록의 공개 기본값은 항상 개인 보관이다. 마지막 공유 모임을 자동 적용하지 않는다.
- 공개 범위의 선택지는 `나만 보기`와 현재 참여 중인 모임이다. 모임 가입을
  권유하는 화면은 작성 도중 강제로 띄우지 않는다.
- Select Box는 행 전체를 눌러 선택하고, 설명은 짧게 유지한다. 하단 버튼을
  눌렀을 때 서버가 멤버십과 기록 소유자를 확인한 후 한 번에 공개 상태를 변경한다.
- 공유 시 현재·이후 참여자가 이전 기록을 볼 수 있는 정책을 미리 알린다.
  첫 버전은 현재 모임 멤버가 과거 공유 기록도 보는 모델로 제안한다.
- 공유 철회 뒤의 서버 조회를 차단하고 활성 캐시를 갱신한다. 이미 다른 사람이
  읽거나 별도 보관한 내용까지 회수된다고 안내하지 않는다.
- 영구 삭제는 Critical Alert Dialog의 `기록 삭제 / 취소`로 확인한다.
  복구 API가 없으면 Snackbar에 `되돌리기`를 제공하지 않는다.

공유 버튼을 처음부터 강하게 강조하여 참여 부담을 만들지 않는다. 개인 편집 화면의
고대비 CTA는 저장 하나로 두고, 공유 확정 화면에서는 공유가 주요 CTA가 된다.

근거: [Select Box](https://seed-design.io/components/select-box),
[Input Button](https://seed-design.io/components/input-button),
[Action Button](https://seed-design.io/components/action-button),
[Alert Dialog](https://seed-design.io/components/alert-dialog).

## 5. 독서 흐름을 방해하지 않는 레이어와 피드백

| 상황 | 표현 | 유지할 동작 |
| --- | --- | --- |
| 다른 감상 잠깐 읽기 | 제목이 있는 Bottom Sheet | 닫으면 원래 페이지와 스크롤로 복귀. 긴 글·편집은 개별 화면으로 분리 |
| 공개 범위 선택 | Bottom Sheet + Radio Select Box + 확정 CTA | 닫으면 미확정 선택 폐기. 기존 서버 공개 상태는 유지 |
| 작성 중 이탈 | 입력 복원 가능하면 그대로 이동 | 초안을 탭 안에 보관했다는 상태를 정확히 표시. 실제 유실이 있을 때만 Alert Dialog |
| 페이지 숫자 오류 | 해당 Text Field의 오류 문구 | `1~120쪽 사이로 입력해주세요`처럼 수정 방법 제시, 필드에 초점 유지 |
| 책장 최초 조회 | 구조에 맞는 Skeleton | 빠른 응답에서는 로딩이 깜박이지 않도록 지연 노출. 완료되면 실제 목록으로 전환 |
| 저장 중 | Action Button의 공식 loading 상태 | 중복 요청 방지. 저장할 내용이 확정될 때까지 작성 내용 변경을 막거나 제출 스냅샷과 분리 |
| 저장 성공 | 하단 Positive Snackbar `내 기록에 저장했어요` | 개인 저장·공유 성공 문구를 구분하고 실제 서버 성공 이후 표시 |
| 저장 실패 | 입력 영역의 지속 오류 + 다시 저장 버튼 | 초안 유지. 짧은 Critical Snackbar는 보조 피드백으로만 사용 |
| 최초 데이터 없음·조회 실패 | Result Section | 감상 없음과 실패를 구분. 실패는 `다시 불러오기`, 빈 상태는 작성 강요 없이 돌아가기 제공 |
| 새 의견 존재 | 페이지 최상단 Page Banner 한 개 | 감상 본문을 숨기고 `새로운 생각이 있어요`와 열람 동작만 제공 |

Bottom Sheet는 최대 90% 높이 권고를 따르고, 그보다 많은 정보를 탐색해야 하면
별도 화면을 사용한다. 스냅 포인트를 넣을 때는 Handle을 함께 제공한다. 편집
양식을 시트 안에 여러 단계로 중첩하지 않는다.

Snackbar는 하단 중앙에 한 번에 하나, 기본 4초로 계획한다. 연속 결과는
queued 전략으로 표시하고 긴 문구는 시간을 조절한다. 내비게이션·고정 CTA·
키보드·Bottom Sheet와의 겹침을 실제 기기에서 확인한다. 네 방향의 safe area를
현재 값으로 처리하며, 배경은 화면 끝까지, 텍스트와 버튼은 안전 영역 안에 둔다.

근거: [Bottom Sheet](https://seed-design.io/components/bottom-sheet),
[Snackbar](https://seed-design.io/components/snackbar),
[Loading](https://seed-design.io/patterns/loading),
[Result Section](https://seed-design.io/components/result-section),
[Safe Area](https://seed-design.io/patterns/safe-area).

## 6. 읽기 위한 시각 언어

- 책 제목·페이지·감상 본문·작성자와 날짜 순으로 정보 위계를 만든다. 감상 본문
  전체를 회색 List Detail에 넣지 않는다. 목록 미리보기는 짧게, 상세 본문은
  Neutral과 읽기용 타이포그래피로 줄바꿈을 보존한다.
- 가로 여백은 기본 global gutter 16px, 일반 컴포넌트 간격은 12px 토큰을
  기준으로 삼고, 서로 다른 섹션의 간격을 더 넓힌다. 실제 수치는 SEED 토큰으로 관리한다.
- 고정 모바일 프레임 430px은 제품의 데스크톱 표시 정책이다. SEED 전체의
  필수 너비라고 설명하지 않는다. 작은 화면·큰 글꼴에서도 잘림 없이 동작해야 한다.
- 루트 제목은 왼쪽 일반 Text, 상세는 Standard AppBar를 사용한다. React에는
  Root Top Navigation 전용 구현이 없어 공식 AppBar 슬롯으로 근사한 부분을 구분한다.
- 하단은 당근 Fill 아이콘과 짧은 라벨을 함께 사용한다. React용 공식 Bottom
  Navigation이 없으므로 제품 조합으로 관리하며 범용 ActionButton을 세로로 변형하지 않는다.
- Badge는 공개 상태의 정적 표시, Tabs는 `책 / 내 기록` 탐색, Segmented
  Control은 내 기록 필터로 역할을 구분한다. 선택지를 저장하는 UI와 혼용하지 않는다.
- 매 화면에 고대비 주요 CTA 하나를 원칙으로 한다. 현재 독서 화면의 페이지 이동과
  저장이 모두 주요 버튼처럼 보이는 문제를 먼저 정리한다.

근거: [Typography](https://seed-design.io/foundations/typography),
[Spacing](https://seed-design.io/foundations/spacing),
[List](https://seed-design.io/components/list), [Badge](https://seed-design.io/components/badge),
[Tabs](https://seed-design.io/components/tabs),
[Segmented Control](https://seed-design.io/components/segmented-control).

## 7. 상태와 데이터가 디자인을 지키게 하기

| 대상 | 필요한 계약 | UI가 신뢰할 수 있어야 할 조건 |
| --- | --- | --- |
| 책·판본 | 판본 ID, 제목·저자, 페이지 기준 | 다른 판본의 같은 페이지 감상을 섞지 않음 |
| 기록 | 소유자, 페이지, 선택 구절, 내용, 공개 범위, 모임 ID, 생성·수정·공유 시점 | 개인 기록은 소유자만 조회. 한 기록의 공유 대상은 첫 버전에서 한 모임으로 제한 |
| 모임 | 책·판본, 모임명, 활성 멤버십, 초대 상태 | 초대 조회와 가입 구분. 기록 조회·공유 시 서버가 멤버십 검증 |
| 독서 맥락 | 사용자·책별 현재 페이지, 열람 중 모임 | 개인 독서 위치와 모임별 새 기록 확인 상태를 분리 |
| 읽음 상태 | 사용자·모임·책·페이지별 마지막 확인 커서 | 실제 표시된 조회 결과까지만 읽음 처리. 단순 책 열기·백그라운드 조회로 새 기록 소진 금지 |
| 세션·복구 | 익명 세션과 기록 소유자 연결, 복구 수단 | 30일 쿠키만으로 영구 보관을 약속하지 않음. 장기 평가 전 복구 또는 계정 연결 제공 |

새 의견은 내가 작성하지 않은 현재 공유 기록 중 확인 커서 이후 공유된 기록으로
정의한다. 공유 철회·탈퇴 후에는 새 의견 집계에서도 제외한다. 조회 도중 들어온
새 기록을 읽음 처리하지 않도록 서버가 반환한 조회 기준 커서까지만 확인한다.

기존 `userId` 없는 기록을 임의 사용자 소유로 배정하지 않는다. 기존 공용 기록의
전환 정책을 명시하고, 새 비공개 기본값을 기존 공개 자료에 무조건 소급하지 않는다.

## 8. 구현 순서와 완료 기준

1. **스타일 기반과 현재 화면 정렬**: layered CSS·Tailwind 토큰 연결, 헤더·하단
   아이콘·CTA 위계, 긴 본문·입력·Snackbar 상태를 한 화면에서 검증한다.
2. **개인 기록과 아카이브**: 비공개 기본값, 내 기록 목록·상세·수정·삭제,
   초안·페이지·목록 위치 복원, 빈 상태와 실패 상태를 연결한다.
3. **모임과 명시적 공유**: 초대 미리보기·가입, 공개 범위 선택·확정·철회와
   서버 권한을 같은 변경에서 구현한다. 모임 없는 개인 기록도 계속 사용 가능하다.
4. **다시 펼칠 때 새 흔적**: 모임·페이지별 읽음 커서와 새 의견 집계, Page Banner,
   열람하지 않고 넘어가기, 재진입 상태를 연결한다.
5. **질문 보조 기능**: 위 흐름을 평가한 뒤 선택형 질문과 AI UI를 연결한다.
   작성 중인 개인 감상을 자동 전송하지 않고 질문을 해석의 정답처럼 제시하지 않는다.

각 단계에서 정적 기본 화면만 만들고 종료하지 않는다. 정상·로딩·빈 상태·실패·
재시도·긴 내용·큰 글꼴·키보드 상태까지 같은 흐름으로 확인한다. 판본·공개 범위·
멤버십은 API 테스트로, 아이콘·초점·간격·중첩 레이어는 브라우저에서 검증한다.
필수 저장소 검사와 프로덕션 빌드를 수행한다.

제품 수용 기준:

- 기록을 저장해도 공유를 확정하기 전 다른 사용자가 읽을 수 없다.
- 작성과 완독 없이, 권한이 있는 모임의 감상을 직접 열 수 있다.
- 어떤 모임에 보이는지 사용자가 화면만 보고 설명할 수 있다.
- 공유 실패·저장 실패 후 기존 공개 상태와 입력이 보존된다.
- 기록 상세에서 원래 페이지로 돌아가고, 예전 기록을 책장에서 다시 찾을 수 있다.
- 하단 아이콘과 Snackbar가 작은 화면·데스크톱 모바일 프레임·키보드 상황에서 보인다.
- 새 의견을 열지 않고 지나쳤다가 다시 열어도 읽음 상태가 사라지지 않는다.

## 9. 공식 구현의 사용 범위

신규 UI는 공식 CLI 스니펫을 먼저 검토한다. React 구현의 실제 명칭은 디자인
문서와 다를 수 있다. Input Button의 입력 선택 패턴은 React에서 `FieldButton`,
공개 범위 단일 선택은 `RadioSelectBoxRoot/Item`으로 연결한다. 설치된 Stackflow와
호환되는 훅·경로를 확인한다. 사용자 흐름을 임의 기본 HTML이나 다른 라이브러리로
치환한 후 공식 SEED 구현이라고 설명하지 않는다.

구현 근거: [Field Button](https://seed-design.io/react/components/field-button),
[React Select Box](https://seed-design.io/react/components/select-box),
[React Snackbar](https://seed-design.io/react/components/snackbar),
[React App Screen](https://seed-design.io/react/stackflow/app-screen).
