# 아키텍처: Feature-Sliced Design

| 레이어 | 담는 것 | import 가능 대상 | 슬라이스 이름 |
| --- | --- | --- | --- |
| `app/` | 부트스트랩: Stackflow, provider, 전역 스타일 (비즈니스 로직 없음) | 아래 전부 | 없음 (세그먼트만) |
| `pages/` | 화면당 슬라이스 하나. 아래 레이어를 조합 | widgets, features, entities, shared | 화면 이름: `home`, `todo-detail` |
| `widgets/` | 큰 조합 UI 블록 (여러 feature/entity를 묶음) | features, entities, shared | 위치가 아니라 정체: `todo-board` |
| `features/` | 슬라이스당 사용자 행동 하나 | entities, shared | 동사: `like-post`, 또는 엔티티로 묶기: `todo/add` |
| `entities/` | 도메인 데이터: 타입, 조회 쿼리, 단건 UI | shared | 단수 명사: `todo`, `user-profile` |
| `shared/` | 비즈니스와 무관한 프리미티브 (UI 키트, API 클라이언트, `cn`) | 자기 세그먼트끼리 | 없음 (세그먼트만) |

- 레이어는 **아래로만** import하고, 같은 레이어의 슬라이스끼리는 서로 import하지
  않습니다. 공유할 로직은 한 레이어 아래로 내립니다(데이터 성격이면
  `entities`, 범용이면 `shared`).
- 슬라이스는 공개 API인 `index.ts`를 통해서만 import합니다.
- 이름은 kebab-case입니다. 같은 엔티티에 대한 feature가 여러 개면 묶으세요
  (`todo/add`, `todo/delete`). Steiger의 `fsd/repetitive-naming`이
  `add-todo`와 `delete-todo`를 나란히 두는 것을 거부합니다.

`bun run arch:lint`(Steiger)가 이 규칙을 강제하고, 위반하면 커밋이 실패합니다.
각 레이어의 `README.md`는 세그먼트와 그 레이어 고유의 컨벤션만 다룹니다.

슬라이스는 폴더를 직접 만들지 말고 생성기로 만드세요.

```bash
bun run new:slice -- --layer=features --name=todo/archive
```
