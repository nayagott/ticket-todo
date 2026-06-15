<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:tickettodo-rules -->

# CLAUDE.md — TicketTodo 작업 지침서

> Claude Code 세션 시작 시 자동으로 읽히는 프로젝트 작업 지침서다.
> 모든 작업은 이 문서에 정의된 규칙을 최우선으로 따른다.

---

## 1. 설계 문서 목록

아래 7개 문서가 이 프로젝트의 단일 진실 공급원(Single Source of Truth)이다.
코드 작성 전 반드시 해당 문서를 확인하고, 문서와 충돌하는 구현은 금지한다.

| 경로                      | 용도                                                   | Claude Code 수정 권한       |
| ------------------------- | ------------------------------------------------------ | --------------------------- |
| `docs/REQUIREMENTS.md`    | FR 18개 + NFR 25개 전체 요구사항 원본                  | **사용자 지시 시에만 수정** |
| `docs/PRD.md`             | 화면별 동작 정의, 사용자 시나리오, API 엔드포인트 요약 | **사용자 지시 시에만 수정** |
| `docs/TRD.md`             | 디렉토리 구조, 계층 경계 규칙, 코드 예시               | **사용자 지시 시에만 수정** |
| `docs/DATA_MODEL.md`      | DB 스키마 SSOT — 컬럼 타입·인덱스·DTO·시드 데이터      | **사용자 지시 시에만 수정** |
| `docs/API_SPEC.md`        | 엔드포인트 상세 명세 (요청·응답·에러·order 규칙)       | **사용자 지시 시에만 수정** |
| `docs/COMPONENT_SPEC.md`  | 컴포넌트 책임·Props·State·이벤트·접근성 명세           | **사용자 지시 시에만 수정** |
| `docs/tika-wireframe.png` | UI 레이아웃 스케치 (PRD 레이아웃 설계 근거)            | **수정 불가** (이미지)      |

> 설계 문서는 구현 과정에서 스펙 변경, 불일치 수정, 기능 추가 등으로 개정될 수 있다.
> Claude Code는 코드 작업 중 **임의로 수정하지 않는다.**
> 수정이 필요하다고 판단되면 작업을 중단하고 사용자에게 변경 내용을 제안한 뒤 승인을 받아 반영한다.

> **문서 우선순위**: REQUIREMENTS.md > PRD.md > TRD.md  
> 단, **DB 스키마·컬럼 타입은 DATA_MODEL.md가 최우선(SSOT)**이며, 다른 문서의 타입 표기와 충돌하면 DATA_MODEL.md를 따른다.  
> 문서 간 내용이 충돌하면 상위 문서를 우선하고, 즉시 사용자에게 보고한다.

---

## 2. 작업 전 필수 확인 규칙

### 2-1. 기능 구현 시

- 구현 대상 기능의 **FR 번호를 먼저 확인**한다 (`docs/REQUIREMENTS.md` §3)
- 해당 FR과 연관된 PRD 섹션을 확인한다 (`docs/PRD.md` §4 화면별 동작 정의)
- 연관된 NFR 항목을 확인하고 구현에 반영한다 (`docs/REQUIREMENTS.md` §4)

### 2-2. UI 컴포넌트 구현 시

- **`docs/tika-wireframe.png`를 반드시 참조**한다
- 레이아웃 구조는 PRD §4-1의 ASCII 다이어그램을 기준으로 한다
- Backlog는 좌측 고정 패널, TODO/In Progress/Done은 메인 칸반 영역이다 (FR-006)
- 티켓 카드 표시 요소는 PRD §4-6 표를 기준으로 구현한다 (FR-015)

### 2-3. API 구현 시

- 엔드포인트 스펙은 **`docs/API_SPEC.md`를 1차 기준**으로, PRD §6 및 TRD §6을 보조 참조로 한다
- 요청/응답 타입은 `src/shared/schemas/ticketSchema.ts`의 Zod 스키마를 따른다
- 에러 응답 형식은 TRD §6 공통 에러 응답 형식을 따른다

### 2-4. 충돌 발생 시 — 작업 중단 필수

구현 중 아래 상황이 발생하면 **즉시 작업을 중단**하고 사용자에게 보고한다:

- 설계 문서와 구현 내용이 충돌하는 경우
- FR/NFR에 명시되지 않은 기능 추가가 필요한 경우
- 문서 간 내용이 상충하는 경우
- 기술 스택 변경이 필요한 경우

보고 형식:

```
[작업 중단] {작업명}
충돌 내용: {구체적 충돌 내용}
관련 문서: {문서명 + 섹션}
선택지: {가능한 해결 방향 제시}
```

---

## 3. 기술 스택

| 레이어      | 기술                                          | 버전 |
| ----------- | --------------------------------------------- | ---- |
| 프레임워크  | Next.js (App Router + API Routes)             | 15   |
| 언어        | TypeScript                                    | —    |
| DB          | Vercel Postgres (Neon 기반)                   | —    |
| ORM         | Drizzle ORM                                   | —    |
| DnD         | @dnd-kit/core (Mouse / Touch / Keyboard 센서) | —    |
| 스타일      | Tailwind CSS                                  | 4    |
| 유효성 검증 | Zod                                           | —    |
| 테스트      | Jest + React Testing Library                  | —    |
| Lint        | ESLint + Prettier                             | —    |
| 배포        | Vercel (main 브랜치 자동 배포)                | —    |

> 위 스택 외 라이브러리를 추가할 경우 반드시 사용자 승인을 먼저 받는다.

---

## 4. 디렉토리 구조

```
tickettodo/
├── app/
│   ├── api/
│   │   └── tickets/
│   │       ├── route.ts            # GET /api/tickets, POST /api/tickets
│   │       └── [id]/
│   │           └── route.ts        # GET/PATCH/DELETE /api/tickets/:id
│   ├── layout.tsx
│   └── page.tsx
├── src/
│   ├── server/                     # 백엔드 전용 (클라이언트에서 import 금지)
│   │   ├── db/
│   │   │   ├── index.ts            # Drizzle 클라이언트 초기화
│   │   │   └── schema.ts           # tickets 테이블 스키마
│   │   └── services/
│   │       └── ticketService.ts    # DB 접근 비즈니스 로직
│   ├── client/                     # 프론트엔드 전용 (서버에서 import 금지)
│   │   ├── api/
│   │   │   └── ticketApi.ts        # fetch 기반 API 래퍼
│   │   ├── components/
│   │   │   ├── Board/              # 칸반 보드 컴포넌트
│   │   │   ├── Card/               # 티켓 카드 컴포넌트
│   │   │   ├── Column/             # 칼럼 컴포넌트
│   │   │   └── Modal/              # 생성·상세 모달 컴포넌트
│   │   └── hooks/
│   │       ├── useTickets.ts       # 티켓 데이터 패칭·상태 관리
│   │       └── useDnd.ts           # DnD 이벤트 핸들러
│   └── shared/                     # 클라이언트·서버 양쪽 참조 가능
│       ├── types/
│       │   └── ticket.ts
│       ├── schemas/
│       │   └── ticketSchema.ts     # Zod 스키마 (클라이언트·서버 공용)
│       └── constants/
│           └── status.ts           # ColumnStatus enum, 기한 임박 임계값
├── docs/                           # 설계 문서 (읽기 전용)
│   ├── REQUIREMENTS.md
│   ├── PRD.md
│   ├── TRD.md
│   ├── DATA_MODEL.md
│   ├── API_SPEC.md
│   ├── COMPONENT_SPEC.md
│   └── tika-wireframe.png
├── drizzle/
│   └── migrations/
├── drizzle.config.ts
├── .env.local                      # 로컬 환경 변수 (gitignore 필수)
└── package.json
```

---

## 5. 계층 간 경계 규칙

| 규칙                                           | 내용                                               |
| ---------------------------------------------- | -------------------------------------------------- |
| `src/server/` ↔ `src/client/` 상호 import 금지 | DB 연결·서비스 로직이 클라이언트에 노출되지 않도록 |
| `src/shared/` 양방향 참조 허용                 | 타입·Zod 스키마·상수만 위치                        |
| Route Handler는 얇게 유지                      | 요청 파싱 → 서비스 호출 → 응답 반환 3단계만        |
| 서비스 레이어 순수하게 유지                    | `Request`, `Response` 등 HTTP 객체 미사용          |
| DB 접근은 서비스 레이어 전용                   | Route Handler에서 직접 Drizzle 쿼리 작성 금지      |

---

## 6. 코드 작성 원칙

### 6-1. 일반 원칙

- **TypeScript strict 모드** 준수. `any` 타입 사용 금지
- 모든 입력값은 **Zod로 이중 검증** (UI 단 + API 단 각각 독립 검증, NFR-016)
- 함수·컴포넌트 단위로 단일 책임 원칙 준수
- 환경 변수는 `.env.local` / Vercel 환경변수로 관리, **코드 하드코딩 금지** (NFR-024)

### 6-2. API 작성 규칙

- 에러 응답은 반드시 `{ "error": "...", "details": {} }` 형식 준수
- HTTP 상태 코드: 400(유효성 실패) / 404(미존재) / 500(서버 오류)
- API 500 에러는 반드시 콘솔 로깅 (NFR-025)

### 6-3. DnD 구현 규칙

- `DndContext`로 보드 전체를 감싼다
- 칼럼은 `useDroppable`, 카드는 `useDraggable` 사용
- `onDragEnd` 콜백 처리 순서: **낙관적 업데이트 → API 호출 → 재동기화/롤백** (FR-011, NFR-013)
- Mouse / Touch / Keyboard 센서 모두 활성화 (NFR-007, NFR-009)

### 6-4. order 관리 규칙

- 신규 삽입: `MAX(order) + 1000`
- 카드 사이 삽입: `Math.floor((prevOrder + nextOrder) / 2)`
- 차이가 1 이하이면 해당 칼럼 전체 order 재정규화 (NFR-015)

### 6-5. 기한 경고 로직

- `getDeadlineStyle()` 함수는 `src/shared/constants/status.ts`에 위치
- D-3 이내(Done 제외): `border-orange-400` (FR-012)
- 기한 초과(Done 제외): `border-red-500` (FR-013)
- 기본: `border-gray-200` (FR-014)
- 색상 대비 WCAG AA 4.5:1 이상 준수 (NFR-012)

### 6-6. 접근성 규칙

- 칼럼: `role="list"`, 카드: `role="listitem"`, 액션 버튼: `<button>` 태그 (NFR-011)
- 카드 상태 변경 시 `aria-live`로 결과 음성 출력 (NFR-010)
- 키보드 DnD: Space(집기) → 방향키(이동) → Enter(놓기) (NFR-009)

---

## 7. 절대 금지 사항

- `src/server/` 코드를 클라이언트 컴포넌트에서 import하는 것
- Route Handler에서 직접 Drizzle 쿼리 작성
- DB URL 등 민감 환경 변수를 코드에 하드코딩
- `any` 타입 사용
- 승인 없이 Post-MVP 항목(검색, 우선순위 필터, 다중 사용자 등) 구현
- 설계 문서(FR/NFR)에 없는 기능을 임의로 추가
- 삭제 전 확인 다이얼로그 생략 (NFR-017)
- IE 지원 고려한 코드 작성 (NFR-020)

---

## 8. 개발 환경 명령어

```bash
# 의존성 설치
npm install

# 환경 변수 동기화 (최초 1회 또는 변경 시)
vercel env pull .env.local

# 로컬 개발 서버
npm run dev                  # http://localhost:3000

# DB 마이그레이션
npx drizzle-kit generate     # 스키마 변경 후 마이그레이션 파일 생성
npx drizzle-kit migrate      # 마이그레이션 적용

# 테스트
npm run test
npm run test:watch
npm run test:coverage

# Lint / Format
npm run lint
npm run format
```

---

## 9. MVP 완료 기준

다음 3가지를 모두 충족해야 MVP 완료로 선언한다 (PRD §7-4):

1. **기능 체크리스트**: FR-001 ~ FR-018 전항목 통과
2. **배포 완료**: Vercel 프로덕션 URL에서 HTTPS 정상 접근
3. **성능 기준**: FCP ≤ 2초, API p95 ≤ 300ms 달성

---

## 10. 변경 이력

| 버전 | 날짜       | 변경 내용                                                        |
| ---- | ---------- | ---------------------------------------------------------------- |
| v1.2 | 2026-06-15 | §1 문서 목록에 COMPONENT_SPEC.md 추가 (7개 문서) |
| v1.1 | 2026-06-15 | §1 문서 목록에 DATA_MODEL.md·API_SPEC.md 추가, tika-wireframe.png 경로 수정, DATA_MODEL.md 스키마 SSOT 우선순위 명시, §2-2 wireframe 경로 수정, §2-3 API_SPEC.md 1차 참조 추가 |
| v1.0 | 2026-06-11 | 최초 작성. REQUIREMENTS.md v1.0 + PRD.md v1.0 + TRD.md v1.0 기반 |

<!-- END:tickettodo-rules -->
