# COMPONENT_SPEC.md — TicketTodo

> 작성일: 2026-06-15
> 버전: v1.0
> 기반 문서: PRD.md v1.0 · TRD.md v1.2 · DATA_MODEL.md v1.0 · API_SPEC.md v1.1
> 스키마 SSOT: DATA_MODEL.md

---

## 0. 범례 및 규칙

- Props 타입은 TypeScript 인터페이스 형식으로 기술한다.
- `?`는 optional 필드, 명시 없으면 required.
- **State**: `useState` 기준 로컬 상태. 복합 상태는 `useReducer` 검토.
- **Derived**: 상태가 아닌 파생 값 — `useMemo` 활용, 별도 상태로 관리하지 않는다.
- 모든 컴포넌트는 `'use client'` Client Component다 (서버 렌더링 대상 없음).
- 접근성 요구사항은 NFR-008 ~ NFR-012 전항목을 적용한다.

---

## 1. 컴포넌트 트리

```
app/page.tsx
└── <Board>                          ← DndContext 루트, 필터 상태, 모달 상태 관리
      ├── <Header>                   ← 새 업무 버튼 (FR-001)
      ├── <FilterBar>                ← 이번주·초과 필터 토글 (FR-017, FR-018)
      ├── <div className="board-layout">
      │     ├── <BacklogPanel>       ← useDroppable('Backlog'), role="list"
      │     │     └── <TicketCard>*  ← useDraggable, role="listitem"
      │     └── <div className="kanban-area">
      │           ├── <Column status="TODO">
      │           │     └── <TicketCard>*
      │           ├── <Column status="In Progress">
      │           │     └── <TicketCard>*
      │           └── <Column status="Done">
      │                 └── <TicketCard>*
      ├── <CreateModal>              ← 조건부 렌더링 (isOpen)
      └── <DetailModal>              ← 조건부 렌더링 (ticketId !== null)
            └── <ConfirmDialog>      ← 삭제 확인 (DetailModal 내부)
```

`TicketCard` 내부 서브컴포넌트:
```
<TicketCard>
  ├── <PriorityBadge>   ← priority 있을 때만
  └── <DueDateBadge>    ← dueDate 있을 때만
```

---

## 2. 공유 타입 참조

```typescript
// src/shared/types/ticket.ts (DATA_MODEL.md §4-2)
import type { TicketDto }    from '@/shared/types/ticket';

// src/shared/constants/status.ts (DATA_MODEL.md §4-1)
import type { ColumnStatus, Priority } from '@/shared/constants/status';

// src/shared/schemas/ticketSchema.ts (TRD §3-2)
import type { CreateTicketInput, UpdateTicketInput } from '@/shared/schemas/ticketSchema';

// Board 내 필터 상태 (로컬 타입)
type FilterState = {
  overdue:   boolean; // FR-017
  thisWeek:  boolean; // FR-018
};
```

---

## 3. 커스텀 훅 명세

### 3-1. useTickets

```typescript
// src/client/hooks/useTickets.ts
type UseTicketsReturn = {
  tickets:      TicketDto[];
  isLoading:    boolean;
  error:        string | null;
  createTicket: (input: CreateTicketInput) => Promise<TicketDto>;
  updateTicket: (id: string, input: UpdateTicketInput) => Promise<TicketDto>;
  deleteTicket: (id: string) => Promise<void>;
  moveTicket:   (id: string, status: ColumnStatus, order: number) => Promise<void>;
};
```

| 책임 | 상세 |
|------|------|
| 초기 로드 | 마운트 시 `GET /api/tickets` 호출, `tickets` 상태 저장 |
| createTicket | `POST /api/tickets` → 응답으로 상태 갱신 |
| updateTicket | `PATCH /api/tickets/:id` → 응답으로 상태 갱신 |
| deleteTicket | `DELETE /api/tickets/:id` → 해당 티켓 상태에서 제거 |
| moveTicket | 낙관적 업데이트 → `PATCH /api/tickets/:id` → 성공 시 재동기화, 실패 시 롤백 (FR-011, NFR-013, NFR-014) |

연관: FR-001~005, NFR-013, NFR-014, NFR-025

---

### 3-2. useDnd

```typescript
// src/client/hooks/useDnd.ts
import type { SensorDescriptor, DragEndEvent } from '@dnd-kit/core';

type UseDndReturn = {
  sensors:   SensorDescriptor<unknown>[];
  onDragEnd: (event: DragEndEvent) => void;
};
```

| 책임 | 상세 |
|------|------|
| 센서 설정 | MouseSensor, TouchSensor, KeyboardSensor 3종 활성화 (NFR-007, NFR-009) |
| onDragEnd | `active.id`(카드 id), `over.id`(칼럼 status) 기준으로 새 status·order 계산 후 `moveTicket` 호출 |
| order 계산 | 칼럼 최하단: `MAX(order) + 1000` / 사이 삽입: `Math.floor((prev + next) / 2)` / 차이 ≤ 1: 전체 재정규화 (NFR-015, AGENTS.md §6-4) |

연관: FR-009, FR-010, FR-011, NFR-007, NFR-009, NFR-013, NFR-015

---

## 4. 컴포넌트 상세 명세

---

### 4-1. Board

| 항목 | 내용 |
|------|------|
| **파일** | `src/client/components/Board/Board.tsx` |
| **책임** | 보드 전체 루트. `DndContext` 제공, 필터 상태·모달 상태 관리 |

**Props**: 없음 (`app/page.tsx`에서 직접 마운트)

**State**:
```typescript
const [filter, setFilter]               = useState<FilterState>({ overdue: false, thisWeek: false });
const [createModalOpen, setCreateModalOpen] = useState(false);
const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
```

**Derived**:
```typescript
const ticketsByColumn = useMemo(() => groupByStatus(filteredTickets), [filteredTickets]);
const filteredTickets = useMemo(() => applyFilter(tickets, filter), [tickets, filter]);
```

**이벤트**:
| 핸들러 | 동작 |
|--------|------|
| `handleFilterChange(key)` | `filter[key]` 토글 |
| `handleNewTicket()` | `createModalOpen = true` |
| `handleCardClick(id)` | `selectedTicketId = id` |
| `handleCreated(ticket)` | `createModalOpen = false`, tickets 갱신 |
| `handleUpdated(ticket)` | tickets 내 해당 항목 교체 |
| `handleDeleted(id)` | `selectedTicketId = null`, tickets에서 제거 |

**렌더 구조**:
```tsx
<DndContext sensors={sensors} onDragEnd={onDragEnd}>
  <Header onNewTicket={handleNewTicket} />
  <FilterBar filter={filter} onFilterChange={handleFilterChange} />
  <div className="board-layout">
    <BacklogPanel tickets={ticketsByColumn.Backlog} onCardClick={handleCardClick} />
    <div className="kanban-area">
      {(['TODO', 'In Progress', 'Done'] as const).map(status => (
        <Column key={status} status={status}
          tickets={ticketsByColumn[status]} onCardClick={handleCardClick} />
      ))}
    </div>
  </div>
  {createModalOpen && <CreateModal ... />}
  <DetailModal ticketId={selectedTicketId} ... />
  <div aria-live="polite" aria-atomic="true" className="sr-only">{announcement}</div>
</DndContext>
```

`aria-live` 영역: DnD 완료 시 `"[제목]이(가) [status]로 이동됐습니다."` 주입 (NFR-010)

연관: FR-006~011, FR-017, FR-018, NFR-013

---

### 4-2. Header

| 항목 | 내용 |
|------|------|
| **파일** | `src/client/components/Board/Header.tsx` |
| **책임** | 앱 헤더. 티켓 생성 진입점 제공 |

**Props**:
```typescript
type HeaderProps = {
  onNewTicket: () => void;
};
```

**렌더 요소**:
| 요소 | 구현 | 비고 |
|------|------|------|
| 새 업무 버튼 | `<button onClick={onNewTicket}>` | FR-001 |
| 검색 입력창 | **생략** | Post-MVP (PRD §4-2) |

연관: FR-001, PRD §4-2

---

### 4-3. FilterBar

| 항목 | 내용 |
|------|------|
| **파일** | `src/client/components/Board/FilterBar.tsx` |
| **책임** | 이번주·초과 필터 토글 버튼 2개 렌더링 |

**Props**:
```typescript
type FilterBarProps = {
  filter:           FilterState;
  onFilterChange:   (key: keyof FilterState) => void;
};
```

**버튼 명세**:
| 버튼 텍스트 | `key` | 활성 조건 | 활성 스타일 |
|-------------|-------|-----------|-------------|
| 이번주 업무 | `thisWeek` | `filter.thisWeek === true` | 강조 테두리·배경 |
| 일정이 초과된 업무 | `overdue` | `filter.overdue === true` | 빨간 테두리 (와이어프레임 기준) |

- 두 버튼 독립 토글, 동시 활성 가능 (OR 조건, PRD §4-3)
- 각 버튼은 `<button>` 태그, `aria-pressed={isActive}` 적용 (NFR-008, NFR-011)

연관: FR-017, FR-018, PRD §4-3

---

### 4-4. BacklogPanel

| 항목 | 내용 |
|------|------|
| **파일** | `src/client/components/Column/BacklogPanel.tsx` |
| **책임** | Backlog 전용 좌측 고정 패널. 드롭 영역 제공 |

**Props**:
```typescript
type BacklogPanelProps = {
  tickets:     TicketDto[];
  onCardClick: (id: string) => void;
};
```

**DnD**: `useDroppable({ id: 'Backlog' })`

**렌더 구조**:
```tsx
<aside ref={setNodeRef} role="list" aria-label="Backlog">
  <h2>Backlog</h2>
  {tickets.map(t => <TicketCard key={t.id} ticket={t} onClick={onCardClick} />)}
</aside>
```

- 카드 0개여도 드롭 영역 유지 (PRD §4-4 참조)
- 반응형: 768px 미만에서 가로 스크롤 영역 내 포함 (NFR-006)

연관: FR-006, FR-007, FR-008, FR-009, FR-010

---

### 4-5. Column

| 항목 | 내용 |
|------|------|
| **파일** | `src/client/components/Column/Column.tsx` |
| **책임** | TODO / In Progress / Done 칸반 칼럼. 드롭 영역 제공 |

**Props**:
```typescript
type ColumnProps = {
  status:      Exclude<ColumnStatus, 'Backlog'>;
  tickets:     TicketDto[];
  onCardClick: (id: string) => void;
};
```

**DnD**: `useDroppable({ id: status })`

**렌더 구조**:
```tsx
<section ref={setNodeRef} role="list" aria-label={status}>
  <h2>{status}</h2>
  {tickets.map(t => <TicketCard key={t.id} ticket={t} onClick={onCardClick} />)}
</section>
```

- 카드 0개여도 드롭 영역 최소 높이 유지 (PRD §4-5)

연관: FR-006, FR-007, FR-009, FR-010

---

### 4-6. TicketCard

| 항목 | 내용 |
|------|------|
| **파일** | `src/client/components/Card/TicketCard.tsx` |
| **책임** | 드래그 가능한 티켓 카드. 기한 경고 테두리, 필드 표시 |

**Props**:
```typescript
type TicketCardProps = {
  ticket:  TicketDto;
  onClick: (id: string) => void;
};
```

**표시 요소** (PRD §4-6):
| 요소 | 표시 조건 | 처리 |
|------|-----------|------|
| 제목 | 항상 | 최대 2줄, `line-clamp-2` |
| 설명 | `description` 있을 때 | 최대 1줄, `line-clamp-1` |
| PriorityBadge | `priority` 있을 때 | — |
| DueDateBadge | `dueDate` 있을 때 | — |
| 카드 테두리 | 항상 | `getDeadlineStyle(ticket.dueDate, ticket.status)` |

**테두리 클래스** (`getDeadlineStyle` 반환값, DATA_MODEL.md §4-1):
| 조건 | 클래스 | FR |
|------|--------|----|
| `dueDate < today` AND `status !== 'Done'` | `border-red-500` | FR-013 |
| `diffDays ∈ [0, 3]` AND `status !== 'Done'` | `border-orange-400` | FR-012 |
| 그 외 / `dueDate` 없음 / `status === 'Done'` | `border-gray-200` | FR-014 |

**DnD**: `useDraggable({ id: ticket.id })`

**접근성**:
- `role="listitem"`
- 드래그 중: `aria-grabbed="true"`
- 버튼 역할(`onClick`): `<div role="button" tabIndex={0}>`가 아닌 `<button>` 태그 사용 (NFR-011)

연관: FR-012, FR-013, FR-014, FR-015, NFR-009, NFR-010, NFR-011

---

### 4-7. PriorityBadge

| 항목 | 내용 |
|------|------|
| **파일** | `src/client/components/Card/PriorityBadge.tsx` |
| **책임** | 우선순위 값을 색상 뱃지로 표시 |

**Props**:
```typescript
type PriorityBadgeProps = {
  priority: Priority; // 'Low' | 'Medium' | 'High'
};
```

**색상 매핑**:
| 값 | Tailwind 클래스 예시 |
|----|---------------------|
| `Low` | `bg-gray-100 text-gray-600` |
| `Medium` | `bg-blue-100 text-blue-700` |
| `High` | `bg-red-100 text-red-700` |

> 색상 대비 WCAG AA 4.5:1 이상 준수 (NFR-012). 확정 색상은 와이어프레임 기준으로 조정.

연관: FR-015, NFR-012

---

### 4-8. DueDateBadge

| 항목 | 내용 |
|------|------|
| **파일** | `src/client/components/Card/DueDateBadge.tsx` |
| **책임** | 종료예정일(ISO 8601)을 읽기 쉬운 날짜로 표시 |

**Props**:
```typescript
type DueDateBadgeProps = {
  dueDate: string; // ISO 8601 (TicketDto.dueDate)
};
```

**포맷**: `new Date(dueDate)` → `M월 D일` (또는 `YYYY-MM-DD`, UI 확정 시 결정)

연관: FR-015

---

### 4-9. CreateModal

| 항목 | 내용 |
|------|------|
| **파일** | `src/client/components/Modal/CreateModal.tsx` |
| **책임** | 신규 티켓 생성 폼 모달. 클라이언트 Zod 검증 포함 |

**Props**:
```typescript
type CreateModalProps = {
  isOpen:    boolean;
  onClose:   () => void;
  onCreated: (ticket: TicketDto) => void;
};
```

**State**:
```typescript
const [form, setForm]           = useState<CreateTicketInput>({ title: '' });
const [errors, setErrors]       = useState<Partial<Record<keyof CreateTicketInput, string>>>({});
const [isSubmitting, setIsSubmitting] = useState(false);
```

**폼 필드** (PRD §4-7):
| 필드 | 필수 | 유효성 (NFR-016) |
|------|:----:|-----------------|
| `title` | ✅ | 최소 1자, 최대 255자 — 위반 시 저장 버튼 비활성화 |
| `description` | — | 제약 없음 |
| `priority` | — | `Low \| Medium \| High` 선택 |
| `startedAt` | — | ISO 8601 datetime |
| `dueDate` | — | ISO 8601 datetime |

**저장 흐름**:
1. `createTicketSchema.safeParse(form)` — 실패 시 errors 상태 업데이트, API 호출 없음
2. `ticketApi.create(parsed.data)` 호출
3. 성공: `onCreated(ticket)` → 모달 닫기
4. 실패: 토스트 에러 표시 (NFR-025)

**닫기**: ESC 또는 배경 클릭 (PRD §4-8)

**기본 status**: `Backlog` (서버 자동 할당, FR-001)

연관: FR-001, NFR-016, NFR-025

---

### 4-10. DetailModal

| 항목 | 내용 |
|------|------|
| **파일** | `src/client/components/Modal/DetailModal.tsx` |
| **책임** | 티켓 상세 조회, 인라인 수정, 삭제 |

**Props**:
```typescript
type DetailModalProps = {
  ticketId:  string | null; // null이면 비표시
  onClose:   () => void;
  onUpdated: (ticket: TicketDto) => void;
  onDeleted: (id: string) => void;
};
```

**State**:
```typescript
const [editField, setEditField]       = useState<keyof UpdateTicketInput | null>(null);
const [form, setForm]                 = useState<UpdateTicketInput>({});
const [confirmOpen, setConfirmOpen]   = useState(false);
const [isSubmitting, setIsSubmitting] = useState(false);
```

**표시 필드** (PRD §4-8):
- `title`, `description`, `priority`, `startedAt`, `dueDate`, `status`, `createdAt`

**수정 흐름**:
1. 필드 클릭 → `editField = 필드명`, 편집 모드 진입
2. 포커스 아웃 또는 저장 버튼 → `updateTicketSchema.safeParse(form)` 검증
3. 성공: `PATCH /api/tickets/:id` → `onUpdated(ticket)`
4. 실패: 토스트 에러 표시 (NFR-025)

**삭제 흐름**:
1. 삭제 버튼 클릭 → `confirmOpen = true`
2. ConfirmDialog 확인 → `DELETE /api/tickets/:id` → `onDeleted(ticketId)`
3. ConfirmDialog 취소 → `confirmOpen = false` (NFR-017)

**닫기**: ESC 또는 배경 클릭 (PRD §4-8)

연관: FR-004, FR-005, FR-016, NFR-017, NFR-025

---

### 4-11. ConfirmDialog

| 항목 | 내용 |
|------|------|
| **파일** | `src/client/components/Modal/ConfirmDialog.tsx` |
| **책임** | 파괴적 작업(삭제) 실행 전 사용자 확인 |

**Props**:
```typescript
type ConfirmDialogProps = {
  isOpen:    boolean;
  message:   string;          // 예: "정말 삭제하시겠습니까?"
  onConfirm: () => void;
  onCancel:  () => void;
};
```

- 확인 버튼(`<button>`), 취소 버튼(`<button>`) 모두 키보드 포커스 가능 (NFR-008)
- `role="alertdialog"`, `aria-modal="true"` 적용

연관: FR-005, NFR-017

---

## 5. 필터 유틸리티

필터 로직은 클라이언트 전용이며, `GET /api/tickets`는 항상 전체를 반환한다 (DATA_MODEL.md §5-3).

```typescript
// Board.tsx 내부 또는 src/client/utils/filter.ts

function applyFilter(tickets: TicketDto[], filter: FilterState): TicketDto[] {
  if (!filter.overdue && !filter.thisWeek) return tickets;
  return tickets.filter(t => {
    if (filter.overdue   && isOverdue(t))   return true;
    if (filter.thisWeek  && isThisWeek(t))  return true;
    return false;
  });
}

function isOverdue(t: TicketDto): boolean {
  if (!t.dueDate || t.status === 'Done') return false;
  return new Date(t.dueDate) < startOfToday();
}

function isThisWeek(t: TicketDto): boolean {
  if (!t.dueDate) return false;
  const due = new Date(t.dueDate);
  return due >= startOfWeek() && due <= endOfWeek();
}

function startOfToday(): Date {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d;
}

function startOfWeek(): Date {
  const d = startOfToday();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // 월요일 기준
  return d;
}

function endOfWeek(): Date {
  const d = startOfWeek();
  d.setDate(d.getDate() + 6); d.setHours(23, 59, 59, 999); return d;
}
```

연관: FR-017 (`isOverdue`), FR-018 (`isThisWeek`), DATA_MODEL.md §5-3

---

## 6. aria-live 상태 알림 (NFR-010)

`Board` 컴포넌트 내 스크린리더 전용 알림 영역:

```tsx
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {announcement}
</div>
```

**announcement 갱신 시점**:
| 이벤트 | 메시지 예시 |
|--------|------------|
| DnD 완료 (칼럼 간) | `"[제목]이(가) In Progress로 이동됐습니다."` |
| DnD 완료 (칼럼 내 순서) | `"[제목]의 순서가 변경됐습니다."` |
| DnD 실패 / 롤백 | `"이동에 실패했습니다. 이전 상태로 복원됐습니다."` |

---

## 7. 반응형 레이아웃 요약 (NFR-005, NFR-006)

| 화면폭 | Board 레이아웃 |
|--------|----------------|
| 768px 이상 | `board-layout`: flex-row, BacklogPanel 고정 너비 + kanban-area flex-grow |
| 768px 미만 | `board-layout`: 가로 스크롤, 4칼럼 모두 접근 가능 |

---

## 8. 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| v1.0 | 2026-06-15 | 최초 작성. PRD.md v1.0 · TRD.md v1.2 · DATA_MODEL.md v1.0 · API_SPEC.md v1.1 기반 |
