# API_SPEC.md — TicketTodo

> 작성일: 2026-06-15
> 버전: v1.1
> 기반 문서: REQUIREMENTS.md v1.1 · PRD.md v1.0 · TRD.md v1.2 · DATA_MODEL.md v1.0
> 스키마 SSOT: DATA_MODEL.md (TRD §3-1·§3-2 코드 예시보다 우선)

---

## 목차

1. [개요](#1-개요)
2. [공통 규칙](#2-공통-규칙)
3. [데이터 타입 정의](#3-데이터-타입-정의)
4. [엔드포인트](#4-엔드포인트)
   - [GET /api/tickets](#41-get-apitickets)
   - [POST /api/tickets](#42-post-apitickets)
   - [GET /api/tickets/:id](#43-get-apiticketsid)
   - [PATCH /api/tickets/:id](#44-patch-apiticketsid)
   - [DELETE /api/tickets/:id](#45-delete-apiticketsid)
5. [order 관리 규칙](#5-order-관리-규칙)
6. [미해결 이슈](#6-미해결-이슈)
7. [변경 이력](#7-변경-이력)

---

## 1. 개요

TicketTodo의 프론트엔드(Next.js Client Component)와 백엔드(Next.js App Router API Routes) 간 HTTP 인터페이스를 정의한다.

| 항목 | 내용 |
|------|------|
| 프로토콜 | HTTPS (NFR-022) |
| 아키텍처 | Next.js App Router Route Handler (Vercel Serverless Function) |
| 엔드포인트 수 | 5개 (FR-001 ~ FR-005) |
| 인증 | 없음 — 단일 사용자 MVP (REQUIREMENTS.md §1) |
| DB | Vercel Postgres (Neon 기반) · Drizzle ORM |

---

## 2. 공통 규칙

### Base URL

| 환경 | Base URL |
|------|----------|
| 로컬 개발 | `http://localhost:3000` |
| 프로덕션 | `https://<vercel-domain>.vercel.app` |

모든 엔드포인트 경로는 `/api/tickets` 하위에 위치한다.

### Content-Type

| 방향 | 값 |
|------|----|
| 요청 Body (POST·PATCH) | `application/json` |
| 응답 Body | `application/json` |
| 응답 없음 (DELETE 204) | — |

### 인증

없음. MVP는 단일 사용자 환경으로 인증·세션을 구현하지 않는다 (REQUIREMENTS.md §1).

### 날짜 형식

모든 날짜·시각 필드는 **ISO 8601 문자열**로 직렬화한다.

```
예시: "2026-06-15T00:00:00.000Z"
```

DB 컬럼 타입은 `timestamp`이며 (DATA_MODEL.md §0·§2), 응답 DTO에서 `.toISOString()`으로 변환한다 (DATA_MODEL.md §4-2).

### 공통 에러 응답 형식

```json
{
  "error": "에러 설명 문자열",
  "details": {}
}
```

- `details`: Zod 유효성 검증 실패 시 필드별 상세 오류를 포함한다. 그 외 에러는 빈 객체 `{}`로 반환한다 (TRD §6).
- API 500 에러는 반드시 서버 콘솔에 로깅한다 (NFR-025).

### HTTP 상태 코드

| 코드 | 사용 상황 |
|------|-----------|
| 200 | 성공 (GET·PATCH) |
| 201 | 생성 성공 (POST) |
| 204 | 삭제 성공 — 응답 Body 없음 (DELETE) |
| 400 | Zod 유효성 검증 실패 |
| 404 | 티켓 ID 미존재 |
| 500 | DB 오류 등 서버 내부 오류 |

---

## 3. 데이터 타입 정의

### 3-1. 열거형

```typescript
// src/shared/constants/status.ts (DATA_MODEL.md §4-1)

type ColumnStatus = 'Backlog' | 'TODO' | 'In Progress' | 'Done';
type Priority     = 'Low' | 'Medium' | 'High';
```

DB 컬럼 타입은 각각 `varchar(20)`, `varchar(10)`이며, 허용값은 Zod로 검증한다 (DATA_MODEL.md §0).

### 3-2. TicketDto — API 응답 객체

Route Handler가 클라이언트에 반환하는 표준 형태다 (DATA_MODEL.md §4-2).

```typescript
// src/shared/types/ticket.ts

type TicketDto = {
  id:          string;        // UUID
  title:       string;        // 최소 1자, 최대 255자 (NFR-016)
  description: string | null;
  status:      ColumnStatus;  // 'Backlog' | 'TODO' | 'In Progress' | 'Done'
  priority:    Priority | null; // 'Low' | 'Medium' | 'High' | null
  order:       number;        // 정수, 칼럼 내 정렬 순서 (NFR-015)
  startedAt:   string | null; // ISO 8601 (timestamp → string)
  dueDate:     string | null; // ISO 8601 (timestamp → string)
  createdAt:   string;        // ISO 8601 (자동 생성)
  updatedAt:   string;        // ISO 8601 (자동 갱신)
};
```

#### 필드 상세

| 필드 | 타입 | Null 가능 | 설명 |
|------|------|:---------:|------|
| `id` | `string` (UUID) | ✗ | 서버 자동 생성 PK |
| `title` | `string` | ✗ | 최소 1자, 최대 255자 (NFR-016) |
| `description` | `string` | ✓ | 티켓 설명 |
| `status` | `ColumnStatus` | ✗ | 칼럼 위치. 생성 시 기본값 `'Backlog'` |
| `priority` | `Priority` | ✓ | 우선순위. 미지정 가능 |
| `order` | `number` (정수) | ✗ | 칼럼 내 정렬 순서. 1000 단위 권장 (NFR-015) |
| `startedAt` | `string` | ✓ | 시작 예정일 (ISO 8601) |
| `dueDate` | `string` | ✓ | 종료 예정일. 기한 경고 기준 (FR-012~014) |
| `createdAt` | `string` | ✗ | 생성 시각 (ISO 8601, 자동) |
| `updatedAt` | `string` | ✗ | 수정 시각 (ISO 8601, 자동) |

### 3-3. CreateTicketInput — POST 요청 Body

```typescript
// Zod 기반 (TRD §3-2 + DATA_MODEL §0 반영)

type CreateTicketInput = {
  title:       string;        // 필수, min 1, max 255 (NFR-016)
  description?: string;       // 선택
  priority?:   Priority;      // 선택
  startedAt?:  string;        // 선택, ISO 8601
  dueDate?:    string;        // 선택, ISO 8601
};
```

- `status`와 `order`는 서버가 자동 할당한다 (status → `'Backlog'`, order → §5 규칙 참고).

### 3-4. UpdateTicketInput — PATCH 요청 Body

```typescript
// Zod 기반 (TRD §3-2 + DATA_MODEL §0 반영)

type UpdateTicketInput = {
  title?:       string;              // 선택, min 1, max 255 (NFR-016)
  description?: string | null;       // 선택, null로 전달 시 삭제
  priority?:    Priority | null;     // 선택, null로 전달 시 삭제
  status?:      ColumnStatus;        // 선택, DnD 칼럼 이동 시 사용 (FR-009)
  order?:       number;              // 선택, 정수. DnD 순서 변경 시 사용 (FR-008, FR-010)
  startedAt?:   string | null;       // 선택, ISO 8601, null로 전달 시 삭제
  dueDate?:     string | null;       // 선택, ISO 8601, null로 전달 시 삭제
};
```

- 모든 필드가 선택이며, 전달된 필드만 업데이트한다 (Partial Update).
- `status` + `order` 동시 전달: DnD 칼럼 간 이동 (FR-009).
- `order` 단독 전달: DnD 칼럼 내 순서 변경 (FR-010).

---

## 4. 엔드포인트

---

### 4-1. GET /api/tickets

전체 티켓 목록을 `order` 오름차순으로 조회한다.

| 항목 | 내용 |
|------|------|
| **Method** | `GET` |
| **Path** | `/api/tickets` |
| **연관 FR** | FR-002 |
| **인증** | 없음 |

#### Path Parameters

없음

#### Query Parameters

없음. 필터(FR-017·FR-018)는 클라이언트 전용이며, 이 엔드포인트는 항상 전체 티켓을 반환한다 (DATA_MODEL.md §5-3).

#### Request Body

없음

#### Success Response

| 항목 | 값 |
|------|----|
| **HTTP 상태** | `200 OK` |
| **Content-Type** | `application/json` |
| **Body** | `TicketDto[]` |

- `order` 오름차순 정렬 (TRD §6).
- 티켓이 없으면 빈 배열 `[]`을 반환한다.

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "title": "스프린트 백로그 우선순위 정리",
    "description": "다음 스프린트 착수 전 항목 재조정",
    "status": "TODO",
    "priority": "High",
    "order": 1000,
    "startedAt": "2026-06-15T00:00:00.000Z",
    "dueDate": "2026-06-17T00:00:00.000Z",
    "createdAt": "2026-06-11T09:00:00.000Z",
    "updatedAt": "2026-06-11T09:00:00.000Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "title": "경쟁사 분석 리포트 작성",
    "description": null,
    "status": "Backlog",
    "priority": "Low",
    "order": 2000,
    "startedAt": null,
    "dueDate": null,
    "createdAt": "2026-06-11T09:05:00.000Z",
    "updatedAt": "2026-06-11T09:05:00.000Z"
  }
]
```

#### Error Responses

| HTTP 상태 | 발생 조건 | 응답 예시 |
|-----------|-----------|-----------|
| `500` | DB 조회 실패 등 서버 오류 | `{ "error": "Internal server error", "details": {} }` |

---

### 4-2. POST /api/tickets

새 티켓을 생성한다. 기본 status는 `Backlog`이며, order는 서버가 자동 계산한다.

| 항목 | 내용 |
|------|------|
| **Method** | `POST` |
| **Path** | `/api/tickets` |
| **연관 FR** | FR-001 |
| **인증** | 없음 |

#### Path Parameters

없음

#### Query Parameters

없음

#### Request Body

| 항목 | 값 |
|------|----|
| **Content-Type** | `application/json` |
| **Body** | `CreateTicketInput` |

| 필드 | 타입 | 필수 | 제약 조건 |
|------|------|:----:|-----------|
| `title` | `string` | ✅ | 최소 1자, 최대 255자 (NFR-016) |
| `description` | `string` | — | 제약 없음 |
| `priority` | `'Low' \| 'Medium' \| 'High'` | — | 열거값 외 거부 (400) |
| `startedAt` | `string` (ISO 8601) | — | 유효한 날짜 문자열 |
| `dueDate` | `string` (ISO 8601) | — | 유효한 날짜 문자열 |

```json
{
  "title": "API 문서 초안 작성",
  "description": "OpenAPI 스펙 기반 Swagger 문서 초안",
  "priority": "Medium",
  "startedAt": "2026-06-15T00:00:00.000Z",
  "dueDate": "2026-06-22T00:00:00.000Z"
}
```

#### Success Response

| 항목 | 값 |
|------|----|
| **HTTP 상태** | `201 Created` |
| **Content-Type** | `application/json` |
| **Body** | `TicketDto` (생성된 티켓) |

- `status`는 항상 `'Backlog'`로 생성된다 (FR-001).
- `order`는 Backlog 칼럼 내 `MAX(order) + 1000`으로 자동 계산된다 (§5).

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "title": "API 문서 초안 작성",
  "description": "OpenAPI 스펙 기반 Swagger 문서 초안",
  "status": "Backlog",
  "priority": "Medium",
  "order": 3000,
  "startedAt": "2026-06-15T00:00:00.000Z",
  "dueDate": "2026-06-22T00:00:00.000Z",
  "createdAt": "2026-06-15T12:00:00.000Z",
  "updatedAt": "2026-06-15T12:00:00.000Z"
}
```

#### Error Responses

| HTTP 상태 | 발생 조건 | 응답 예시 |
|-----------|-----------|-----------|
| `400` | `title` 누락 또는 255자 초과 | `{ "error": "Validation failed", "details": { "title": ["String must contain at least 1 character(s)"] } }` |
| `400` | `priority` 허용값 외 값 | `{ "error": "Validation failed", "details": { "priority": ["Invalid enum value"] } }` |
| `400` | `startedAt` / `dueDate` 날짜 형식 오류 | `{ "error": "Validation failed", "details": { "dueDate": ["Invalid date string"] } }` |
| `500` | DB 삽입 실패 등 서버 오류 | `{ "error": "Internal server error", "details": {} }` |

---

### 4-3. GET /api/tickets/:id

특정 티켓의 상세 정보를 단건 조회한다.

| 항목 | 내용 |
|------|------|
| **Method** | `GET` |
| **Path** | `/api/tickets/:id` |
| **연관 FR** | FR-003 |
| **인증** | 없음 |

#### Path Parameters

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|:----:|------|
| `id` | `string` (UUID) | ✅ | 조회할 티켓의 고유 식별자 |

#### Query Parameters

없음

#### Request Body

없음

#### Success Response

| 항목 | 값 |
|------|----|
| **HTTP 상태** | `200 OK` |
| **Content-Type** | `application/json` |
| **Body** | `TicketDto` |

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "title": "결제 모듈 버그 수정",
  "description": "카드 결제 실패 시 오류 메시지 미표시 이슈",
  "status": "In Progress",
  "priority": "High",
  "order": 1000,
  "startedAt": "2026-06-10T00:00:00.000Z",
  "dueDate": "2026-06-13T00:00:00.000Z",
  "createdAt": "2026-06-10T08:30:00.000Z",
  "updatedAt": "2026-06-10T08:30:00.000Z"
}
```

#### Error Responses

| HTTP 상태 | 발생 조건 | 응답 예시 |
|-----------|-----------|-----------|
| `404` | `id`에 해당하는 티켓 없음 | `{ "error": "Ticket not found", "details": {} }` |
| `500` | DB 조회 실패 등 서버 오류 | `{ "error": "Internal server error", "details": {} }` |

---

### 4-4. PATCH /api/tickets/:id

티켓의 필드, status(칼럼), order(순서)를 부분 업데이트한다. 전달된 필드만 변경한다.

| 항목 | 내용 |
|------|------|
| **Method** | `PATCH` |
| **Path** | `/api/tickets/:id` |
| **연관 FR** | FR-004 (필드 수정), FR-008 (칼럼 내 순서), FR-009 (칼럼 간 이동), FR-010 (칼럼 내 순서 변경) |
| **인증** | 없음 |

#### Path Parameters

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|:----:|------|
| `id` | `string` (UUID) | ✅ | 수정할 티켓의 고유 식별자 |

#### Query Parameters

없음

#### Request Body

| 항목 | 값 |
|------|----|
| **Content-Type** | `application/json` |
| **Body** | `UpdateTicketInput` (모든 필드 선택) |

| 필드 | 타입 | 필수 | 제약 조건 |
|------|------|:----:|-----------|
| `title` | `string` | — | 최소 1자, 최대 255자 (NFR-016) |
| `description` | `string \| null` | — | `null` 전달 시 값 삭제 |
| `priority` | `'Low' \| 'Medium' \| 'High' \| null` | — | `null` 전달 시 값 삭제 |
| `status` | `ColumnStatus` | — | 허용값 외 거부 (400). DnD 칼럼 이동 시 사용 (FR-009) |
| `order` | `number` (정수) | — | DnD 순서 변경 시 사용 (FR-008, FR-010) |
| `startedAt` | `string \| null` (ISO 8601) | — | `null` 전달 시 값 삭제 |
| `dueDate` | `string \| null` (ISO 8601) | — | `null` 전달 시 값 삭제 |

**사용 시나리오별 요청 예시**

**① 티켓 필드 수정 (FR-004)**

```json
{
  "title": "결제 모듈 버그 수정 (긴급)",
  "priority": "High",
  "dueDate": "2026-06-20T00:00:00.000Z"
}
```

**② DnD — 칼럼 간 이동 (FR-009): `status` + `order` 동시 전달**

```json
{
  "status": "In Progress",
  "order": 1500
}
```

**③ DnD — 칼럼 내 순서 변경 (FR-010): `order`만 전달**

```json
{
  "order": 1500
}
```

**④ `description` 삭제**

```json
{
  "description": null
}
```

#### Success Response

| 항목 | 값 |
|------|----|
| **HTTP 상태** | `200 OK` |
| **Content-Type** | `application/json` |
| **Body** | `TicketDto` (업데이트된 티켓 전체) |

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "title": "결제 모듈 버그 수정 (긴급)",
  "description": "카드 결제 실패 시 오류 메시지 미표시 이슈",
  "status": "In Progress",
  "priority": "High",
  "order": 1500,
  "startedAt": "2026-06-10T00:00:00.000Z",
  "dueDate": "2026-06-20T00:00:00.000Z",
  "createdAt": "2026-06-10T08:30:00.000Z",
  "updatedAt": "2026-06-15T14:00:00.000Z"
}
```

#### Error Responses

| HTTP 상태 | 발생 조건 | 응답 예시 |
|-----------|-----------|-----------|
| `400` | `title`이 빈 문자열 또는 255자 초과 | `{ "error": "Validation failed", "details": { "title": ["String must contain at least 1 character(s)"] } }` |
| `400` | `status` 허용값 외 값 | `{ "error": "Validation failed", "details": { "status": ["Invalid enum value"] } }` |
| `400` | `order`가 정수가 아님 | `{ "error": "Validation failed", "details": { "order": ["Expected integer, received float"] } }` |
| `404` | `id`에 해당하는 티켓 없음 | `{ "error": "Ticket not found", "details": {} }` |
| `500` | DB 업데이트 실패 등 서버 오류 | `{ "error": "Internal server error", "details": {} }` |

---

### 4-5. DELETE /api/tickets/:id

티켓을 하드 삭제한다. 삭제 전 확인 다이얼로그는 클라이언트 책임이다.

| 항목 | 내용 |
|------|------|
| **Method** | `DELETE` |
| **Path** | `/api/tickets/:id` |
| **연관 FR** | FR-005 |
| **인증** | 없음 |

#### Path Parameters

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|:----:|------|
| `id` | `string` (UUID) | ✅ | 삭제할 티켓의 고유 식별자 |

#### Query Parameters

없음

#### Request Body

없음

#### Success Response

| 항목 | 값 |
|------|----|
| **HTTP 상태** | `204 No Content` |
| **Body** | 없음 |

- 삭제는 **하드 삭제**다. 소프트 삭제(soft delete)는 MVP 범위 밖이다 (NFR-017).
- 클라이언트는 삭제 API 호출 전 **확인 다이얼로그**를 반드시 표시해야 한다 (NFR-017, FR-005).

#### Error Responses

| HTTP 상태 | 발생 조건 | 응답 예시 |
|-----------|-----------|-----------|
| `404` | `id`에 해당하는 티켓 없음 | `{ "error": "Ticket not found", "details": {} }` |
| `500` | DB 삭제 실패 등 서버 오류 | `{ "error": "Internal server error", "details": {} }` |

---

## 5. order 관리 규칙

칼럼 내 티켓 순서를 관리하는 규칙이다 (NFR-015). 서비스 레이어(`ticketService.ts`)에서 처리한다.

| 상황 | 계산 방법 |
|------|-----------|
| 칼럼 최초 삽입 | `order = 1000` |
| 칼럼 최하단 삽입 | `order = MAX(해당 칼럼 order) + 1000` |
| 카드 사이 삽입 | `order = Math.floor((prevOrder + nextOrder) / 2)` |
| 충돌 감지 (인접 order 차이 ≤ 1) | 해당 칼럼 전체 order를 `1000, 2000, 3000, …`으로 재정규화 |

**DnD 흐름 (FR-009, FR-010, NFR-013):**

1. 드롭 즉시 클라이언트 상태 낙관적 업데이트
2. `PATCH /api/tickets/:id` 호출 (`status` ± `order` 전달)
3. 성공: 서버 반환값으로 클라이언트 상태 재동기화 (NFR-014)
4. 실패: 드롭 전 상태로 자동 롤백 (NFR-013)

---

## 6. 이슈 이력

### ISSUE-001: `startedAt` / `dueDate` Zod 검증자 불일치

| 항목 | 내용 |
|------|------|
| **상태** | ✅ 해결됨 (2026-06-15) |
| **문서** | TRD §3-2 (Zod 스키마) vs. DATA_MODEL.md §0 (스키마 확정) |
| **충돌** | TRD §3-2는 `z.string().date()`(YYYY-MM-DD 전용)를 사용하지만, DATA_MODEL §0에서 DB 컬럼 타입이 `date` → `timestamp`로 변경됨 |
| **영향** | `z.string().date()`는 `"2026-06-15T00:00:00.000Z"` 같은 ISO 8601 datetime 문자열을 거부할 수 있음 |
| **해결** | TRD.md §3-2의 `createTicketSchema` / `updateTicketSchema` 해당 필드를 `z.string().datetime()`으로 변경 완료 (TRD v1.2) |

---

## 7. 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| v1.1 | 2026-06-15 | §6 ISSUE-001 해결됨 — TRD §3-2 z.string().datetime() 변경 완료 (TRD v1.2) |
| v1.0 | 2026-06-15 | 최초 작성. REQUIREMENTS.md v1.0 · PRD.md v1.0 · TRD.md v1.1 · DATA_MODEL.md v1.0 기반 |
