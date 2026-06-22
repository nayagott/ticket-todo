# Feature Specification: POST /api/tickets — 티켓 생성 API 구현

**Feature Branch**: `001-post-tickets-api-spec`

**Created**: 2026-06-19

**Status**: Draft

**Input**: User description: "API_SPEC.md의 POST /api/tickets 명세를 확인하고 구현에 필요한 요구사항을 정리해줘."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 필수 필드로 티켓 생성 (Priority: P1)

사용자가 제목(title)만 입력해 새 티켓을 생성한다. 생성된 티켓은 Backlog 칼럼에 자동 배치되며, 화면에 즉시 표시된다.

**Why this priority**: 티켓 생성은 칸반 보드의 핵심 시작점이다. 최소 입력만으로 생성 가능해야 MVP의 기본 동작을 보장한다.

**Independent Test**: `POST /api/tickets` 에 `{ "title": "테스트 티켓" }` 를 전송하면 HTTP 201과 함께 `status: "Backlog"`, `order: 1000` (초기 삽입 시) 인 TicketDto가 반환된다.

**Acceptance Scenarios**:

1. **Given** 칸반 보드에 티켓이 없는 상태에서, **When** `{ "title": "내 첫 티켓" }` 으로 POST 요청을 보내면, **Then** HTTP 201과 `status: "Backlog"`, `order: 1000`, `id`(UUID), `createdAt`, `updatedAt` 이 포함된 TicketDto가 반환된다.
2. **Given** Backlog 칼럼에 이미 티켓이 있는 상태에서, **When** title만 포함한 POST 요청을 보내면, **Then** `order = MAX(기존 Backlog order) + 1000` 으로 새 티켓이 생성된다.
3. **Given** 유효한 요청에서, **When** 응답을 확인하면, **Then** 응답 DTO의 `priority`, `description`, `startedAt`, `dueDate` 는 모두 `null` 이다.

---

### User Story 2 - 선택 필드 포함 티켓 생성 (Priority: P2)

사용자가 설명, 우선순위, 시작일, 종료일을 모두 입력해 상세한 티켓을 생성한다.

**Why this priority**: 선택 필드는 티켓 관리의 유용성을 높이는 부가 요소로, P1의 기본 생성 이후 확인한다.

**Independent Test**: `POST /api/tickets` 에 title 외 모든 선택 필드를 포함한 요청을 보내면, 응답 TicketDto에 해당 값들이 그대로 반영된다.

**Acceptance Scenarios**:

1. **Given** 유효한 요청 바디 `{ "title": "...", "description": "...", "priority": "High", "startedAt": "2026-06-20T00:00:00.000Z", "dueDate": "2026-06-27T00:00:00.000Z" }` 을 전송하면, **Then** 응답 TicketDto의 각 필드가 입력값과 일치한다.
2. **Given** `priority: "Medium"` 으로 요청하면, **Then** 응답에 `priority: "Medium"` 이 포함된다.
3. **Given** `startedAt` / `dueDate` 를 ISO 8601 datetime 문자열로 전달하면, **Then** 응답에서도 ISO 8601 형식으로 반환된다.

---

### User Story 3 - 유효하지 않은 입력 거부 (Priority: P3)

잘못된 요청 바디(title 누락, title 길이 초과, priority 열거값 외 등)를 전송하면 서버가 400 에러를 반환하고 어떤 필드가 왜 잘못됐는지 알린다.

**Why this priority**: 유효성 검증은 데이터 무결성 보장을 위한 필수 방어선이지만, 정상 흐름보다 우선순위는 낮다.

**Independent Test**: 각 오류 케이스에 대해 개별적으로 요청을 보내 HTTP 400과 `{ "error": "Validation failed", "details": { ... } }` 가 반환되는지 검증한다.

**Acceptance Scenarios**:

1. **Given** `title` 이 없는 요청을 보내면, **Then** HTTP 400, `error: "Validation failed"`, `details.title` 에 오류 메시지가 포함된다.
2. **Given** `title` 이 256자 이상인 요청을 보내면, **Then** HTTP 400, `details.title` 에 최대 길이 초과 오류가 포함된다.
3. **Given** `priority: "Critical"` (허용값 외) 를 보내면, **Then** HTTP 400, `details.priority` 에 열거값 오류가 포함된다.
4. **Given** `dueDate: "20260620"` (잘못된 형식) 를 보내면, **Then** HTTP 400, `details.dueDate` 에 날짜 형식 오류가 포함된다.
5. **Given** DB 삽입 중 서버 오류가 발생하면, **Then** HTTP 500, `{ "error": "Internal server error", "details": {} }` 가 반환되고 서버 콘솔에 에러가 로깅된다.

---

### Edge Cases

- `title` 이 정확히 255자일 때 → 정상 생성 (경계값 허용)
- `title` 이 정확히 1자일 때 → 정상 생성 (최소값 허용)
- `title` 이 빈 문자열(`""`) 일 때 → 400 반환
- Backlog 칼럼에 티켓이 없을 때 최초 삽입 → `order: 1000`
- 요청 바디에 `status` 또는 `order` 를 포함해도 → 서버가 무시하고 자동 할당값 사용
- `description` 이 빈 문자열일 때 → 허용 (제약 없음)

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 시스템은 `POST /api/tickets` 엔드포인트로 새 티켓을 생성해야 한다 (FR-001).
- **FR-002**: 요청 바디의 `title` 은 필수이며, 최소 1자·최대 255자를 만족해야 한다 (NFR-016).
- **FR-003**: `description`, `priority`, `startedAt`, `dueDate` 는 선택 필드다. 미전달 시 `null` 로 저장된다.
- **FR-004**: `priority` 는 `'Low'`, `'Medium'`, `'High'` 세 값만 허용한다. 그 외 값은 400으로 거부한다.
- **FR-005**: `startedAt` / `dueDate` 는 ISO 8601 datetime 형식(`z.string().datetime()`) 의 유효한 날짜 문자열이어야 한다.
- **FR-006**: `status` 는 클라이언트가 전달하더라도 서버가 무시하며, 생성 시 항상 `'Backlog'` 로 고정된다 (FR-001).
- **FR-007**: `order` 는 서버가 자동 계산한다. Backlog 칼럼의 `MAX(order) + 1000`, 최초 삽입 시 `1000` (NFR-015, API_SPEC §5).
- **FR-008**: 모든 입력 유효성 검증은 Zod 스키마로 수행한다. Route Handler(서버)와 클라이언트 각각 독립 검증한다 (NFR-016, Constitution IV).
- **FR-009**: 성공 응답은 HTTP 201이며, 생성된 티켓을 `TicketDto` 형식으로 반환한다.
- **FR-010**: 에러 응답은 `{ "error": "...", "details": {} }` 형식을 따른다 (Constitution III).
- **FR-011**: HTTP 500 에러 발생 시 서버 콘솔에 `console.error` 로 로깅한다 (NFR-025).
- **FR-012**: DB 접근(order 계산·삽입)은 서비스 레이어(`ticketService.ts`)에서만 처리한다. Route Handler에서 직접 Drizzle 쿼리 작성 금지 (Constitution V).

### Key Entities

- **CreateTicketInput**: 클라이언트가 POST 바디로 전달하는 입력 객체 — `title`(필수), `description`·`priority`·`startedAt`·`dueDate`(선택)
- **TicketDto**: 서버가 응답으로 반환하는 티켓 표준 형태 — `id`, `title`, `description`, `status`, `priority`, `order`, `startedAt`, `dueDate`, `createdAt`, `updatedAt`
- **Ticket (DB Row)**: PostgreSQL `tickets` 테이블에 저장되는 레코드. `DATA_MODEL.md` 가 SSOT.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 유효한 POST 요청에 대해 응답 시간이 300ms 이내 (p95 기준) 로 HTTP 201과 TicketDto를 반환한다 (NFR).
- **SC-002**: `title` 누락·길이 초과·`priority` 열거값 오류·날짜 형식 오류 등 4가지 유효성 실패 케이스가 모두 HTTP 400으로 거부된다.
- **SC-003**: 생성된 티켓의 `status` 는 항상 `'Backlog'` 이며, `order` 는 해당 칼럼 내 최대값 + 1000 으로 계산된다.
- **SC-004**: 관련 단위·통합 테스트(`docs/TEST_CASES.md` 기준 TC) 가 모두 통과한다.
- **SC-005**: TypeScript 타입 오류 0건, ESLint 오류 0건 상태에서 빌드가 성공한다 (Constitution I, Quality Gates).

---

## Assumptions

- 단일 사용자 MVP이므로 인증·세션 없이 구현한다 (REQUIREMENTS.md §1).
- `src/shared/schemas/ticketSchema.ts` 의 Zod 스키마가 클라이언트·서버 공통으로 사용된다.
- `order` 충돌 감지(인접 차이 ≤ 1) 및 재정규화 로직은 PATCH 엔드포인트 범위이며, POST 생성 시에는 단순히 `MAX + 1000` 만 적용한다.
- `startedAt` / `dueDate` 유효성 검증은 `z.string().datetime()` 을 사용한다 (ISSUE-001 해결, API_SPEC §6).
- 요청 바디의 알 수 없는 추가 필드는 Zod가 자동으로 무시하거나 `strip()` 처리한다.
- DB 삽입 후 반환된 Row를 `toTicketDto()` 변환 함수를 통해 TicketDto 형식으로 응답한다.
