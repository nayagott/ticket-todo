# Implementation Plan: POST /api/tickets — 티켓 생성 API

**Branch**: `001-post-tickets-api-spec` | **Date**: 2026-06-19 | **Spec**: [spec.md](./spec.md)

**Input**: "POST /api/tickets를 구현할 계획을 세워줘. Zod 검증, Route Handler, Service 레이어 분리를 고려해."

---

## Summary

`POST /api/tickets` 엔드포인트의 **서버 측 구현은 완료**되어 있으며, 관련 테스트(TC-API-004~014) 11개가 전원 통과한다. 잔여 작업은 클라이언트 측 `ticketApi.create()` 함수, `CreateModal` 컴포넌트, `useTickets` 훅 확장으로 FR-001 전체를 완성하는 것이다.

---

## Technical Context

**Language/Version**: TypeScript 5 (strict), Node.js (Vercel Serverless)

**Primary Dependencies**: Next.js 16 App Router, Drizzle ORM, postgres.js, @dnd-kit/core, Zod ^4, Tailwind CSS ^4

**Storage**: PostgreSQL (로컬: localhost / 배포: Vercel Postgres Neon)

**Testing**: Jest + next-test-api-route-handler (API), React Testing Library (컴포넌트), MSW v2 (통합)

**Target Platform**: Vercel (HTTPS, Serverless Function)

**Project Type**: Web application (Next.js 풀스택)

**Performance Goals**: API p95 ≤ 300ms, FCP ≤ 2초

**Constraints**: 계층 경계 엄수 (`src/server/` ↔ `src/client/` 상호 import 금지), `any` 타입 금지

**Scale/Scope**: 단일 사용자 MVP, 5개 API 엔드포인트

---

## Constitution Check

*GATE: 서버 측 구현 완료 기준 평가*

- [x] **I. TypeScript Strict** — `any` 타입 없음, 모든 함수에 명시적 타입 선언 ✅
- [x] **II. API Contract** — `docs/API_SPEC.md §4-2` 기준 100% 일치 구현 ✅
- [x] **III. Error Shape** — `{ "error": "...", "details": {} }` 형식 준수 (`responses.ts`) ✅
- [x] **IV. Zod Validation** — 서버 Route Handler에서 `createTicketSchema.safeParse()` 적용 ✅ (클라이언트 검증은 CreateModal 구현 시 추가 필요 ⚠️)
- [x] **V. Service Layer** — `createTicket()` + `getNextBacklogOrder()` 가 `ticketService.ts`에만 위치 ✅

**게이트 위반 없음. 클라이언트 Zod 검증(Constitution IV)은 CreateModal 구현 단계에서 적용 필요.**

---

## Project Structure

### Documentation (this feature)

```text
specs/001-post-tickets-api-spec/
├── spec.md              ✅ 완료
├── plan.md              ✅ 이 파일
├── research.md          ✅ Phase 0 완료
├── data-model.md        ✅ Phase 1 완료
├── contracts/
│   └── post-tickets.md  ✅ Phase 1 완료
└── checklists/
    └── requirements.md  ✅ 완료
```

### Source Code (현재 상태)

```text
src/
├── app/api/tickets/
│   ├── route.ts                         ✅ GET + POST Handler 구현 완료
│   ├── _lib/responses.ts                ✅ 에러 응답 헬퍼 구현 완료
│   └── __tests__/route.test.ts          ✅ TC-API-004~014 통과 (11개)
├── server/services/ticketService.ts     ✅ createTicket() + getNextBacklogOrder()
├── shared/
│   ├── schemas/ticketSchema.ts          ✅ createTicketSchema (Zod)
│   └── types/ticket.ts                  ✅ TicketDto, toTicketDto()
└── client/
    ├── api/ticketApi.ts                 ❌ create() 함수 미구현
    ├── components/Modal/                ❌ CreateModal 컴포넌트 미구현
    └── hooks/useTickets.ts              ⚠️ createTicket 액션 미포함
```

---

## 구현 단계 (잔여 작업)

### Step 1 — `ticketApi.create()` 함수 추가

**파일**: `src/client/api/ticketApi.ts`

```typescript
create: async (input: CreateTicketInput): Promise<TicketDto> => {
  const res = await fetch('/api/tickets', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Failed to create ticket');
  return res.json();
},
```

- `CreateTicketInput` 타입은 `src/shared/schemas/ticketSchema.ts`에서 import

---

### Step 2 — `useTickets` 훅에 `createTicket` 추가

**파일**: `src/client/hooks/useTickets.ts`

- `ticketApi.create(input)` 호출 후 전체 목록 재패칭 또는 낙관적 업데이트
- 에러 시 사용자에게 알림 (NFR-013 기준)

---

### Step 3 — `CreateModal` 컴포넌트 구현

**파일**: `src/client/components/Modal/CreateModal.tsx`

| 요소 | 내용 |
|------|------|
| 폼 필드 | `title` (필수), `description`, `priority`, `startedAt`, `dueDate` (선택) |
| 클라이언트 검증 | `createTicketSchema.safeParse()` — 제출 시 독립 실행 (Constitution IV) |
| 에러 표시 | 필드별 Zod 오류 메시지 인라인 표시 |
| 제출 | `useTickets.createTicket(input)` 호출 |
| 접근성 | 모달 `role="dialog"`, `aria-modal="true"`, `aria-labelledby` (NFR-010~012) |
| 취소 | ESC 키 또는 취소 버튼으로 닫기 |

---

### Step 4 — Board / BacklogPanel에 "티켓 추가" 버튼 연결

**파일**: `src/client/components/Column/BacklogPanel.tsx` 또는 Board 헤더

- 버튼 클릭 → `CreateModal` 오픈
- `wireframe.png` 참조: Backlog 칼럼 상단 "+" 버튼

---

### Step 5 — CreateModal 테스트 작성

**파일**: `src/client/components/Modal/__tests__/CreateModal.test.tsx`

| TC-ID | 테스트명 | 분류 |
|-------|---------|:----:|
| TC-COMP-XXX | title만 입력 후 제출 → useTickets.createTicket 호출 | ✅ Happy |
| TC-COMP-XXX | title 누락 상태에서 제출 → 클라이언트 Zod 에러 표시 | ❌ Error |
| TC-COMP-XXX | priority 선택 후 제출 → 올바른 input 전달 | ✅ Happy |
| TC-COMP-XXX | 취소 버튼 클릭 → 모달 닫힘 | ✅ Happy |
| TC-COMP-XXX | role="dialog" + aria-modal="true" | ♿ A11y |

---

## Complexity Tracking

Constitution Check 위반 없음. 복잡도 트래킹 불필요.

---

## 체크리스트 (구현 완료 기준)

- [x] `POST /api/tickets` Route Handler 구현
- [x] `ticketService.createTicket()` 서비스 구현
- [x] `createTicketSchema` Zod 서버 검증
- [x] 에러 응답 형식 (`responses.ts`)
- [x] TC-API-004~014 통과 (서버 테스트 11개)
- [ ] `ticketApi.create()` 클라이언트 API 함수
- [ ] `useTickets.createTicket` 훅 액션
- [ ] `CreateModal` 컴포넌트 (클라이언트 Zod 검증 포함)
- [ ] Board / BacklogPanel "티켓 추가" 버튼 연결
- [ ] CreateModal 컴포넌트 테스트
