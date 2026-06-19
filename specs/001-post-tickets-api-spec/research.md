# Research: POST /api/tickets 구현 현황 분석

**Branch**: `001-post-tickets-api-spec` | **Date**: 2026-06-19

---

## 1. 코드베이스 현황 조사 결과

### 1-1. 서버 측 구현 상태

| 파일 | 상태 | 비고 |
|------|:----:|------|
| `src/app/api/tickets/route.ts` | ✅ 완료 | `GET`, `POST` 핸들러 구현 |
| `src/server/services/ticketService.ts` | ✅ 완료 | `createTicket()`, `getNextBacklogOrder()` 구현 |
| `src/shared/schemas/ticketSchema.ts` | ✅ 완료 | `createTicketSchema` (Zod) |
| `src/app/api/tickets/_lib/responses.ts` | ✅ 완료 | `validationErrorResponse`, `internalErrorResponse` |
| `src/app/api/tickets/__tests__/route.test.ts` | ✅ 완료 | TC-API-004~014 (11개) 전원 통과 |

### 1-2. 클라이언트 측 구현 상태

| 파일 | 상태 | 비고 |
|------|:----:|------|
| `src/client/api/ticketApi.ts` | ❌ 미완료 | `create()` 함수 없음. `getAll`, `update`만 존재 |
| `src/client/components/Modal/CreateModal.tsx` | ❌ 미구현 | 파일 없음 |
| `src/client/components/Modal/` | ❌ 디렉토리 없음 | Modal 관련 컴포넌트 전체 미구현 |

### 1-3. 테스트 실행 결과

```
Tests: 29 passed (route.test 기준, POST 관련 TC-API-004~014 포함)
서버 측 API 테스트: ALL PASS ✅
```

---

## 2. 구현 결정 사항

### Decision 1: 서버 측 구현 완료 확인

- **Decision**: `POST /api/tickets` 서버 측 구현은 API_SPEC.md 명세를 100% 충족한다.
- **Rationale**: Route Handler, Service layer, Zod 스키마, 에러 응답 헬퍼가 모두 명세와 일치한다. 테스트 11개 전원 통과.
- **Alternatives considered**: 재구현 불필요. 기존 코드를 유지한다.

### Decision 2: 클라이언트 측 구현이 FR-001의 나머지 범위

- **Decision**: FR-001 완성을 위해 `ticketApi.create()` 와 `CreateModal` 컴포넌트가 필요하다.
- **Rationale**: FR-001은 단순히 API 엔드포인트만이 아니라 사용자가 UI를 통해 티켓을 생성하는 전체 흐름을 포괄한다(PRD §4).
- **Alternatives considered**: UI 없이 API 단에서 완결하는 것은 MVP 요구사항 불충족.

### Decision 3: Zod 이중 검증 전략

- **Decision**: 클라이언트(`CreateModal` 폼 제출 시)와 서버(Route Handler) 각각 `createTicketSchema`를 독립 적용한다 (Constitution IV, NFR-016).
- **Rationale**: `src/shared/schemas/ticketSchema.ts`의 스키마를 공유하므로 중복 정의 없이 이중 검증 구현 가능.
- **Alternatives considered**: 클라이언트 검증 생략 — Constitution IV 위반으로 불가.

### Decision 4: order 계산 위치

- **Decision**: order 계산(`getNextBacklogOrder`)은 서버 서비스 레이어에서만 수행한다.
- **Rationale**: 클라이언트가 order를 직접 전달하지 않으므로 서버 자동 계산이 명세(API_SPEC §5)와 일치. Constitution V 준수.
- **Alternatives considered**: 클라이언트에서 order 추정 후 전달 — 불필요한 복잡도, 동시성 문제 가능성.

---

## 3. 잔여 구현 범위 (FR-001 완성 기준)

1. `ticketApi.create(input: CreateTicketInput): Promise<TicketDto>` 함수 추가
2. `CreateModal` 컴포넌트 구현 (Zod 클라이언트 검증 포함)
3. `useTickets` 훅에 `createTicket` 액션 추가
4. Board 헤더 또는 Backlog 칼럼에 "티켓 추가" 버튼 배치
5. `CreateModal` 컴포넌트 테스트 (TC-COMP 범위)
