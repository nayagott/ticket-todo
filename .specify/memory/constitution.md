<!--
SYNC IMPACT REPORT
==================
Version change: (placeholder) → v1.0.0
Status: Initial ratification — all placeholder tokens replaced.

Principles added (5):
  I.  TypeScript Strict Mode
  II. API Contract Compliance
  III. Error Response Shape
  IV. Request Validation via Zod
  V.  Service Layer Separation

Sections added:
  - Core Principles (5 principles)
  - Architecture Constraints
  - Quality Gates
  - Governance

Templates updated:
  ✅ .specify/templates/plan-template.md — Constitution Check gates aligned
  ✅ .specify/templates/spec-template.md — no structural change required
  ✅ .specify/templates/tasks-template.md — no structural change required

Deferred TODOs: none
Conflict resolved: Principle III error format aligned with API_SPEC.md §3
  (user selected Option 1: retain existing { "error": "...", "details": {} } shape)
-->

# TicketTodo Constitution

## Core Principles

### I. TypeScript Strict Mode (NON-NEGOTIABLE)

모든 TypeScript 코드는 `strict: true` 컴파일러 옵션을 적용해야 한다.

- `any` 타입 사용 금지. 불가피한 경우 `unknown` + 타입 가드를 사용한다.
- 모든 함수 매개변수와 반환값에 명시적 타입을 선언한다.
- `tsconfig.json`의 `strict` 플래그를 비활성화하는 PR은 병합할 수 없다.

*Rationale*: 런타임 오류를 컴파일 타임에 차단하고, 코드베이스 전반의 타입 안전성을
보장한다. strict 해제는 기술 부채를 즉시 증가시킨다.

### II. API Contract Compliance (NON-NEGOTIABLE)

모든 API 엔드포인트의 요청·응답 구조는 `docs/API_SPEC.md`를 Single Source of Truth로
삼아야 한다.

- 응답 필드명, 타입, HTTP 상태 코드는 API_SPEC.md 정의와 정확히 일치해야 한다.
- API_SPEC.md와 충돌하는 구현은 배포할 수 없다. 스펙 변경이 필요하면 코드보다
  문서를 먼저 개정하고 사용자 승인을 받는다.
- 성공 응답과 에러 응답 모두 이 원칙의 적용을 받는다.

*Rationale*: 클라이언트-서버 계약을 문서가 주도(spec-first)하도록 강제해 API 드리프트를
방지한다.

### III. Error Response Shape

모든 에러 응답은 다음 형식을 따라야 한다.

```json
{
  "error": "에러 설명 문자열",
  "details": {}
}
```

- `error`: 사람이 읽을 수 있는 설명 문자열. 비어 있으면 안 된다.
- `details`: Zod 유효성 검증 실패 시 필드별 오류를 포함한다. 그 외 경우 빈 객체 `{}`
  를 반환한다.
- HTTP 상태 코드: `400` 유효성 실패 / `404` 리소스 미존재 / `500` 서버 오류.
- 500 에러는 반드시 `console.error`로 서버 측 로깅을 남긴다 (NFR-025).

*Rationale*: 일관된 에러 형식은 클라이언트 오류 처리 코드를 단순하게 유지하고,
디버깅 비용을 낮춘다. `src/app/api/tickets/_lib/responses.ts`의 헬퍼 함수가 이
계약을 구현한다.

### IV. Request Validation via Zod (NON-NEGOTIABLE)

모든 외부 입력(API 요청 바디, 쿼리 파라미터)은 Zod 스키마로 검증해야 한다.

- 클라이언트 단과 서버(Route Handler) 단에서 **각각 독립적으로** 검증한다 (이중 검증,
  NFR-016).
- 공유 스키마는 `src/shared/schemas/ticketSchema.ts`에 위치하며, 서버와 클라이언트가
  동일 스키마를 참조한다.
- Zod 검증을 통과하지 않은 데이터는 서비스 레이어로 전달되어서는 안 된다.

*Rationale*: 클라이언트 우회 공격을 방어하고, 타입 추론과 런타임 검증을 단일 소스로
통합해 중복 정의를 제거한다.

### V. Service Layer Separation (NON-NEGOTIABLE)

모든 비즈니스 로직과 DB 접근 코드는 `src/server/services/`에 위치해야 한다.

- Route Handler는 요청 파싱 → 서비스 호출 → 응답 반환 3단계만 수행한다.
- Route Handler에서 Drizzle 쿼리를 직접 작성하는 것은 금지한다.
- `src/server/` 코드는 `src/client/`에서 import할 수 없다.
- 서비스 함수는 `Request` / `Response` 등 HTTP 객체를 인자로 받지 않는다.

*Rationale*: 계층 분리는 서비스 로직의 독립적 테스트를 가능하게 하고, DB 접근 코드가
클라이언트 번들에 포함되는 보안 위험을 제거한다.

## Architecture Constraints

다음 제약은 MVP 전 기간에 걸쳐 적용된다.

- **디렉토리 경계**: `src/server/` ↔ `src/client/` 상호 import 금지.
  `src/shared/`는 양방향 참조 허용 (타입·Zod 스키마·상수만).
- **환경 변수**: DB URL 등 민감 값은 코드에 하드코딩 금지. `.env.local` 또는 Vercel
  환경변수로만 관리 (NFR-024).
- **Post-MVP 기능 금지**: 검색, 우선순위 필터, 다중 사용자 등 FR/NFR에 없는 기능은
  사용자 승인 없이 구현 불가.

## Quality Gates

각 기능 구현 PR은 아래 게이트를 모두 통과해야 병합 가능하다.

1. `npx tsc --noEmit` — 타입 오류 0건 (Principle I)
2. `npm test` — 전체 테스트 통과 (관련 TC 번호 `docs/TEST_SPEC.md`에서 확인)
3. `npm run lint` — ESLint 오류 0건
4. API 변경 시: `docs/API_SPEC.md` 업데이트 선행 (Principle II)
5. 서비스 레이어 변경 시: `src/server/services/`에만 로직 위치 확인 (Principle V)

## Governance

- 이 헌법은 `docs/REQUIREMENTS.md`, `docs/API_SPEC.md`, `docs/DATA_MODEL.md` 등
  모든 설계 문서보다 상위 거버넌스 규칙으로 적용된다.
- 원칙 개정은 사용자 명시적 승인 후 `/speckit-constitution` 명령으로 버전을 올린다.
- 버전 규칙: MAJOR — 원칙 삭제·재정의, MINOR — 원칙 추가·실질 확장, PATCH — 문구 수정.
- 충돌 발생 시 작업을 즉시 중단하고 `AGENTS.md §6-2` 형식으로 사용자에게 보고한다.
- 런타임 개발 가이드는 `AGENTS.md`를 참조한다.

**Version**: 1.0.0 | **Ratified**: 2026-06-18 | **Last Amended**: 2026-06-18
