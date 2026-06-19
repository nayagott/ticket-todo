# Data Model: POST /api/tickets

**Branch**: `001-post-tickets-api-spec` | **Date**: 2026-06-19

> SSOT: `docs/DATA_MODEL.md` 및 `src/server/db/schema.ts`

---

## 1. 핵심 엔티티

### CreateTicketInput (요청 DTO)

```
src/shared/schemas/ticketSchema.ts → createTicketSchema
```

| 필드 | 타입 | 필수 | 제약 |
|------|------|:----:|------|
| `title` | `string` | ✅ | min 1, max 255 |
| `description` | `string` | — | 제약 없음 |
| `priority` | `'Low' \| 'Medium' \| 'High'` | — | 열거값만 허용 |
| `startedAt` | `string` (ISO 8601) | — | `z.string().datetime()` |
| `dueDate` | `string` (ISO 8601) | — | `z.string().datetime()` |

- `status`, `order`: 클라이언트 전달 불가. 서버 자동 할당.

### TicketDto (응답 DTO)

```
src/shared/types/ticket.ts → TicketDto
```

| 필드 | 타입 | Nullable | 비고 |
|------|------|:--------:|------|
| `id` | `string` (UUID) | ✗ | 서버 자동 생성 |
| `title` | `string` | ✗ | |
| `description` | `string` | ✓ | |
| `status` | `ColumnStatus` | ✗ | 항상 `'Backlog'` |
| `priority` | `Priority` | ✓ | |
| `order` | `number` (int) | ✗ | 자동 계산 |
| `startedAt` | `string` (ISO 8601) | ✓ | |
| `dueDate` | `string` (ISO 8601) | ✓ | |
| `createdAt` | `string` (ISO 8601) | ✗ | 자동 생성 |
| `updatedAt` | `string` (ISO 8601) | ✗ | 자동 갱신 |

### Ticket DB Row

```
src/server/db/schema.ts → tickets (pgTable)
```

| 컬럼 | DB 타입 | Nullable | 기본값 |
|------|---------|:--------:|--------|
| `id` | `uuid` | ✗ | `defaultRandom()` |
| `title` | `varchar(255)` | ✗ | — |
| `description` | `text` | ✓ | — |
| `status` | `varchar(20)` | ✗ | `'Backlog'` |
| `priority` | `varchar(10)` | ✓ | — |
| `order` | `integer` | ✗ | — |
| `started_at` | `timestamp` | ✓ | — |
| `due_date` | `timestamp` | ✓ | — |
| `created_at` | `timestamp` | ✗ | `defaultNow()` |
| `updated_at` | `timestamp` | ✗ | `defaultNow()` + `$onUpdate` |

**인덱스**:
- `idx_tickets_status_order` — `(status, order)` 복합 인덱스
- `idx_tickets_due_date` — `due_date` 단일 인덱스

---

## 2. 데이터 흐름

```
[CreateModal 폼 입력]
        │
        ▼ z.safeParse(createTicketSchema) — 클라이언트 검증
[ticketApi.create(input)]
        │ POST /api/tickets
        ▼
[Route Handler: route.ts]
        │ z.safeParse(createTicketSchema) — 서버 독립 검증
        ▼
[ticketService.createTicket(input)]
        │ getNextBacklogOrder() → SELECT MAX(order) WHERE status='Backlog'
        │ db.insert(tickets).values({ ...input, status: 'Backlog', order })
        ▼
[toTicketDto(row)] → TicketDto
        │ HTTP 201
        ▼
[useTickets 상태 갱신 → Board 리렌더]
```

---

## 3. order 계산 규칙 (API_SPEC §5)

| 상황 | 계산 |
|------|------|
| Backlog 첫 번째 티켓 | `order = 1000` |
| Backlog 기존 티켓 있음 | `order = MAX(Backlog.order) + 1000` |
