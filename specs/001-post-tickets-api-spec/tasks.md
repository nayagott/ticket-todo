# Tasks: POST /api/tickets — 티켓 생성 (FR-001)

**Input**: Design documents from `/specs/001-post-tickets-api-spec/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅

**Note**: 서버 측 구현(Route Handler, Service, Zod Schema, 테스트 TC-API-004~014)은 이미 완료. 잔여 작업은 클라이언트 측에 집중.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 의존성 없음)
- **[Story]**: 해당 태스크가 속한 유저 스토리 (US1, US2, US3)

---

## Phase 1: Setup — 현황 확인

**Purpose**: 서버 측 완료 상태 검증

- [x] T001 서버 측 구현 완료 상태 검증 — `npm run test -- --testPathPattern="api/tickets/__tests__/route"` 실행하여 TC-API-004~014 (11개) 통과 확인

**Checkpoint**: 11개 테스트 통과 확인 후 다음 단계 진행

---

## Phase 2: Foundational — 클라이언트 API 기반

**Purpose**: 모든 유저 스토리가 의존하는 클라이언트 API 함수

**⚠️ CRITICAL**: T002 완료 전에 US1~US3 구현 불가

- [x] T002 `ticketApi.create()` 함수 추가 — `src/client/api/ticketApi.ts` 에 `CreateTicketInput → Promise<TicketDto>` 구현

**Checkpoint**: Foundation ready — US1~US3 구현 가능

---

## Phase 3: User Story 1 — 필수 필드로 티켓 생성 (Priority: P1) 🎯 MVP

**Goal**: title 입력만으로 티켓을 생성하고 Backlog 칼럼에 즉시 표시한다.

**Independent Test**: 앱에서 "+" 버튼 클릭 → title 입력 → 제출 → Backlog 칼럼에 카드 추가됨.

### Implementation for User Story 1

- [x] T003 [US1] `useTickets` 훅에 `createTicket(input: CreateTicketInput)` 액션 추가 — `src/client/hooks/useTickets.ts` (T002 의존)
- [x] T004 [P] [US1] `CreateModal` 기본 컴포넌트 생성 — `src/client/components/Modal/CreateModal.tsx` (title 필드 + 제출/취소 버튼)
- [x] T005 [US1] `Header` 컴포넌트 신규 생성 및 `Board`에 "+" 버튼 + `CreateModal` 연결 — `src/client/components/Board/Header.tsx`, `Board.tsx` (T003, T004 의존)

**Checkpoint**: "+" 클릭 → title 입력 → 제출 → Backlog 카드 추가 흐름이 E2E로 동작

---

## Phase 4: User Story 2 — 선택 필드 포함 티켓 생성 (Priority: P2)

**Goal**: description, priority, startedAt, dueDate 선택 필드를 함께 입력해 상세 티켓을 생성한다.

**Independent Test**: CreateModal에서 모든 선택 필드 입력 후 제출 → TicketDto에 해당 값 반영됨.

### Implementation for User Story 2

- [x] T006 [US2] `CreateModal`에 선택 필드 추가 — `src/client/components/Modal/CreateModal.tsx` 에 `description`(textarea), `priority`(select: Low/Medium/High), `startedAt`(date input), `dueDate`(date input) 폼 요소 추가

**Checkpoint**: US1 흐름 유지 + 선택 필드 입력값이 생성된 카드에 반영됨

---

## Phase 5: User Story 3 — 유효하지 않은 입력 거부 (Priority: P3)

**Goal**: title 누락·길이 초과·priority 열거값 오류 등 클라이언트 검증 실패 시 인라인 에러를 표시하고 서버 요청을 차단한다.

**Independent Test**: title 빈 상태로 제출 → 서버 호출 없이 "title은 필수입니다" 에러 메시지 표시됨.

### Implementation for User Story 3

- [x] T007 [US3] `CreateModal`에 `createTicketSchema.safeParse()` 클라이언트 검증 추가 — `src/client/components/Modal/CreateModal.tsx` 제출 핸들러에 폼 제출 전 Zod 검증 실행 (Constitution IV: 서버와 독립된 클라이언트 검증)
- [x] T008 [US3] 필드별 Zod 에러 메시지 인라인 표시 — `src/client/components/Modal/CreateModal.tsx` 에 각 폼 필드 하단 에러 텍스트 렌더링

**Checkpoint**: 4가지 유효성 실패 케이스(title 누락, 256자, priority 오류, dueDate 형식)가 서버 요청 없이 클라이언트에서 차단됨

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 접근성·테스트·완성도

- [x] T009 [P] `CreateModal` 접근성 속성 추가 — `src/client/components/Modal/CreateModal.tsx` 에 `role="dialog"`, `aria-modal="true"`, `aria-labelledby` 및 ESC 키 닫기 구현 (NFR-010~012)
- [x] T010 [P] `CreateModal` 컴포넌트 테스트 작성 — `src/client/components/Modal/__tests__/CreateModal.test.tsx` (title만 제출, title 누락, priority 선택, 취소, role="dialog")
- [x] T011 `useTickets` 훅 `createTicket`·`appendTicket` 단위 테스트 추가 — `src/client/hooks/__tests__/useTickets.test.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 즉시 시작 가능 — 테스트 검증만
- **Foundational (Phase 2)**: Phase 1 이후 — US1~US3 전체 차단
- **US1 (Phase 3)**: Phase 2 완료 후 시작 — T003(훅) → T004(모달) 병렬 → T005(연결)
- **US2 (Phase 4)**: US1 완료 후 (CreateModal 기반 위에서 확장)
- **US3 (Phase 5)**: US2 완료 후 (모든 필드 구현 후 검증 레이어 추가)
- **Polish (Phase 6)**: US3 완료 후 병렬 실행 가능

### User Story Dependencies

- **US1 (P1)**: Foundation 완료 후 독립 시작 가능
- **US2 (P2)**: US1 CreateModal 존재 전제 (같은 파일 확장)
- **US3 (P3)**: US2의 폼 필드 전체 구현 후 검증 레이어 추가

### Within Phase 3 (US1)

```
T002 (ticketApi.create) 완료
        │
        ├──→ T003 (useTickets 훅) ──┐
        │                           │
        └──→ T004 (CreateModal)  ───┴──→ T005 (버튼 연결)
```

### Parallel Opportunities

- T004는 T003과 병렬 실행 가능 (서로 다른 파일)
- Phase 6의 T009, T010, T011은 순서 무관하게 병렬 가능

---

## Parallel Example: User Story 1

```bash
# T002 완료 후, T003과 T004를 동시에 시작:
Task: "T003 useTickets 훅에 createTicket 액션 추가 — src/client/hooks/useTickets.ts"
Task: "T004 CreateModal 기본 컴포넌트 생성 — src/client/components/Modal/CreateModal.tsx"

# T003 + T004 완료 후:
Task: "T005 BacklogPanel에 + 버튼 및 CreateModal 연결 — src/client/components/Column/BacklogPanel.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. T001: 서버 테스트 11개 통과 확인
2. T002: `ticketApi.create()` 추가
3. T003 + T004 병렬: 훅 확장 + 기본 모달 구현
4. T005: 버튼 연결
5. **STOP and VALIDATE**: Backlog에 title만 입력해 카드 추가 동작 확인
6. 배포/데모 가능

### Incremental Delivery

1. Setup + Foundation → `ticketApi.create()` 준비
2. US1 → title만으로 카드 생성 → **MVP 배포**
3. US2 → 선택 필드 추가 → 데모
4. US3 → 클라이언트 Zod 검증 → 완성
5. Polish → 접근성 + 테스트 → 배포

---

## Notes

- [P] 태스크 = 다른 파일, 의존성 없음 → 동시 실행 가능
- [US#] 라벨 = 해당 유저 스토리와 1:1 추적
- 서버 측 코드(`src/server/`, `src/app/api/`) 는 이미 완료. 수정 불필요
- `createTicketSchema`는 `src/shared/schemas/ticketSchema.ts`에서 import (서버·클라이언트 공유)
- `docs/COMPONENT_SPEC.md` 참조 — CreateModal Props·State·이벤트 명세 확인 후 구현
