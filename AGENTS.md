<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:tickettodo-rules -->

# TicketTodo — Coding Agent 작업 지침서

> Next.js 16 App Router 기반 단일 사용자 칸반 보드 티켓 관리 앱.  
> 이 문서는 Claude Code 세션 시작 시 자동으로 로드된다. 모든 작업은 아래 규칙을 최우선으로 따른다.

---

## 1. 프로젝트 개요

| 항목      | 내용                                                      |
| --------- | --------------------------------------------------------- |
| 앱명      | TicketTodo                                                |
| 유형      | 단일 사용자 칸반 보드 (인증 없음)                         |
| 칼럼 구성 | Backlog → TODO → In Progress → Done                       |
| 배포 환경 | Vercel (main 브랜치 자동 배포) + Vercel Postgres (Neon)   |
| MVP 범위  | FR-001 ~ FR-018, NFR-001 ~ NFR-025 전항목                 |

---

## 2. 프로젝트 구조

```
ticket-todo/
├── src/
│   ├── app/                        # Next.js App Router 진입점
│   │   ├── api/tickets/
│   │   │   ├── route.ts            # GET /api/tickets, POST /api/tickets
│   │   │   ├── [id]/route.ts       # GET·PATCH·DELETE /api/tickets/:id
│   │   │   └── _lib/responses.ts   # 공통 에러 응답 헬퍼
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── server/                     # 백엔드 전용 — 클라이언트 import 금지
│   │   ├── db/
│   │   │   ├── index.ts            # Drizzle + postgres.js 초기화 (client, db export)
│   │   │   ├── schema.ts           # tickets 테이블 스키마 (DATA_MODEL.md SSOT)
│   │   │   └── seed.ts             # 개발용 시드 데이터
│   │   └── services/
│   │       └── ticketService.ts    # DB 접근 비즈니스 로직
│   ├── client/                     # 프론트엔드 전용 — 서버 import 금지
│   │   ├── api/ticketApi.ts        # fetch 기반 API 래퍼
│   │   ├── components/
│   │   │   ├── Board/              # 칸반 보드 (DndContext 루트)
│   │   │   ├── Card/               # 티켓 카드 (useDraggable)
│   │   │   ├── Column/             # 칼럼 + BacklogPanel (useDroppable)
│   │   │   └── Modal/              # 생성·상세 모달
│   │   ├── hooks/
│   │   │   ├── useTickets.ts       # 티켓 데이터 패칭·상태 관리
│   │   │   └── useDnd.ts           # DnD 이벤트 핸들러
│   │   └── utils/
│   │       ├── calculateOrder.ts   # order 중간값 계산
│   │       └── groupByStatus.ts    # 칼럼별 그룹핑
│   ├── shared/                     # 클라이언트·서버 공용
│   │   ├── constants/status.ts     # ColumnStatus, Priority, getDeadlineStyle()
│   │   ├── schemas/ticketSchema.ts # Zod 스키마 (클라이언트·서버 공용)
│   │   └── types/ticket.ts         # TicketRow, TicketDto, toTicketDto()
│   └── mocks/                      # MSW 핸들러 (테스트 전용)
├── docs/                           # 설계 문서 — 읽기 전용 (§3 참조)
├── drizzle/migrations/             # Drizzle 마이그레이션 파일
├── drizzle.config.ts               # drizzle-kit 설정 (@next/env로 .env.local 로드)
├── jest.config.ts                  # Jest + next/jest 설정
├── jest.environment.ts             # FetchAwareJSDOMEnvironment (MSW v2 호환)
└── jest.setup.ts                   # @testing-library/jest-dom import
```

---

## 3. 기술 스택

| 레이어      | 기술                                           | 버전      |
| ----------- | ---------------------------------------------- | --------- |
| 프레임워크  | Next.js (App Router + API Routes)              | 16.2.9    |
| 언어        | TypeScript strict                              | ^5        |
| DB          | PostgreSQL (로컬: localhost / 배포: Vercel Postgres Neon) | —  |
| DB 드라이버 | postgres (postgres.js)                         | ^3.4.9    |
| ORM         | Drizzle ORM                                    | ^0.45.2   |
| DnD         | @dnd-kit/core (Mouse / Touch / Keyboard 센서)  | ^6.3.1    |
| 스타일      | Tailwind CSS                                   | ^4        |
| 유효성 검증 | Zod                                            | ^4.4.3    |
| 테스트      | Jest + React Testing Library + MSW + next-test-api-route-handler | — |
| Lint        | ESLint + Prettier                              | —         |
| 배포        | Vercel (main 브랜치 자동 배포)                 | —         |

> 위 스택 외 라이브러리를 추가할 경우 반드시 사용자 승인을 먼저 받는다.

---

## 4. 명세 문서 경로 (Single Source of Truth)

코드 작성 전 반드시 해당 문서를 확인한다. 문서와 충돌하는 구현은 금지한다.

| 경로                      | 용도                                              | 우선순위 | 수정 권한              |
| ------------------------- | ------------------------------------------------- | :------: | ---------------------- |
| `docs/REQUIREMENTS.md`    | FR 18개 + NFR 25개 전체 요구사항 원본             | 1        | 사용자 지시 시에만     |
| `docs/PRD.md`             | 화면별 동작 정의, 사용자 시나리오, API 요약        | 2        | 사용자 지시 시에만     |
| `docs/TRD.md`             | 디렉토리 구조, 계층 경계 규칙, 코드 예시          | 3        | 사용자 지시 시에만     |
| `docs/DATA_MODEL.md`      | DB 스키마 SSOT — 컬럼 타입·인덱스·DTO·시드 데이터 | **최우선 (DB 스키마)** | 사용자 지시 시에만 |
| `docs/API_SPEC.md`        | 엔드포인트 상세 명세 (요청·응답·에러·order 규칙)  | 1차 참조 | 사용자 지시 시에만     |
| `docs/COMPONENT_SPEC.md`  | 컴포넌트 책임·Props·State·이벤트·접근성 명세      | —        | 사용자 지시 시에만     |
| `docs/TEST_SPEC.md`       | TC 명세 및 FR/NFR 추적 매트릭스                   | —        | 사용자 지시 시에만     |
| `docs/tika-wireframe.png` | UI 레이아웃 스케치                                | —        | 수정 불가 (이미지)     |

**우선순위 규칙**
- 일반: `REQUIREMENTS.md > PRD.md > TRD.md`
- DB 스키마·컬럼 타입: `DATA_MODEL.md`가 다른 모든 문서보다 우선
- 문서 간 충돌 발생 시 → 즉시 작업 중단 후 사용자에게 보고

---

## 5. 코딩 컨벤션

### 5-1. 일반

- TypeScript `strict` 모드 준수. `any` 타입 사용 금지
- 모든 입력값은 **Zod 이중 검증** — UI 단 + API 단 각각 독립 검증 (NFR-016)
- 환경 변수 코드 하드코딩 금지 — `.env.local` / Vercel 환경변수로 관리 (NFR-024)
- 함수·컴포넌트 단위 단일 책임 원칙

### 5-2. 계층 경계

| 규칙 | 내용 |
| ---- | ---- |
| `src/server/` ↔ `src/client/` 상호 import 금지 | DB 연결·서비스 로직이 클라이언트에 노출되지 않도록 |
| `src/shared/` 양방향 참조 허용 | 타입·Zod 스키마·상수만 위치 |
| Route Handler 얇게 유지 | 요청 파싱 → 서비스 호출 → 응답 반환 3단계만 |
| 서비스 레이어 순수 | `Request`, `Response` 등 HTTP 객체 미사용 |
| DB 접근은 서비스 레이어 전용 | Route Handler에서 직접 Drizzle 쿼리 작성 금지 |

### 5-3. API

- 에러 응답 형식: `{ "error": "...", "details": {} }` (TRD §6)
- HTTP 상태 코드: `400` 유효성 실패 / `404` 미존재 / `500` 서버 오류
- 500 에러는 반드시 `console.error` 로깅 (NFR-025)

### 5-4. DnD

- `DndContext`로 보드 전체 감싸기
- 칼럼: `useDroppable` / 카드: `useDraggable`
- `onDragEnd` 처리 순서: **낙관적 업데이트 → API 호출 → 재동기화/롤백** (FR-011, NFR-013)
- Mouse / Touch / Keyboard 센서 모두 활성화 (NFR-007, NFR-009)

### 5-5. order 관리 (NFR-015)

| 상황 | 계산 방법 |
| ---- | --------- |
| 칼럼 최하단 삽입 | `MAX(order) + 1000` |
| 카드 사이 삽입 | `Math.floor((prevOrder + nextOrder) / 2)` |
| 차이 ≤ 1 (충돌) | 해당 칼럼 전체 order 재정규화 (`1000, 2000, …`) |

### 5-6. 기한 경고 (`getDeadlineStyle()` — `src/shared/constants/status.ts`)

| 조건 | 반환 클래스 | FR |
| ---- | ----------- | -- |
| `status === 'Done'` 또는 `dueDate` 없음 | `border-gray-200` | FR-014 |
| `diffDays < 0` (기한 초과) | `border-red-500` | FR-013 |
| `diffDays <= 3` (D-3 이내) | `border-orange-400` | FR-012 |

### 5-7. 접근성

- 칼럼: `role="list"` / 카드: `role="listitem"` / 액션 버튼: `<button>` (NFR-011)
- 카드 상태 변경 시 `aria-live`로 결과 음성 출력 (NFR-010)
- 키보드 DnD: Space(집기) → 방향키(이동) → Enter(놓기) (NFR-009)
- WCAG AA 색상 대비 4.5:1 이상 (NFR-012)

---

## 6. SDD 워크플로 규칙

### 6-1. 기능 구현 전 필수 확인

1. 구현 대상 **FR 번호** 확인 → `docs/REQUIREMENTS.md §3`
2. 연관 **PRD 섹션** 확인 → `docs/PRD.md §4` 화면별 동작 정의
3. 연관 **NFR 항목** 확인 → `docs/REQUIREMENTS.md §4`
4. UI 구현 시 → `docs/tika-wireframe.png` + `docs/COMPONENT_SPEC.md` 참조
5. API 구현 시 → `docs/API_SPEC.md` 1차 참조
6. 테스트 구현 시 → `docs/TEST_SPEC.md` TC 번호 확인 후 구현

### 6-2. 충돌 발생 시 — 작업 중단 필수

아래 상황에서는 즉시 작업을 중단하고 다음 형식으로 사용자에게 보고한다:

- 설계 문서와 구현 내용이 충돌하는 경우
- FR/NFR에 명시되지 않은 기능 추가가 필요한 경우
- 문서 간 내용이 상충하는 경우
- 기술 스택 변경이 필요한 경우

```
[작업 중단] {작업명}
충돌 내용: {구체적 충돌 내용}
관련 문서: {문서명 + 섹션}
선택지: {가능한 해결 방향 제시}
```

### 6-3. 절대 금지 사항

- `src/server/` 코드를 클라이언트 컴포넌트에서 import
- Route Handler에서 직접 Drizzle 쿼리 작성
- DB URL 등 민감 환경 변수 코드 하드코딩
- `any` 타입 사용
- 삭제 전 확인 다이얼로그 생략 (NFR-017)
- 승인 없이 Post-MVP 항목 구현 (검색·우선순위 필터·다중 사용자 등)
- 설계 문서에 없는 기능 임의 추가

---

## 7. 개발 환경 명령어

```bash
npm install                  # 의존성 설치
npm run dev                  # 개발 서버 http://localhost:3000

npm run db:generate          # 스키마 변경 후 마이그레이션 파일 생성
npm run db:migrate           # DB에 마이그레이션 적용
npm run db:seed              # 시드 데이터 삽입
npm run db:studio            # Drizzle Studio (브라우저 DB 뷰어)

npm run test                 # Jest 전체 실행
npm run test:watch           # 워치 모드
npm run test:coverage        # 커버리지 리포트

npm run lint                 # ESLint
npm run format               # Prettier
```

> 환경 변수: `vercel env pull .env.local` (Vercel 연결 시) 또는 `.env.local` 직접 작성  
> drizzle-kit 스크립트는 `drizzle.config.ts`에서 `@next/env`로 `.env.local`을 자동 로드하므로 별도 env 전달 불필요

---

## 8. MVP 완료 기준 (PRD §7-4)

1. **기능**: FR-001 ~ FR-018 전항목 통과
2. **배포**: Vercel 프로덕션 URL에서 HTTPS 정상 접근
3. **성능**: FCP ≤ 2초, API p95 ≤ 300ms

<!-- END:tickettodo-rules -->
