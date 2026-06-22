# FRONTEND_TASKS.md — TicketTodo 프론트엔드 구현 계획

> 작성일: 2026-06-22  
> 기반: COMPONENT_SPEC.md v1.0 · REQUIREMENTS.md v1.1  
> 목적: 바텀업 구현 순서, 의존성 그래프, 컴포넌트별 TDD 체크리스트

---

## 0. 현황 요약

| 상태 | 의미 |
|------|------|
| ✅ 완료 | 구현 + 테스트 완료 |
| ⚠️ 수정 필요 | 파일 존재하나 COMPONENT_SPEC 대비 누락 항목 있음 |
| ❌ 미구현 | 파일 없음 |

| 파일 | 상태 | 누락 항목 요약 |
|------|------|----------------|
| `utils/calculateOrder.ts` | ✅ | — |
| `utils/groupByStatus.ts` | ✅ | — |
| `utils/filter.ts` | ❌ | `applyFilter`, `isOverdue`, `isThisWeek` 전체 |
| `api/ticketApi.ts` | ✅ | — |
| `hooks/useTickets.ts` | ✅ | — |
| `hooks/useDnd.ts` | ✅ | — |
| `Card/PriorityBadge.tsx` | ❌ | 파일 없음 |
| `Card/DueDateBadge.tsx` | ❌ | 파일 없음 |
| `Card/TicketCard.tsx` | ⚠️ | `onClick` prop, `PriorityBadge`, `DueDateBadge`, `<button>` 래퍼, `line-clamp`, `aria-grabbed` |
| `Column/BacklogPanel.tsx` | ⚠️ | `onCardClick` prop 미전달 |
| `Column/Column.tsx` | ⚠️ | `onCardClick` prop 미전달 |
| `Board/Header.tsx` | ✅ | — |
| `Board/FilterBar.tsx` | ❌ | 파일 없음 |
| `Modal/CreateModal.tsx` | ✅ | — |
| `Modal/ConfirmDialog.tsx` | ❌ | 파일 없음 |
| `Modal/DetailModal.tsx` | ❌ | 파일 없음 |
| `Board/Board.tsx` | ⚠️ | `filter` state, `filteredTickets` derived, `selectedTicketId`, `FilterBar`, `DetailModal`, `aria-live` |

---

## 1. 의존성 그래프

```
[Phase 0] 유틸리티
  calculateOrder ──────┐
  groupByStatus ───────┤
  filter (❌) ─────────┤
                       ▼
[Phase 1] 원자 컴포넌트 (의존성 없음)
  PriorityBadge (❌) ──┐
  DueDateBadge (❌) ───┤
  ConfirmDialog (❌) ──┼──────────────────────┐
                       ▼                      │
[Phase 2] TicketCard                          │
  TicketCard (⚠️) ◄── PriorityBadge           │
                  ◄── DueDateBadge            │
                       │                      │
                       ▼                      │
[Phase 3] 칼럼·바 컴포넌트                     │
  BacklogPanel (⚠️) ◄── TicketCard            │
  Column (⚠️) ◄──────── TicketCard            │
  FilterBar (❌)  (독립)                       │
                       │                      │
                       ▼                      │
[Phase 4] 커스텀 훅 (✅ 완료)                  │
  useTickets ──────────┐                      │
  useDnd ──────────────┤                      │
                       ▼                      │
[Phase 5] 모달                                │
  CreateModal (✅) ◄── useTickets             │
  DetailModal (❌) ◄── useTickets ◄───────────┘
                  ◄── ConfirmDialog
                       │
                       ▼
[Phase 6] Board (루트)
  Board (⚠️) ◄── BacklogPanel · Column · FilterBar
           ◄── CreateModal · DetailModal
           ◄── Header · useTickets · useDnd
           ◄── filter util · groupByStatus
                       │
                       ▼
[Phase 7] 통합
  app/page.tsx ◄── Board
```

---

## 2. Phase 0 — 유틸리티 함수

### 2-1. `src/client/utils/filter.ts` ❌

**역할**: 클라이언트 사이드 필터링 (FR-017, FR-018)

```typescript
export function applyFilter(tickets: TicketDto[], filter: FilterState): TicketDto[]
export function isOverdue(t: TicketDto): boolean   // FR-017
export function isThisWeek(t: TicketDto): boolean  // FR-018
```

**TDD 체크리스트** (`utils/__tests__/filter.test.ts`)

```
□ applyFilter — filter 비활성(둘 다 false): 전체 반환
□ applyFilter — overdue만 활성: isOverdue() true인 티켓만
□ applyFilter — thisWeek만 활성: isThisWeek() true인 티켓만
□ applyFilter — 둘 다 활성: OR 조건, 두 조건 중 하나라도 해당하면 포함
□ isOverdue — dueDate 없음 → false
□ isOverdue — status === 'Done' → false (완료 티켓 제외)
□ isOverdue — dueDate < 오늘 → true
□ isOverdue — dueDate === 오늘 → false (당일은 초과 아님)
□ isThisWeek — dueDate 없음 → false
□ isThisWeek — dueDate가 이번 주 월~일 내 → true
□ isThisWeek — dueDate가 지난 주 → false
□ isThisWeek — dueDate가 다음 주 → false
□ isThisWeek — 주 경계(월요일 00:00, 일요일 23:59) 경계값
```

---

## 3. Phase 1 — 원자 컴포넌트

### 3-1. `src/client/components/Card/PriorityBadge.tsx` ❌

**역할**: `priority` 값 → 색상 뱃지 (FR-015, NFR-012)

```typescript
type PriorityBadgeProps = { priority: Priority }
```

**색상 매핑**:
| priority | 배경 클래스 | 텍스트 클래스 |
|----------|------------|--------------|
| `Low` | `bg-slate-100` | `text-slate-600` |
| `Medium` | `bg-blue-100` | `text-blue-700` |
| `High` | `bg-red-100` | `text-red-700` |

**TDD 체크리스트** (`Card/__tests__/PriorityBadge.test.tsx`)

```
□ Low: "Low" 텍스트 렌더링, bg-slate-100 클래스 포함
□ Medium: "Medium" 텍스트 렌더링, bg-blue-100 클래스 포함
□ High: "High" 텍스트 렌더링, bg-red-100 클래스 포함
□ 스냅샷: 3개 priority 각각 스냅샷 일치
```

---

### 3-2. `src/client/components/Card/DueDateBadge.tsx` ❌

**역할**: ISO 8601 날짜 → `M월 D일` 포맷 표시 (FR-015)

```typescript
type DueDateBadgeProps = { dueDate: string }
```

**TDD 체크리스트** (`Card/__tests__/DueDateBadge.test.tsx`)

```
□ "2026-06-22T00:00:00.000Z" → "6월 22일" 형식 렌더링
□ 월이 1자리(1~9월)일 때 정상 포맷: "1월 5일"
□ 유효하지 않은 날짜 문자열 → 렌더링 크래시 없음 (에러 바운더리 없이 빈 문자열 또는 '-')
□ 스냅샷 일치
```

---

### 3-3. `src/client/components/Modal/ConfirmDialog.tsx` ❌

**역할**: 삭제 확인 다이얼로그 (FR-005, NFR-017)

```typescript
type ConfirmDialogProps = {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}
```

**TDD 체크리스트** (`Modal/__tests__/ConfirmDialog.test.tsx`)

```
□ isOpen=false → DOM에 렌더링되지 않음
□ isOpen=true → role="alertdialog" 존재
□ isOpen=true → aria-modal="true" 존재
□ message props가 렌더링됨
□ 확인 버튼 클릭 → onConfirm 호출
□ 취소 버튼 클릭 → onCancel 호출
□ 확인·취소 둘 다 <button> 태그 (NFR-011)
□ 확인·취소 둘 다 tabIndex 포커스 가능 (NFR-008)
□ ESC 키 → onCancel 호출
```

---

## 4. Phase 2 — TicketCard

### 4-1. `src/client/components/Card/TicketCard.tsx` ⚠️

**현재 누락**: `onClick` prop, `PriorityBadge`, `DueDateBadge`, `<button>` 래퍼, `line-clamp`, `aria-grabbed`

**수정 후 Props**:
```typescript
type TicketCardProps = {
  ticket:  TicketDto;
  onClick: (id: string) => void;  // ← 추가
}
```

**렌더 구조 변경**:
- 최외곽 `<div>` → `<button>` 태그 (NFR-011)
- `aria-grabbed={isDragging}` 추가 (NFR-010)
- `title`: `className="line-clamp-2"` 추가 (FR-015)
- `description` 있으면 `className="line-clamp-1"` (FR-015)
- `priority` 있으면 `<PriorityBadge>` (FR-015)
- `dueDate` 있으면 `<DueDateBadge>` (FR-015)

**TDD 체크리스트** (`Card/__tests__/TicketCard.test.tsx` — 기존 파일 확장)

```
□ [기존] getDeadlineStyle 반환 클래스 적용 — border-red-500 / border-orange-400 / border-gray-200
□ [추가] 클릭 시 onClick(ticket.id) 호출
□ [추가] priority 있을 때 PriorityBadge 렌더링
□ [추가] priority 없을 때 PriorityBadge 미렌더링
□ [추가] dueDate 있을 때 DueDateBadge 렌더링
□ [추가] dueDate 없을 때 DueDateBadge 미렌더링
□ [추가] description 있을 때 표시
□ [추가] description 없을 때 미표시
□ [추가] role="listitem" 존재 (NFR-011)
□ [추가] 드래그 중 aria-grabbed="true" (NFR-010)
□ [추가] <button> 태그 사용 (NFR-011) — <div role="button"> 아님
□ [추가] 키보드 포커스 가능 (tabIndex, NFR-008)
```

---

## 5. Phase 3 — 칼럼/패널 + FilterBar

### 5-1. `src/client/components/Column/BacklogPanel.tsx` ⚠️

**현재 누락**: `onCardClick` prop 수신 및 `TicketCard`에 전달

**수정 후 Props**:
```typescript
type BacklogPanelProps = {
  tickets:     TicketDto[];
  onCardClick: (id: string) => void;  // ← 추가
}
```

**TDD 체크리스트** (`Column/__tests__/BacklogPanel.test.tsx` — 기존 파일 확장)

```
□ [기존] useDroppable id='Backlog' 등록
□ [기존] role="list", aria-label="Backlog"
□ [기존] 티켓 목록 렌더링
□ [기존] 빈 배열이어도 드롭 영역 유지 (PRD §4-4)
□ [추가] 카드 클릭 → onCardClick(ticket.id) 호출
□ [추가] 여러 장 중 두 번째 카드 클릭 → 해당 id로 호출
```

---

### 5-2. `src/client/components/Column/Column.tsx` ⚠️

**현재 누락**: `onCardClick` prop 수신 및 `TicketCard`에 전달

**수정 후 Props**:
```typescript
type ColumnProps = {
  status:      Exclude<ColumnStatus, 'Backlog'>;
  tickets:     TicketDto[];
  onCardClick: (id: string) => void;  // ← 추가
}
```

**TDD 체크리스트** (`Column/__tests__/Column.test.tsx` — 기존 파일 확장)

```
□ [기존] useDroppable id=status 등록
□ [기존] role="list", aria-label=status
□ [기존] 티켓 목록 렌더링
□ [기존] 빈 배열이어도 최소 높이 영역 유지 (PRD §4-5)
□ [추가] 카드 클릭 → onCardClick(ticket.id) 호출
□ [추가] status='TODO', 'In Progress', 'Done' 각각 동작 확인
```

---

### 5-3. `src/client/components/Board/FilterBar.tsx` ❌

**역할**: 이번주·초과 필터 토글 버튼 2개 (FR-017, FR-018)

```typescript
type FilterBarProps = {
  filter:         { overdue: boolean; thisWeek: boolean };
  onFilterChange: (key: 'overdue' | 'thisWeek') => void;
}
```

**버튼 명세**:
| 버튼 텍스트 | key | 활성 스타일 |
|------------|-----|------------|
| 이번주 업무 | `thisWeek` | 강조 테두리·배경 |
| 일정이 초과된 업무 | `overdue` | 빨간 테두리 |

**TDD 체크리스트** (`Board/__tests__/FilterBar.test.tsx`)

```
□ "이번주 업무" 버튼 렌더링
□ "일정이 초과된 업무" 버튼 렌더링
□ 둘 다 <button> 태그 (NFR-011)
□ thisWeek=false → aria-pressed="false"
□ thisWeek=true → aria-pressed="true" (NFR-008, NFR-011)
□ overdue=false → aria-pressed="false"
□ overdue=true → aria-pressed="true"
□ "이번주 업무" 클릭 → onFilterChange('thisWeek') 호출
□ "일정이 초과된 업무" 클릭 → onFilterChange('overdue') 호출
□ 두 버튼 독립 토글 — 동시 활성 가능 (PRD §4-3)
□ 활성 상태 버튼에 강조 클래스 존재
□ 비활성 상태 버튼에 강조 클래스 없음
```

---

## 6. Phase 4 — 커스텀 훅 (완료 확인)

### 6-1. `src/client/hooks/useTickets.ts` ✅

기존 테스트 파일(`hooks/__tests__/useTickets.test.ts`) 기준 검증:

```
□ 마운트 시 GET /api/tickets 호출, tickets 상태 저장
□ createTicket: POST → 응답 티켓 상태 반영
□ updateTicket: PATCH → 해당 티켓 교체
□ deleteTicket: DELETE → 해당 티켓 제거
□ moveTicket: 낙관적 업데이트 → API 성공 시 재동기화 (NFR-013, NFR-014)
□ moveTicket: API 실패 시 롤백 (NFR-013)
```

### 6-2. `src/client/hooks/useDnd.ts` ✅

기존 테스트 파일(`hooks/__tests__/useDnd.test.ts`) 기준 검증:

```
□ MouseSensor, TouchSensor, KeyboardSensor 3종 활성화 (NFR-007, NFR-009)
□ onDragEnd: 다른 칼럼으로 드롭 → moveTicket(id, newStatus, newOrder) 호출
□ onDragEnd: 같은 칼럼 내 재정렬 → moveTicket(id, sameStatus, midOrder) 호출
□ onDragEnd: over 없음(드롭 취소) → moveTicket 호출 안 함
□ order 충돌(차이 ≤ 1) → 재정규화 트리거 (NFR-015)
```

---

## 7. Phase 5 — 모달

### 7-1. `src/client/components/Modal/CreateModal.tsx` ✅

기존 테스트 파일(`Modal/__tests__/CreateModal.test.tsx`) 기준 검증:

```
□ isOpen=false → 렌더링 없음
□ isOpen=true → 폼 렌더링
□ title 미입력 → 저장 버튼 비활성화 (NFR-016)
□ title 256자 초과 → 저장 버튼 비활성화 (NFR-016)
□ 유효한 폼 제출 → POST /api/tickets 호출
□ 성공 → onCreated(ticket) 호출, 모달 닫힘
□ 실패 → 에러 메시지 표시 (NFR-025)
□ ESC 키 → onClose 호출
□ 배경 클릭 → onClose 호출
```

---

### 7-2. `src/client/components/Modal/DetailModal.tsx` ❌

**역할**: 티켓 상세 조회·인라인 수정·삭제 (FR-004, FR-005, FR-016)

```typescript
type DetailModalProps = {
  ticketId:  string | null;
  onClose:   () => void;
  onUpdated: (ticket: TicketDto) => void;
  onDeleted: (id: string) => void;
}
```

**내부 State**:
```typescript
const [editField, setEditField]       = useState<keyof UpdateTicketInput | null>(null);
const [form, setForm]                 = useState<UpdateTicketInput>({});
const [confirmOpen, setConfirmOpen]   = useState(false);
const [isSubmitting, setIsSubmitting] = useState(false);
```

**TDD 체크리스트** (`Modal/__tests__/DetailModal.test.tsx`)

```
□ ticketId=null → 렌더링 없음
□ ticketId 있음 → role="dialog", aria-modal="true"
□ 티켓 필드 표시: title, description, priority, startedAt, dueDate, status, createdAt (FR-016)
□ 필드 클릭 → 인라인 편집 모드 진입 (editField 설정)
□ 편집 후 저장 → updateTicketSchema 검증 → PATCH /api/tickets/:id
□ 수정 성공 → onUpdated(ticket) 호출
□ 수정 실패 → 에러 토스트 표시 (NFR-025)
□ title 비워서 저장 → 유효성 실패, API 호출 없음 (NFR-016)
□ 삭제 버튼 클릭 → ConfirmDialog 열림 (NFR-017)
□ ConfirmDialog 확인 → DELETE /api/tickets/:id → onDeleted(id) 호출
□ ConfirmDialog 취소 → ConfirmDialog만 닫힘, 모달 유지 (NFR-017)
□ ESC 키 → onClose 호출
□ 배경 클릭 → onClose 호출
□ 수정 중 ESC → 편집 모드 취소 (편집 전 값으로 복원)
```

---

## 8. Phase 6 — Board (루트 컴포넌트)

### 8-1. `src/client/components/Board/Board.tsx` ⚠️

**현재 누락**:
- `filter` state + `handleFilterChange`
- `filteredTickets` useMemo derived state
- `selectedTicketId` state + `handleCardClick`
- `<FilterBar>` 렌더링
- `<DetailModal>` 렌더링
- `aria-live` 영역 (`announcement` state)
- `handleUpdated`, `handleDeleted` 핸들러
- `onCardClick` → BacklogPanel·Column 전달

**수정 후 State 추가**:
```typescript
const [filter, setFilter]             = useState({ overdue: false, thisWeek: false });
const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
const [announcement, setAnnouncement] = useState('');

const filteredTickets = useMemo(() => applyFilter(tickets, filter), [tickets, filter]);
const ticketsByColumn = useMemo(() => groupByStatus(filteredTickets), [filteredTickets]);
```

**TDD 체크리스트** (`Board/__tests__/Board.test.tsx` + `Board.dnd.test.tsx` — 기존 파일 확장)

```
□ [기존] 초기 로드 시 4개 칼럼 헤더 렌더링 (Backlog, TODO, In Progress, Done)
□ [기존] 티켓이 status에 따라 해당 칼럼에 배치
□ [기존] "새 업무" 클릭 → CreateModal 열림
□ [추가] FilterBar 렌더링 확인
□ [추가] "이번주 업무" 토글 → filter.thisWeek 반전, filteredTickets 재계산
□ [추가] "일정이 초과된 업무" 토글 → filter.overdue 반전
□ [추가] 두 필터 동시 활성 → OR 조건 필터링
□ [추가] 카드 클릭 → DetailModal 열림, 해당 ticketId 전달
□ [추가] DetailModal.onClose → selectedTicketId=null, 모달 닫힘
□ [추가] DetailModal.onUpdated → tickets 상태 해당 항목 교체
□ [추가] DetailModal.onDeleted → selectedTicketId=null, tickets에서 제거
□ [추가] aria-live="polite" 영역 존재 (NFR-010)
□ [기존 DnD] 칼럼 간 드롭 → moveTicket 호출 (FR-009)
□ [기존 DnD] 칼럼 내 재정렬 드롭 → moveTicket 호출 (FR-010)
□ [추가 DnD] 드롭 완료 → announcement 갱신 ("X이(가) TODO로 이동됐습니다.") (NFR-010)
□ [추가 DnD] 드롭 실패/롤백 → announcement 갱신 (NFR-010)
```

---

## 9. Phase 7 — 통합

### 9-1. `src/app/page.tsx`

**체크리스트**

```
□ <Board> 마운트 — 'use client' 불필요 (Board 내부에서 처리)
□ metadata: title="TicketTodo" 설정 (layout.tsx)
□ 빌드 오류 없음: next build 통과
□ 접근성: Tab 순서 Header → FilterBar → BacklogPanel → Columns (NFR-008)
□ 반응형: 768px 미만에서 board-layout 가로 스크롤 동작 (NFR-006)
□ 스크린리더: aria-live 영역으로 DnD 결과 음성 출력 (NFR-010)
```

---

## 10. 구현 순서 요약

```
Phase 0  filter.ts (isOverdue, isThisWeek, applyFilter)
         ↓
Phase 1  PriorityBadge · DueDateBadge · ConfirmDialog
         ↓
Phase 2  TicketCard 수정 (onClick, badges, button, aria)
         ↓
Phase 3  BacklogPanel 수정 · Column 수정 · FilterBar 신규
         ↓
Phase 4  useTickets · useDnd (✅ 확인만)
         ↓
Phase 5  CreateModal (✅ 확인만) · DetailModal 신규
         ↓
Phase 6  Board 수정 (filter, selectedTicketId, FilterBar, DetailModal, aria-live)
         ↓
Phase 7  page.tsx 통합 확인
```

---

## 11. 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| v1.0 | 2026-06-22 | 최초 작성. COMPONENT_SPEC.md v1.0 기반 |
