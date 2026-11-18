# TDS Mobile 컴포넌트 기준

Figma MCP로 읽은 [TDS Mobile UI Kit](https://www.figma.com/design/tDvgcmd9FHaMXbzGhjVAUl?node-id=45133-629)의 규격을 기존 Base UI 컴포넌트에 적용합니다.
공식 `@toss/tds-mobile@2.5.1`의 React peer dependency는 16~18이므로 React 19 앱에서는 패키지를 설치하지 않습니다.

| 앱 컴포넌트 | Figma 노드 | 반영한 규격 |
| --- | --- | --- |
| Button `xs` | `7484:821` | S: 높이 32, radius 8, 글자 13 |
| Button `sm` | `7484:819` | M: 높이 38, radius 10, 글자 15 |
| Button 기본 | `7484:825` | L: 높이 48, radius 14, 글자 17 |
| Button `lg` | `7484:823` | XL: 높이 56, radius 16, 글자 17 |
| Button `secondary` | `22695:11533` | Brand Weak: 파란색 16% 배경 |
| Button 상태 | `25783:56008`, `22695:11914` | 눌림 검정 26% 혼합, 비활성 opacity 30% |
| Input, TextField | `50847:5293` | Box: 높이 54, radius 14, 입력 17, 라벨·도움말 13 |
| BottomSheetContent | `51592:74027` | 제목 20/1.35 bold, 좌우 24, 상단 21 |
| BottomSheetFooter | `51626:1590` | 좌우 20, 버튼 위 34, XL 버튼 |
| ListButton | `21698:3051` | 좌우 24, 위아래 12, 제목 17, 설명 13 |

색상은 `app/styles/index.css`의 기존 시맨틱 토큰에 연결합니다. 입력은 브라우저 네이티브 input으로 동작하고, 시트는 기존 접근성·포커스·뒤로 가기 처리를 유지합니다. 리더의 종이색과 사용자별 흔적 색은 독서 설정을 따릅니다.

추가 매핑:

| 앱 컴포넌트 | Figma 노드 | 반영한 규격 |
| --- | --- | --- |
| Badge | `23424:17176` | L Weak: 높이 29, radius 13, 글자 14/21 bold |
| Segmented | `748:4435` | L: 높이 48, 항목 40, radius 14/10 |
| ProgressBar | `44610:18474` | M: 높이 5, radius 2.5, track #e5e8eb |
| SearchField | `7937:1912`, `22721:23208` | 입력 영역 44, radius 12, 좌우 16, 검색 아이콘 24 |
| TabBar | `52732:11622` | 아이콘 24, 레이블 11/13.2, 간격 3 |
| CheckboxRow | `43021:9906`, `43021:9926` | Circle M: 24px, 제어형 체크박스·키보드 조작 |

| Chip, RemovableChip | `48081:12638`, `48081:12568` | S: 높이 32, 좌우 11, 13 semibold. M: 높이 38, 15. 선택 Fill은 `--chip-selected` |
| AlertDialog | `52332:21143` | 폭 311(최대 320), radius 24, 제목 20/1.35 bold, 설명 15/1.6, 버튼 L 가로 2개(취소 `weak`) |
| BottomCta | `22695:10080` | 위 그라데이션 36, 좌우 20, 아래 20+safe area, XL 버튼(56, radius 16), 보조 버튼 `weak` |
| Textarea, TextAreaField | `50817:11885` | Box Text Area: 최소 54, 좌우 16, 위아래 14, radius 14, 17 medium, 포커스 시 브랜드 5% 배경 |
| Slider | `47597:1966` | 레일 4(radius 2.5, `--progress-track`), 진행 브랜드색, 손잡이 26 흰색 + 테두리·그림자 18%, 위아래 18.5 |
| Toast | `46908:27156` | 하단 Fit: 알약, 회색 46% + 블러 15, 좌우 16/15·위아래 14, 간격 12, 아이콘 24, 15 semibold, 액션 버튼 31(13 semibold). sonner `unstyled` + `classNames`, `useNotice(message, tone, action)` |
| IconButton, TextButton | `2388:30933`, `2388:30929` | 터치 영역 44, 아이콘 24 / 13·14·15·17 semibold |
| ListHeader | `11184:783` | 좌우 24, 제목 17 bold `text-strong` |

## 타이포그래피와 색

`index.css`가 Tailwind 기본 글자 크기를 지우고 TDS 단계만 둡니다. 주 단계 `text-t1`(30)~`text-t7`(13),
보조 단계 `text-st2`·`st3`·`st7`~`st12`. `scripts/lint-tds.ts`(`arch:lint`)가 `text-[13px]`, `text-sm` 같은 클래스를 막습니다.
글자색은 Semantic/Text 순서대로 `text-strong` → `text-foreground` → `text-sub` → `text-muted-foreground`입니다.
화면 좌우 여백은 Global Side Padding M(24px, `px-6`)입니다.

검색 아이콘·하단 그라데이션·홈 아이콘은 MCP가 제공한 파일을 `assets/`에 내려받아 사용합니다.
SVG 원본은 수정하지 않고, 장식 이미지의 접근성은 사용하는 `<img alt="">`와 버튼/입력의
레이블에서 처리합니다. Biome의 `noSvgWithoutTitle` 예외는 이 외부 SVG 디렉터리에만 적용합니다.

## 아이콘

`tds-icon.tsx`는 아래 MCP 원본을 레지스트리에 연결합니다. 단색 아이콘은 투명도 마스크로
시맨틱 색상을 따릅니다. 단색 아이콘의 내부 구멍도 원본의 투명도로 보존합니다.
Figma의 24×24 슬롯과 내부 inset을 유지하며, SVG 파일 자체의 치수나 경로는 고치지 않습니다.
레이블은 사용하는 버튼/입력에 두고, 독립적으로 의미가 있는 아이콘은 `aria-label`을 지정합니다.
흔적 툴바는 `--toolbar`/`--toolbar-foreground`로 어두운 배경과 밝은 아이콘을 유지합니다.

| TDS 리소스 | 노드 |
| --- | --- |
| `icon-arrow-back-ios-center-mono` | `55068:183116` |
| `icon-arrow-right-mono` | `55068:182693` |
| `icon-arrow-down-mono` | `55068:182869` |
| `icon-arrow-up-mono` | `55068:182784` |
| `icon-heart-mono` | `55068:182924` |
| `icon-heart-whiteline-mono` | `55068:182766` |
| `icon-book-opened-mono` | `55068:183095` |
| `icon-bin-line-mono` | `55068:183018` |
| `icon-check-mono` | `55068:182958` |
| `icon-copy-mono` | `55068:182972` |
| `icon-exit-mono` | `55068:182818` |
| `icon-share-dots-mono` | `55068:182599` |
| `icon-dots-mono` | `55068:183120` |
| `icon-dots-vertical-1-mono` | `55068:183169` |
| `icon-x-mono` | `55068:182506` |
| `icon-refresh-mono` | `55068:182620` |
| `icon-bulb-mono` | `55068:182936` |
| `icon-chat-bubble-text-square-mono` | `55068:182908` |
| `icon-underline-mono` | `55068:182909` |
| `icon-line-pencil-mono` | `55068:183115` |
| `icon-text-mono` | `55068:182553` |
| `icon-filter-mono` | `55068:182757` |
| `icon-check-circle-mono` | `55068:182927` |
| `icon-exclamation-circle-mono` | `55068:182959` |
| `icon-emoji-mono` | `55068:182824` |
| `icon-chat-bubble-question-mono` | `55068:182912` |
| `icon-pencil-mono` | `55068:182660` |
| `icon-bookmark-mono` | `55068:183068` |
| `icon-document-mono` | `55068:182839` |

## 앱 테마와 반응

사용자 지정 메인은 `#008081`, 서브는 `#66B2B2`입니다. TDS 크기·간격·형태를 사용하면서
파란 브랜드 색과 체크박스 선택 색은 이 앱의 시맨틱 토큰으로 바꿉니다. AI도 기존 커스텀
그라데이션 대신 TDS twinkle(`55068:219778`) 모양에 같은 테마 색을 적용합니다.

반응은 `ReactionEmoji` 하나를 사용합니다. API의 Unicode 값은 그대로 두고,
선택기·본문 마커·카드·개수 버튼 모두 같은 TDS 원본으로 그립니다.

| 반응 | 노드 |
| --- | --- |
| ❤️ | `55070:808` |
| 💚 | `55070:4019` |
| 👍 | `55070:2819` |
| 😢 | `55070:1272` |
| 😮 | `55070:2636` |
| 😂 | `55070:4098` |
| 💡 | `55070:2974` |
| 🌱 | `55070:2376` |

## TDS에 없는 컴포넌트

TDS에 없을 때만 [원티드 디자인 시스템](https://www.figma.com/design/VbAvdgJlDgVgq37SSLIBcb)의 구조와 간격을 빌리고,
색·글자·radius는 TDS 토큰을 씁니다.

| 앱 컴포넌트 | 원티드 노드 | 반영한 규격 |
| --- | --- | --- |
| AvatarGroup, ReaderAvatar | `16215:26176`, `16215:25725` | 크기 24/32/40, 8px 겹침, 배경색 1.5px 테두리, 뒤 텍스트 14 semibold 간격 10 |
| 책 상세 흔적 카드 | `16215:29448` | 제목 15 semibold, 캡션 13 medium, 묶음 간격 4 |
