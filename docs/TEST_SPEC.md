# TEST_SPEC.md — TicketTodo

> 작성일: 2026-06-15
> 버전: v1.1
> 기반 문서: REQUIREMENTS.md v1.1 · PRD.md v1.0 · TRD.md v1.2 · DATA_MODEL.md v1.0 · API_SPEC.md v1.1 · COMPONENT_SPEC.md v1.0

---

## 목차

1. [개요](#1-개요)
2. [API 테스트케이스](#2-api-테스트케이스-tc-api-)
3. [컴포넌트·훅·유틸 테스트케이스](#3-컴포넌트훅유틸-테스트케이스)
4. [통합 테스트케이스](#4-통합-테스트케이스-tc-int-)
5. [추적 매트릭스](#5-추적-매트릭스)
6. [변경 이력](#6-변경-이력)

---

## 1. 개요

### 1-1. 테스트 전략

| 구분 | 도구 | 범위 |
|------|------|------|
| API Route 테스트 | Jest + `next-test-api-route-handler` | Route Handler 입출력, 에러 응답 형식 |
| 컴포넌트 테스트 | Jest + React Testing Library | Props 렌더링, 이벤트, 조건부 표시 |
| 접근성 테스트 | jest-axe | role, aria-* 속성, 키보드 포커스 |
| 훅 테스트 | Jest + `@testing-library/react-hooks` | 상태 변화, 낙관적 업데이트·롤백 |
| 유틸 테스트 | Jest | 순수 함수 경계값·분기 |
| 통합 테스트 | Jest + RTL + MSW | 사용자 시나리오 A~E 전체 흐름 |

### 1-2. TC-ID 체계

| 접두사 | 대상 | 예시 |
|--------|------|------|
| `TC-API-###` | API Route Handler | TC-API-001 |
| `TC-COMP-###` | UI 컴포넌트 | TC-COMP-001 |
| `TC-HOOK-###` | 커스텀 훅 | TC-HOOK-001 |
| `TC-UTIL-###` | 유틸 함수 | TC-UTIL-001 |
| `TC-INT-###` | 통합(E2E-lite) | TC-INT-001 |

### 1-3. 분류 기호

| 기호 | 의미 |
|------|------|
| ✅ Happy | 정상 흐름 |
| ❌ Error | 에러·예외 흐름 |
| 🔲 Edge | 경계값·엣지케이스 |
| ♿ A11y | 접근성 |

### 1-4. 테스트 파일 구조

```
__tests__/
  integration/
    scenarioA.test.tsx
    scenarioB.test.tsx
    scenarioC.test.tsx
    scenarioD.test.tsx
    scenarioE.test.tsx
app/
  api/tickets/
    __tests__/route.test.ts
    [id]/
      __tests__/route.test.ts
src/
  client/
    components/
      Board/__tests__/Board.test.tsx
      Board/__tests__/Header.test.tsx
      Board/__tests__/FilterBar.test.tsx
      Column/__tests__/BacklogPanel.test.tsx
      Column/__tests__/Column.test.tsx
      Card/__tests__/TicketCard.test.tsx
      Card/__tests__/PriorityBadge.test.tsx
      Card/__tests__/DueDateBadge.test.tsx
      Modal/__tests__/CreateModal.test.tsx
      Modal/__tests__/DetailModal.test.tsx
      Modal/__tests__/ConfirmDialog.test.tsx
    hooks/__tests__/useTickets.test.ts
    hooks/__tests__/useDnd.test.ts
  shared/
    constants/__tests__/status.test.ts
    utils/__tests__/filter.test.ts
```

---

## 2. API 테스트케이스 (TC-API-\*)

> 테스트 파일: `app/api/tickets/__tests__/route.test.ts` / `app/api/tickets/[id]/__tests__/route.test.ts`  
> 공통 전제조건: DB는 Jest 전역 setup에서 트랜잭션 롤백 또는 인메모리 Mock으로 격리

---

### 2-1. GET /api/tickets (FR-002)

| TC-ID | 테스트명 | 분류 | 전제조건 | 입력/액션 | 기대 결과 | 연관 |
|-------|---------|:----:|---------|---------|---------|------|
| TC-API-001 | 전체 목록 정상 조회 | ✅ Happy | DB에 티켓 2개 존재 (order: 2000, 1000) | `GET /api/tickets` | 200, `TicketDto[]`, order 오름차순(1000→2000) | FR-002 |
| TC-API-002 | 티켓 없을 때 빈 배열 반환 | ✅ Happy | DB 비어 있음 | `GET /api/tickets` | 200, `[]` | FR-002 |
| TC-API-003 | DB 오류 시 500 및 콘솔 로깅 | ❌ Error | DB 연결 실패 Mock | `GET /api/tickets` | 500, `{ "error": "...", "details": {} }`, `console.error` 1회 호출 | FR-002, NFR-025 |

---

### 2-2. POST /api/tickets (FR-001)

| TC-ID | 테스트명 | 분류 | 전제조건 | 입력/액션 | 기대 결과 | 연관 |
|-------|---------|:----:|---------|---------|---------|------|
| TC-API-004 | 필수 필드만으로 티켓 생성 | ✅ Happy | Backlog 칼럼 티켓 없음 | `POST` body: `{ title: "테스트" }` | 201, `TicketDto` (status: `"Backlog"`, order: 1000) | FR-001 |
| TC-API-005 | 전체 필드 입력 티켓 생성 | ✅ Happy | Backlog 티켓 1개 존재 (order: 1000) | `POST` body: 전체 필드 (title·description·priority·startedAt·dueDate) | 201, 모든 필드 반환, order: 2000 | FR-001 |
| TC-API-006 | title 누락 → 400 | ❌ Error | — | `POST` body: `{}` | 400, `{ "error": "...", "details": { "title": [...] } }` | FR-001, NFR-016 |
| TC-API-007 | title 빈 문자열 → 400 | 🔲 Edge | — | `POST` body: `{ title: "" }` | 400, title 에러 포함 | FR-001, NFR-016 |
| TC-API-008 | title 255자 → 201 (경계값) | 🔲 Edge | — | `POST` body: `{ title: "A".repeat(255) }` | 201, 정상 생성 | FR-001, NFR-016 |
| TC-API-009 | title 256자 → 400 (경계값) | 🔲 Edge | — | `POST` body: `{ title: "A".repeat(256) }` | 400, title 에러 포함 | FR-001, NFR-016 |
| TC-API-010 | 허용값 외 priority → 400 | ❌ Error | — | `POST` body: `{ title: "T", priority: "Critical" }` | 400, priority 에러 포함 | FR-001, NFR-016 |
| TC-API-011 | 잘못된 dueDate 형식 → 400 | ❌ Error | — | `POST` body: `{ title: "T", dueDate: "2026/06/15" }` | 400, dueDate 에러 포함 | FR-001, NFR-016 |
| TC-API-012 | order 자동 계산 — 최초 삽입 | 🔲 Edge | Backlog 티켓 없음 | `POST` body: `{ title: "T" }` | 201, order: 1000 | FR-001, API_SPEC §5 |
| TC-API-013 | order 자동 계산 — 기존 MAX+1000 | 🔲 Edge | Backlog 최대 order: 3000 | `POST` body: `{ title: "T" }` | 201, order: 4000 | FR-001, API_SPEC §5 |
| TC-API-014 | DB 오류 시 500 및 콘솔 로깅 | ❌ Error | DB 삽입 실패 Mock | `POST` body: `{ title: "T" }` | 500, `console.error` 1회 호출 | FR-001, NFR-025 |

---

### 2-3. GET /api/tickets/:id (FR-003)

| TC-ID | 테스트명 | 분류 | 전제조건 | 입력/액션 | 기대 결과 | 연관 |
|-------|---------|:----:|---------|---------|---------|------|
| TC-API-015 | 단건 조회 정상 | ✅ Happy | 해당 id 티켓 존재 | `GET /api/tickets/{uuid}` | 200, `TicketDto` (id 일치) | FR-003 |
| TC-API-016 | 미존재 id → 404 | ❌ Error | 해당 id 없음 | `GET /api/tickets/{random-uuid}` | 404, `{ "error": "Ticket not found", "details": {} }` | FR-003 |
| TC-API-017 | DB 오류 → 500 및 콘솔 로깅 | ❌ Error | DB 조회 실패 Mock | `GET /api/tickets/{uuid}` | 500, `console.error` 1회 호출 | FR-003, NFR-025 |

---

### 2-4. PATCH /api/tickets/:id (FR-004, FR-008, FR-009, FR-010)

| TC-ID | 테스트명 | 분류 | 전제조건 | 입력/액션 | 기대 결과 | 연관 |
|-------|---------|:----:|---------|---------|---------|------|
| TC-API-018 | 필드 수정 — 전달된 필드만 변경 | ✅ Happy | 티켓 존재 | `PATCH` body: `{ title: "New", priority: "High" }` | 200, title·priority 변경, 나머지 필드 유지 | FR-004 |
| TC-API-019 | status 변경 (칼럼 이동) | ✅ Happy | 티켓 존재 (status: "Backlog") | `PATCH` body: `{ status: "TODO", order: 1500 }` | 200, status: `"TODO"`, order: 1500 | FR-009 |
| TC-API-020 | order 단독 변경 (칼럼 내 순서) | ✅ Happy | 티켓 존재 | `PATCH` body: `{ order: 2500 }` | 200, order: 2500, status 유지 | FR-010 |
| TC-API-021 | description null 전달 → 필드 삭제 | ✅ Happy | 티켓 description 존재 | `PATCH` body: `{ description: null }` | 200, description: null | FR-004 |
| TC-API-022 | title 빈 문자열 → 400 | ❌ Error | 티켓 존재 | `PATCH` body: `{ title: "" }` | 400, title 에러 포함 | FR-004, NFR-016 |
| TC-API-023 | 허용값 외 status → 400 | ❌ Error | 티켓 존재 | `PATCH` body: `{ status: "Pending" }` | 400, status 에러 포함 | FR-009, NFR-016 |
| TC-API-024 | order 소수점 → 400 | 🔲 Edge | 티켓 존재 | `PATCH` body: `{ order: 1500.5 }` | 400, order 에러 포함 | FR-008, NFR-016 |
| TC-API-025 | 미존재 id → 404 | ❌ Error | 해당 id 없음 | `PATCH` body: `{ title: "T" }` | 404, `{ "error": "Ticket not found" }` | FR-004 |
| TC-API-026 | DB 오류 → 500 및 콘솔 로깅 | ❌ Error | DB 업데이트 실패 Mock | `PATCH` body: `{ title: "T" }` | 500, `console.error` 1회 호출 | FR-004, NFR-025 |

---

### 2-5. DELETE /api/tickets/:id (FR-005)

| TC-ID | 테스트명 | 분류 | 전제조건 | 입력/액션 | 기대 결과 | 연관 |
|-------|---------|:----:|---------|---------|---------|------|
| TC-API-027 | 티켓 정상 삭제 | ✅ Happy | 티켓 존재 | `DELETE /api/tickets/{uuid}` | 204, 응답 body 없음, DB에서 해당 행 제거 | FR-005 |
| TC-API-028 | 미존재 id → 404 | ❌ Error | 해당 id 없음 | `DELETE /api/tickets/{random-uuid}` | 404, `{ "error": "Ticket not found" }` | FR-005 |
| TC-API-029 | DB 오류 → 500 및 콘솔 로깅 | ❌ Error | DB 삭제 실패 Mock | `DELETE /api/tickets/{uuid}` | 500, `console.error` 1회 호출 | FR-005, NFR-025 |

---

## 3. 컴포넌트·훅·유틸 테스트케이스

---

### 3-1. Board

> 파일: `src/client/components/Board/__tests__/Board.test.tsx`  
> MSW로 `GET /api/tickets` Mock 처리

| TC-ID | 테스트명 | 분류 | 전제조건 | 입력/액션 | 기대 결과 | 연관 |
|-------|---------|:----:|---------|---------|---------|------|
| TC-COMP-001 | 초기 렌더 — 전체 구조 표시 | ✅ Happy | tickets 4건 (칼럼별 1건) | 렌더 | Header·FilterBar·BacklogPanel·Column(3개) 모두 렌더링, aria-live 영역 존재 | FR-006, NFR-010 |
| TC-COMP-002 | 새 업무 버튼 클릭 → CreateModal 오픈 | ✅ Happy | — | Header의 "새 업무" 클릭 | CreateModal 표시 (`isOpen=true`) | FR-001 |
| TC-COMP-003 | 카드 클릭 → DetailModal 오픈 | ✅ Happy | tickets 1건 | TicketCard 클릭 | DetailModal 표시 (`ticketId` 설정) | FR-016 |
| TC-COMP-004 | DnD 완료 → aria-live 메시지 갱신 | ✅ Happy | tickets 존재 | onDragEnd 이벤트 발생 | aria-live 영역 텍스트에 이동 메시지 포함 | NFR-010 |

---

### 3-2. Header

> 파일: `src/client/components/Board/__tests__/Header.test.tsx`

| TC-ID | 테스트명 | 분류 | 전제조건 | 입력/액션 | 기대 결과 | 연관 |
|-------|---------|:----:|---------|---------|---------|------|
| TC-COMP-005 | "새 업무" 버튼 렌더링 | ✅ Happy | — | 렌더 | `<button>` 태그로 "새 업무" 텍스트 존재 | FR-001, NFR-011 |
| TC-COMP-006 | 버튼 클릭 → onNewTicket 호출 | ✅ Happy | — | 버튼 클릭 | `onNewTicket` mock 1회 호출 | FR-001 |

---

### 3-3. FilterBar

> 파일: `src/client/components/Board/__tests__/FilterBar.test.tsx`

| TC-ID | 테스트명 | 분류 | 전제조건 | 입력/액션 | 기대 결과 | 연관 |
|-------|---------|:----:|---------|---------|---------|------|
| TC-COMP-007 | 초기 상태 — 두 버튼 모두 비활성 | ✅ Happy | `filter: { overdue: false, thisWeek: false }` | 렌더 | 두 버튼 `aria-pressed="false"` | FR-017, FR-018, NFR-011 |
| TC-COMP-008 | 이번주 버튼 클릭 → onFilterChange('thisWeek') 호출 | ✅ Happy | — | "이번주 업무" 클릭 | `onFilterChange` mock (`"thisWeek"` 인자) 1회 호출 | FR-018 |
| TC-COMP-009 | 초과 버튼 클릭 → onFilterChange('overdue') 호출 | ✅ Happy | — | "일정이 초과된 업무" 클릭 | `onFilterChange` mock (`"overdue"` 인자) 1회 호출 | FR-017 |
| TC-COMP-010 | 활성 버튼 aria-pressed 반영 | ✅ Happy | `filter: { overdue: true, thisWeek: false }` | 렌더 | 초과 버튼 `aria-pressed="true"`, 이번주 버튼 `aria-pressed="false"` | FR-017, ♿ A11y |
| TC-COMP-011 | 두 버튼 동시 활성 가능 (독립 토글) | 🔲 Edge | `filter: { overdue: true, thisWeek: true }` | 렌더 | 두 버튼 모두 `aria-pressed="true"` | FR-017, FR-018 |

---

### 3-4. BacklogPanel

> 파일: `src/client/components/Column/__tests__/BacklogPanel.test.tsx`

| TC-ID | 테스트명 | 분류 | 전제조건 | 입력/액션 | 기대 결과 | 연관 |
|-------|---------|:----:|---------|---------|---------|------|
| TC-COMP-012 | tickets 배열 기반 카드 렌더링 | ✅ Happy | tickets 3건 | 렌더 | TicketCard 3개 렌더링 | FR-007 |
| TC-COMP-013 | role="list" 적용 | ✅ Happy | — | 렌더 | 컨테이너에 `role="list"` 존재 | NFR-011, ♿ A11y |
| TC-COMP-014 | 빈 배열 — 드롭 영역 컨테이너 유지 | 🔲 Edge | tickets: [] | 렌더 | 카드 없지만 컨테이너 DOM 존재 (드롭 가능 상태) | FR-009 |

---

### 3-5. Column

> 파일: `src/client/components/Column/__tests__/Column.test.tsx`

| TC-ID | 테스트명 | 분류 | 전제조건 | 입력/액션 | 기대 결과 | 연관 |
|-------|---------|:----:|---------|---------|---------|------|
| TC-COMP-015 | status prop 기반 헤더 텍스트 | ✅ Happy | `status: "In Progress"` | 렌더 | 헤더에 "In Progress" 텍스트 표시 | FR-006 |
| TC-COMP-016 | tickets 배열 기반 카드 렌더링 | ✅ Happy | tickets 2건 | 렌더 | TicketCard 2개 렌더링 | FR-007 |
| TC-COMP-017 | role="list" 적용 | ✅ Happy | — | 렌더 | `role="list"` 존재 | NFR-011, ♿ A11y |
| TC-COMP-018 | 빈 칼럼 — 컨테이너 유지 | 🔲 Edge | tickets: [] | 렌더 | 빈 칼럼 컨테이너 DOM 존재 | FR-009 |

---

### 3-6. TicketCard

> 파일: `src/client/components/Card/__tests__/TicketCard.test.tsx`

| TC-ID | 테스트명 | 분류 | 전제조건 | 입력/액션 | 기대 결과 | 연관 |
|-------|---------|:----:|---------|---------|---------|------|
| TC-COMP-019 | 제목 항상 표시 | ✅ Happy | ticket: `{ title: "T", description: null, priority: null, dueDate: null }` | 렌더 | 제목 "T" 텍스트 존재 | FR-015 |
| TC-COMP-020 | description 없으면 미표시 | ✅ Happy | ticket: `{ description: null }` | 렌더 | 설명 영역 DOM 없음 | FR-015 |
| TC-COMP-021 | priority 없으면 PriorityBadge 미표시 | ✅ Happy | ticket: `{ priority: null }` | 렌더 | PriorityBadge DOM 없음 | FR-015 |
| TC-COMP-022 | dueDate 없으면 DueDateBadge 미표시 | ✅ Happy | ticket: `{ dueDate: null }` | 렌더 | DueDateBadge DOM 없음 | FR-015 |
| TC-COMP-023 | 기한 초과 → border-red-500 (FR-013) | 🔲 Edge | dueDate: 어제, status: "TODO" | 렌더 | 카드 루트 요소에 `border-red-500` 클래스 | FR-013, NFR-012 |
| TC-COMP-024 | D-3 이내 → border-orange-400 (FR-012) | 🔲 Edge | dueDate: 오늘+3일, status: "TODO" | 렌더 | `border-orange-400` 클래스 | FR-012, NFR-012 |
| TC-COMP-025 | D-3 당일(diffDays=3) → border-orange-400 (경계값) | 🔲 Edge | dueDate: 오늘+3일 정확히 | 렌더 | `border-orange-400` | FR-012 |
| TC-COMP-026 | D-4 → border-gray-200 (경계값) | 🔲 Edge | dueDate: 오늘+4일 | 렌더 | `border-gray-200` | FR-014 |
| TC-COMP-027 | status='Done', 기한 초과여도 border-gray-200 | 🔲 Edge | dueDate: 어제, status: "Done" | 렌더 | `border-gray-200` (Done 제외 규칙) | FR-012~014 |
| TC-COMP-028 | 카드 클릭 → onClick(ticket.id) 호출 | ✅ Happy | — | 카드 클릭 | `onClick` mock (`ticket.id` 인자) 1회 호출 | FR-016 |
| TC-COMP-029 | role="listitem" 적용 | ✅ Happy | — | 렌더 | `role="listitem"` 존재 | NFR-011, ♿ A11y |
| TC-COMP-030 | 키보드 Enter → onClick 호출 | ✅ Happy | — | 카드에 Enter 키 이벤트 | `onClick` mock 1회 호출 | NFR-008, ♿ A11y |

---

### 3-7. PriorityBadge

> 파일: `src/client/components/Card/__tests__/PriorityBadge.test.tsx`

| TC-ID | 테스트명 | 분류 | 전제조건 | 입력/액션 | 기대 결과 | 연관 |
|-------|---------|:----:|---------|---------|---------|------|
| TC-COMP-031 | Low — 회색 계열 클래스 | ✅ Happy | `priority: "Low"` | 렌더 | 회색 계열 Tailwind 클래스 존재, "Low" 텍스트 표시 | FR-015 |
| TC-COMP-032 | Medium — 파란색 계열 클래스 | ✅ Happy | `priority: "Medium"` | 렌더 | 파란색 계열 클래스, "Medium" 텍스트 | FR-015 |
| TC-COMP-033 | High — 빨간색 계열 클래스 | ✅ Happy | `priority: "High"` | 렌더 | 빨간색 계열 클래스, "High" 텍스트 | FR-015 |

---

### 3-8. DueDateBadge

> 파일: `src/client/components/Card/__tests__/DueDateBadge.test.tsx`

| TC-ID | 테스트명 | 분류 | 전제조건 | 입력/액션 | 기대 결과 | 연관 |
|-------|---------|:----:|---------|---------|---------|------|
| TC-COMP-034 | ISO 8601 → 읽기 쉬운 날짜 표시 | ✅ Happy | `dueDate: "2026-06-20T00:00:00.000Z"` | 렌더 | 날짜 텍스트 표시 (원시 ISO 문자열 미노출) | FR-015 |
| TC-COMP-035 | 시간대 무관 날짜 일관성 | 🔲 Edge | `dueDate: "2026-06-20T23:59:59.999Z"` | 렌더 | 날짜 부분만 표시, 시간 미노출 | FR-015 |

---

### 3-9. CreateModal

> 파일: `src/client/components/Modal/__tests__/CreateModal.test.tsx`

| TC-ID | 테스트명 | 분류 | 전제조건 | 입력/액션 | 기대 결과 | 연관 |
|-------|---------|:----:|---------|---------|---------|------|
| TC-COMP-036 | isOpen=false → 미렌더링 | ✅ Happy | `isOpen: false` | 렌더 | 모달 DOM 없음 | FR-001 |
| TC-COMP-037 | isOpen=true → 폼 필드 렌더링 | ✅ Happy | `isOpen: true` | 렌더 | title·description·priority·startedAt·dueDate 입력 필드 존재 | FR-001 |
| TC-COMP-038 | 제목 미입력 → 저장 버튼 비활성 | ❌ Error | title: "" | 렌더 | 저장 버튼 `disabled` | NFR-016 |
| TC-COMP-039 | 제목 255자 입력 → 저장 버튼 활성 (경계값) | 🔲 Edge | title: "A"×255 | 입력 후 렌더 | 저장 버튼 활성화 | NFR-016 |
| TC-COMP-040 | 제목 256자 입력 → 저장 버튼 비활성 (경계값) | 🔲 Edge | title: "A"×256 | 입력 후 렌더 | 저장 버튼 `disabled` | NFR-016 |
| TC-COMP-041 | 유효 입력 후 저장 → createTicket 호출 및 모달 닫힘 | ✅ Happy | `createTicket` MSW Mock | title 입력 후 저장 클릭 | `createTicket` 1회 호출, `onClose` 1회 호출 | FR-001 |
| TC-COMP-042 | ESC / 취소 → onClose 호출, API 미호출 | ✅ Happy | — | ESC 키 입력 | `onClose` 호출, `createTicket` 미호출 | FR-001 |
| TC-COMP-043 | API 실패 → 토스트 표시, 모달 유지 | ❌ Error | `createTicket` 500 Mock | 저장 클릭 | 에러 토스트 표시, 모달 닫히지 않음 | NFR-025 |

---

### 3-10. DetailModal

> 파일: `src/client/components/Modal/__tests__/DetailModal.test.tsx`

| TC-ID | 테스트명 | 분류 | 전제조건 | 입력/액션 | 기대 결과 | 연관 |
|-------|---------|:----:|---------|---------|---------|------|
| TC-COMP-044 | ticketId=null → 미렌더링 | ✅ Happy | `ticketId: null` | 렌더 | 모달 DOM 없음 | FR-016 |
| TC-COMP-045 | 전체 필드 표시 | ✅ Happy | ticket 전체 필드 존재 | 렌더 | title·description·priority·startedAt·dueDate·status·createdAt 텍스트 표시 | FR-016 |
| TC-COMP-046 | 필드 클릭 → 편집 모드 전환 | ✅ Happy | — | title 영역 클릭 | title 입력 필드 활성화 | FR-004, FR-016 |
| TC-COMP-047 | 수정 후 저장 → updateTicket 호출 및 onUpdated 콜백 | ✅ Happy | `updateTicket` MSW Mock | title 수정 후 저장 | `updateTicket` 1회 호출, `onUpdated(ticket)` 1회 호출 | FR-004 |
| TC-COMP-048 | 삭제 버튼 클릭 → ConfirmDialog 표시 | ✅ Happy | — | 삭제 버튼 클릭 | ConfirmDialog 렌더링 | FR-005, NFR-017 |
| TC-COMP-049 | ConfirmDialog 취소 → 모달 유지, 삭제 미실행 | ✅ Happy | — | 삭제 버튼 → 취소 클릭 | `deleteTicket` 미호출, DetailModal 유지 | NFR-017 |
| TC-COMP-050 | ConfirmDialog 확인 → deleteTicket 및 onDeleted | ✅ Happy | `deleteTicket` MSW Mock | 삭제 버튼 → 확인 클릭 | `deleteTicket` 1회 호출, `onDeleted(id)` 1회 호출 | FR-005 |
| TC-COMP-051 | ESC → onClose 호출 | ✅ Happy | — | ESC 키 | `onClose` 1회 호출 | FR-016 |

---

### 3-11. ConfirmDialog

> 파일: `src/client/components/Modal/__tests__/ConfirmDialog.test.tsx`

| TC-ID | 테스트명 | 분류 | 전제조건 | 입력/액션 | 기대 결과 | 연관 |
|-------|---------|:----:|---------|---------|---------|------|
| TC-COMP-052 | isOpen=false → 미렌더링 | ✅ Happy | `isOpen: false` | 렌더 | 다이얼로그 DOM 없음 | NFR-017 |
| TC-COMP-053 | message prop 텍스트 표시 | ✅ Happy | `message: "정말 삭제하시겠습니까?"` | 렌더 | 메시지 텍스트 존재 | NFR-017 |
| TC-COMP-054 | 확인 클릭 → onConfirm 호출 | ✅ Happy | — | 확인 버튼 클릭 | `onConfirm` mock 1회 호출 | FR-005 |
| TC-COMP-055 | 취소 클릭 → onCancel 호출 | ✅ Happy | — | 취소 버튼 클릭 | `onCancel` mock 1회 호출 | NFR-017 |
| TC-COMP-056 | role="alertdialog", aria-modal="true" 적용 | ✅ Happy | `isOpen: true` | 렌더 | `role="alertdialog"`, `aria-modal="true"` 존재 | NFR-011, ♿ A11y |

---

### 3-12. useTickets 훅

> 파일: `src/client/hooks/__tests__/useTickets.test.ts`  
> MSW로 API Mock 처리

| TC-ID | 테스트명 | 분류 | 전제조건 | 입력/액션 | 기대 결과 | 연관 |
|-------|---------|:----:|---------|---------|---------|------|
| TC-HOOK-001 | 마운트 시 GET 호출 → tickets 상태 저장 | ✅ Happy | MSW: GET → 티켓 3건 반환 | 훅 마운트 | `tickets.length === 3`, `isLoading` false | FR-002 |
| TC-HOOK-002 | createTicket → POST 후 tickets 갱신 | ✅ Happy | MSW: POST → 신규 티켓 반환 | `createTicket({ title: "T" })` | `tickets`에 신규 티켓 포함 | FR-001 |
| TC-HOOK-003 | updateTicket → PATCH 후 해당 티켓 교체 | ✅ Happy | MSW: PATCH → 수정된 티켓 반환 | `updateTicket(id, { title: "New" })` | `tickets` 내 해당 id 티켓 title 변경 | FR-004 |
| TC-HOOK-004 | deleteTicket → DELETE 후 해당 티켓 제거 | ✅ Happy | MSW: DELETE → 204 | `deleteTicket(id)` | `tickets`에서 해당 id 제거 | FR-005 |
| TC-HOOK-005 | moveTicket → 낙관적 업데이트 즉시 반영 | ✅ Happy | MSW: PATCH 지연 응답 (300ms) | `moveTicket(id, "TODO", 1000)` | API 응답 전 `tickets` 내 해당 티켓 status 즉시 변경 | FR-011, NFR-013 |
| TC-HOOK-006 | moveTicket → 성공 시 서버 응답으로 재동기화 | ✅ Happy | MSW: PATCH → 서버 응답 반환 | `moveTicket(id, "TODO", 1000)` | 서버 응답값으로 해당 티켓 최종 갱신 | NFR-014 |
| TC-HOOK-007 | moveTicket → API 실패 시 이전 상태 롤백 | ❌ Error | MSW: PATCH → 500 | `moveTicket(id, "TODO", 1000)` | 실패 후 tickets 내 해당 티켓 status 원복 | NFR-013 |
| TC-HOOK-008 | API 오류 → error 상태 설정 | ❌ Error | MSW: GET → 500 | 훅 마운트 | `error` 상태 non-null, `tickets: []` | NFR-025 |

---

### 3-13. useDnd 훅

> 파일: `src/client/hooks/__tests__/useDnd.test.ts`

| TC-ID | 테스트명 | 분류 | 전제조건 | 입력/액션 | 기대 결과 | 연관 |
|-------|---------|:----:|---------|---------|---------|------|
| TC-HOOK-009 | Mouse·Touch·Keyboard 센서 3종 반환 | ✅ Happy | — | 훅 초기화 | `sensors` 배열에 MouseSensor·TouchSensor·KeyboardSensor 포함 | NFR-007, NFR-009, NFR-019 |
| TC-HOOK-010 | onDragEnd — 칼럼 간 이동 시 moveTicket 호출 | ✅ Happy | `moveTicket` mock | `DragEndEvent`: active.id=티켓id, over.id="TODO" | `moveTicket(id, "TODO", 계산된order)` 1회 호출 | FR-009 |
| TC-HOOK-011 | onDragEnd — 칼럼 내 order 중간값 계산 | 🔲 Edge | 칼럼 내 prevOrder=1000, nextOrder=3000 | `DragEndEvent`: 동일 칼럼 내 이동 | `moveTicket` 호출 인자의 order === 2000 | NFR-015 |
| TC-HOOK-012 | onDragEnd — over=null(드롭 취소) 시 미호출 | 🔲 Edge | — | `DragEndEvent`: over=null | `moveTicket` 미호출 | FR-009 |
| TC-HOOK-013 | onDragEnd — diff ≤ 1 시 전체 재정규화 호출 | 🔲 Edge | 동일 칼럼 내 prevOrder=1000, nextOrder=1001 | `DragEndEvent`: 동일 칼럼 내 이동 | `moveTicket` 미호출, 재정규화 함수 1회 호출 | NFR-015 |

---

### 3-14. getDeadlineStyle 유틸

> 파일: `src/shared/constants/__tests__/status.test.ts`  
> 함수: `getDeadlineStyle(dueDate, status)` (DATA_MODEL.md §4-1)  
> 기준 날짜: 테스트 시 `jest.useFakeTimers()` 로 고정

| TC-ID | 테스트명 | 분류 | 입력 | 기대 반환값 | 연관 |
|-------|---------|:----:|-----|-----------|------|
| TC-UTIL-001 | diffDays=-1 (기한 초과) → 빨간 테두리 | 🔲 Edge | dueDate: 어제, status: "TODO" | `"border-red-500"` | FR-013 |
| TC-UTIL-002 | diffDays=0 (당일) → 주황 테두리 | 🔲 Edge | dueDate: 오늘, status: "TODO" | `"border-orange-400"` | FR-012 |
| TC-UTIL-003 | diffDays=3 (D-3) → 주황 테두리 (경계값) | 🔲 Edge | dueDate: 오늘+3일, status: "TODO" | `"border-orange-400"` | FR-012 |
| TC-UTIL-004 | diffDays=4 (D-4) → 기본 테두리 (경계값) | 🔲 Edge | dueDate: 오늘+4일, status: "TODO" | `"border-gray-200"` | FR-014 |
| TC-UTIL-005 | dueDate=null → 기본 테두리 | ✅ Happy | dueDate: null, status: "TODO" | `"border-gray-200"` | FR-014 |
| TC-UTIL-006 | status='Done', 기한 초과 → 기본 테두리 | 🔲 Edge | dueDate: 어제, status: "Done" | `"border-gray-200"` | FR-012~014 |

---

### 3-15. 필터 유틸

> 파일: `src/client/utils/__tests__/filter.test.ts` (또는 Board 유틸)  
> 함수: `applyFilter`, `isOverdue`, `isThisWeek`

| TC-ID | 테스트명 | 분류 | 전제조건 | 입력 | 기대 결과 | 연관 |
|-------|---------|:----:|---------|-----|---------|------|
| TC-UTIL-007 | 필터 모두 비활성 → 전체 반환 | ✅ Happy | tickets 5건 | `{ overdue: false, thisWeek: false }` | tickets 5건 전체 반환 | FR-017, FR-018 |
| TC-UTIL-008 | overdue 활성 → 기한 초과 + Done 아닌 티켓만 | ✅ Happy | 초과 2건, 정상 2건, Done+초과 1건 | `{ overdue: true, thisWeek: false }` | 초과 2건만 반환 (Done 제외) | FR-017 |
| TC-UTIL-009 | thisWeek 활성 → 이번 주 dueDate 티켓만 | ✅ Happy | 이번주 2건, 다음주 2건 | `{ overdue: false, thisWeek: true }` | 이번주 2건만 반환 | FR-018 |
| TC-UTIL-010 | 두 필터 동시 활성 → OR 조건 | 🔲 Edge | 초과 1건, 이번주 1건, 해당없음 1건 | `{ overdue: true, thisWeek: true }` | 초과+이번주 2건 반환 | FR-017, FR-018 |
| TC-UTIL-011 | Done 티켓은 overdue 필터에서 제외 | 🔲 Edge | Done+기한초과 1건 | `{ overdue: true, thisWeek: false }` | 빈 배열 반환 | FR-017 |
| TC-UTIL-012 | isOverdue — dueDate 없으면 false | 🔲 Edge | ticket: `{ dueDate: null, status: "TODO" }` | — | false | FR-017 |
| TC-UTIL-013 | isOverdue — status='Done'이면 false | 🔲 Edge | ticket: `{ dueDate: 어제, status: "Done" }` | — | false | FR-017 |
| TC-UTIL-014 | isThisWeek — 이번주 월요일 00:00 (경계값) | 🔲 Edge | dueDate: 이번주 월요일 00:00:00 | — | true | FR-018 |
| TC-UTIL-015 | isThisWeek — 이번주 일요일 23:59:59 (경계값) | 🔲 Edge | dueDate: 이번주 일요일 23:59:59 | — | true | FR-018 |

---

## 4. 통합 테스트케이스 (TC-INT-\*)

> 테스트 파일: `__tests__/integration/scenario*.test.tsx`  
> MSW로 전체 API Mock 처리, 실제 React 트리 렌더링

---

### 4-1. 시나리오 A — 새 티켓 생성 후 칸반 배치 (PRD §3 시나리오 A)

| TC-ID | 테스트명 | 분류 | 전제조건 | 사용자 행동 | 기대 결과 | 연관 |
|-------|---------|:----:|---------|-----------|---------|------|
| TC-INT-001 | "새 업무" 클릭 → CreateModal 오픈 | ✅ Happy | 보드 렌더 완료 | 헤더 "새 업무" 클릭 | CreateModal 폼 표시 | FR-001 |
| TC-INT-002 | 제목 미입력 → 저장 불가, API 미호출 | ❌ Error | CreateModal 오픈 | 제목 비워두고 저장 클릭 | 저장 버튼 비활성, POST 요청 없음 | NFR-016 |
| TC-INT-003 | 유효 입력 → Backlog 카드 추가 | ✅ Happy | MSW: POST → 신규 티켓 | 제목 입력 후 저장 | Backlog 칼럼에 카드 추가 표시 | FR-001, FR-015 |
| TC-INT-004 | 신규 카드 DnD → TODO 이동 | ✅ Happy | 신규 카드 Backlog 존재 | 카드를 TODO 칼럼으로 드래그 | 카드 TODO 칼럼으로 이동, status 변경 | FR-009, FR-011 |
| TC-INT-005 | DnD API 실패 → 토스트 표시, 카드 롤백 | ❌ Error | MSW: PATCH → 500 | 카드 드래그 후 드롭 | 카드 원래 칼럼으로 복원, 에러 토스트 표시 | FR-011, NFR-013, NFR-025 |

---

### 4-2. 시나리오 B — 칸반 보드 흐름 (PRD §3 시나리오 B)

| TC-ID | 테스트명 | 분류 | 전제조건 | 사용자 행동 | 기대 결과 | 연관 |
|-------|---------|:----:|---------|-----------|---------|------|
| TC-INT-006 | 초기 로드 → 칼럼별 티켓 그룹핑 렌더링 | ✅ Happy | MSW: GET → 4칼럼 티켓 존재 | 보드 진입 | 각 칼럼에 해당 status 카드만 표시 | FR-002, FR-006, FR-007 |
| TC-INT-007 | Backlog → TODO 드래그 → 칼럼 이동 확인 | ✅ Happy | Backlog 카드 존재 | 드래그앤드롭 | TODO 칼럼으로 카드 이동, Backlog에서 제거 | FR-009 |
| TC-INT-008 | Done 이동 시 기한 경고 테두리 제거 | 🔲 Edge | 기한 초과 카드(border-red-500) In Progress | 카드를 Done으로 드래그 | `border-gray-200`으로 변경 | FR-009, FR-013 |
| TC-INT-009 | 같은 칼럼 내 카드 순서 변경 | ✅ Happy | 동일 칼럼 카드 2개 | 카드 순서 드래그 | order 변경 후 렌더 순서 반영 | FR-010, NFR-015 |

---

### 4-3. 시나리오 C — 기한 임박 확인 및 처리 (PRD §3 시나리오 C)

| TC-ID | 테스트명 | 분류 | 전제조건 | 사용자 행동 | 기대 결과 | 연관 |
|-------|---------|:----:|---------|-----------|---------|------|
| TC-INT-010 | 초기 로드 → 기한 경고 카드 색상 표시 | ✅ Happy | 기한 초과 1건, D-2 1건, 정상 1건 | 보드 진입 | 초과: `border-red-500`, D-2: `border-orange-400`, 정상: `border-gray-200` | FR-012, FR-013, FR-014 |
| TC-INT-011 | "일정이 초과된 업무" 필터 → 해당 카드만 표시 | ✅ Happy | 초과 2건, 정상 2건 | 필터 버튼 클릭 | 초과 2건만 보드에 표시 | FR-017 |
| TC-INT-012 | DetailModal에서 dueDate 수정 → 테두리 재평가 | ✅ Happy | 기한 초과 카드, MSW: PATCH 성공 | 카드 클릭 → dueDate 오늘+10일로 수정 → 저장 | 카드 테두리 `border-gray-200`으로 변경 | FR-004, FR-012~014 |
| TC-INT-013 | 수정 API 실패 → 토스트, 이전 값 유지 | ❌ Error | MSW: PATCH → 500 | dueDate 수정 후 저장 | 에러 토스트 표시, 카드 값 원복 | NFR-025 |

---

### 4-4. 시나리오 D — 이번주 업무 집중 모드 (PRD §3 시나리오 D)

| TC-ID | 테스트명 | 분류 | 전제조건 | 사용자 행동 | 기대 결과 | 연관 |
|-------|---------|:----:|---------|-----------|---------|------|
| TC-INT-014 | "이번주 업무" 필터 → 이번 주 카드만 표시 | ✅ Happy | 이번주 2건, 다음주 2건 | 필터 버튼 클릭 | 이번주 2건만 표시 | FR-018 |
| TC-INT-015 | 필터 활성 중 DnD → 필터 유지, 상태 변경 정상 | 🔲 Edge | thisWeek 필터 활성 | 표시된 카드 드래그 | 필터 해제되지 않음, 카드 칼럼 이동 | FR-009, FR-018 |
| TC-INT-016 | 필터 버튼 재클릭 → 전체 보드 복원 | ✅ Happy | thisWeek 필터 활성 | 버튼 재클릭 | 전체 tickets 다시 표시 | FR-018 |

---

### 4-5. 시나리오 E — 티켓 삭제 (PRD §3 시나리오 E)

| TC-ID | 테스트명 | 분류 | 전제조건 | 사용자 행동 | 기대 결과 | 연관 |
|-------|---------|:----:|---------|-----------|---------|------|
| TC-INT-017 | 카드 클릭 → DetailModal 오픈 | ✅ Happy | 카드 존재 | 카드 클릭 | DetailModal 표시, 삭제 버튼 존재 | FR-016 |
| TC-INT-018 | 삭제 버튼 → ConfirmDialog 표시 | ✅ Happy | DetailModal 오픈 | 삭제 버튼 클릭 | ConfirmDialog "정말 삭제하시겠습니까?" 표시 | FR-005, NFR-017 |
| TC-INT-019 | ConfirmDialog 취소 → 카드 유지, 모달 유지 | ✅ Happy | ConfirmDialog 표시 중 | 취소 클릭 | DELETE 요청 없음, 카드 보드에 유지 | NFR-017 |
| TC-INT-020 | ConfirmDialog 확인 → 카드 보드에서 제거 | ✅ Happy | MSW: DELETE → 204 | 확인 클릭 | DELETE 1회 호출, 카드 보드에서 사라짐 | FR-005 |

---

## 5. 추적 매트릭스

---

### 5-1. FR 추적 매트릭스

| 요구사항 | 설명 | 연관 TC | 커버리지 |
|---------|------|---------|:--------:|
| FR-001 | 티켓 생성 (Backlog 기본) | TC-API-004~014, TC-COMP-036~043, TC-INT-001~005 | ✅ |
| FR-002 | 전체 티켓 목록 조회 | TC-API-001~003, TC-HOOK-001, TC-INT-006 | ✅ |
| FR-003 | 티켓 단건 조회 | TC-API-015~017 | ✅ |
| FR-004 | 티켓 수정 (필드·날짜) | TC-API-018~026, TC-COMP-046~047, TC-INT-012~013 | ✅ |
| FR-005 | 티켓 삭제 (확인 다이얼로그 필수) | TC-API-027~029, TC-COMP-048~050, TC-COMP-052~056, TC-INT-017~020 | ✅ |
| FR-006 | 4칼럼 보드 렌더링 | TC-COMP-001, TC-COMP-015, TC-INT-006 | ✅ |
| FR-007 | 칼럼별 티켓 그룹핑 | TC-COMP-012, TC-COMP-016, TC-INT-006 | ✅ |
| FR-008 | 칼럼 내 순서 관리 | TC-API-020, TC-HOOK-011 | ✅ |
| FR-009 | 칼럼 간 드래그앤드롭 | TC-API-019, TC-HOOK-010, TC-INT-004, TC-INT-007~008 | ✅ |
| FR-010 | 칼럼 내 순서 변경 | TC-API-020, TC-HOOK-010~011, TC-INT-009 | ✅ |
| FR-011 | 낙관적 업데이트 및 롤백 | TC-HOOK-005~007, TC-INT-004~005 | ✅ |
| FR-012 | D-3 이내 주황 테두리 | TC-COMP-024~025, TC-UTIL-002~003, TC-INT-010 | ✅ |
| FR-013 | 기한 초과 빨간 테두리 | TC-COMP-023, TC-UTIL-001, TC-INT-010~011 | ✅ |
| FR-014 | 정상 상태 기본 테두리 | TC-COMP-026~027, TC-UTIL-004~006, TC-INT-010 | ✅ |
| FR-015 | 티켓 카드 렌더링 (제목·뱃지 등) | TC-COMP-019~022, TC-COMP-031~035 | ✅ |
| FR-016 | 티켓 상세 모달 (전체 필드·수정) | TC-COMP-044~051, TC-INT-012, TC-INT-017 | ✅ |
| FR-017 | 기한 초과 필터 (클라이언트) | TC-COMP-009~011, TC-UTIL-008, TC-UTIL-011~013, TC-INT-011 | ✅ |
| FR-018 | 이번주 업무 필터 (클라이언트) | TC-COMP-007~008, TC-UTIL-009, TC-UTIL-014~015, TC-INT-014~016 | ✅ |

---

### 5-2. NFR 추적 매트릭스

| 요구사항 | 설명 | 연관 TC | 커버리지 |
|---------|------|---------|:--------:|
| NFR-001 | API p95 ≤ 300ms | — | ⚠️ 수동 / Vercel Function 로그 |
| NFR-002 | FCP ≤ 2초 | — | ⚠️ 수동 / Lighthouse |
| NFR-003 | DnD 응답 ≤ 16ms | — | ⚠️ 수동 / Chrome DevTools Performance |
| NFR-004 | 칼럼당 100개 렌더 | — | ⚠️ 수동 (대량 seed 후 레이아웃 확인) |
| NFR-005 | 360px~1920px 지원 | — | ⚠️ 수동 / 반응형 브라우저 확인 |
| NFR-006 | 768px 미만 가로 스크롤 | — | ⚠️ 수동 |
| NFR-007 | 터치 DnD 센서 활성화 | TC-HOOK-009 | ✅ |
| NFR-008 | 키보드 Tab 네비게이션 | TC-COMP-030 | ✅ |
| NFR-009 | 키보드 DnD (Space→방향키→Enter) | TC-HOOK-009 | ✅ |
| NFR-010 | aria-live 상태 변경 음성 출력 | TC-COMP-004 | ✅ |
| NFR-011 | 시맨틱 마크업 (role 속성) | TC-COMP-005, TC-COMP-013, TC-COMP-017, TC-COMP-029, TC-COMP-056 | ✅ |
| NFR-012 | 색상 대비 WCAG AA 4.5:1 | TC-COMP-023, TC-COMP-024 (클래스 확인) | ⚠️ 자동: 클래스 존재 확인 / 수동: 실제 대비 측정 |
| NFR-013 | 낙관적 업데이트·롤백 | TC-HOOK-005, TC-HOOK-007, TC-INT-005 | ✅ |
| NFR-014 | 서버 응답값으로 재동기화 | TC-HOOK-006 | ✅ |
| NFR-015 | order 중간값·재정규화 | TC-HOOK-011, TC-HOOK-013, TC-INT-009 | ✅ |
| NFR-016 | 입력값 이중 검증 (UI + API) | TC-API-006~011, TC-COMP-038~040, TC-INT-002 | ✅ |
| NFR-017 | 삭제 확인 다이얼로그 필수 | TC-COMP-048~050, TC-COMP-052~056, TC-INT-018~019 | ✅ |
| NFR-018 | Chrome/Safari/Firefox/Edge 호환 | — | ⚠️ 수동 / 각 브라우저 실행 확인 |
| NFR-019 | @dnd-kit 4개 브라우저 DnD 호환 | TC-HOOK-009 | ✅ |
| NFR-020 | IE 미지원 | — | N/A (코드 정책, Tailwind CSS 4 IE 불가) |
| NFR-021 | Vercel 배포 | — | ⚠️ 수동 / Vercel 대시보드 확인 |
| NFR-022 | HTTPS 강제 | — | ⚠️ 수동 / 프로덕션 HTTP 접근 시 리다이렉트 확인 |
| NFR-023 | main 브랜치 자동 배포 | — | ⚠️ 수동 / Vercel 배포 트리거 확인 |
| NFR-024 | 환경 변수 코드 하드코딩 금지 | — | ⚠️ 코드 리뷰 / grep으로 점검 |
| NFR-025 | API 에러 토스트 + 콘솔 로깅 | TC-API-003, TC-API-014, TC-API-017, TC-API-026, TC-API-029, TC-COMP-043, TC-HOOK-008, TC-INT-005, TC-INT-013 | ✅ |

---

### 5-3. 커버리지 요약

| 구분 | 전체 | ✅ 자동 커버 | ⚠️ 수동/부분 | ❌ 미커버 |
|------|:----:|:-----------:|:-----------:|:--------:|
| FR (18개) | 18 | 18 | 0 | 0 |
| NFR (25개) | 25 | 14 | 11 | 0 |
| **합계** | **43** | **32** | **11** | **0** |

> ⚠️ 항목(NFR-001~006, NFR-012, NFR-018, NFR-021~024)은 테스트 자동화 적용 불가 또는 부분 적용 대상이다.  
> 해당 항목은 QA 체크리스트 또는 Vercel/Lighthouse 측정 절차서로 별도 관리한다.

---

## 6. 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| v1.1 | 2026-06-15 | §3-13 TC-HOOK-013 추가 (NFR-015 diff ≤ 1 재정규화 케이스). 총 133개 |
| v1.0 | 2026-06-15 | 최초 작성. TC-API 29개·TC-COMP 56개·TC-HOOK 12개·TC-UTIL 15개·TC-INT 20개, 총 132개 테스트케이스. FR 전항목 ✅, NFR 14개 ✅ / 11개 ⚠️ |
