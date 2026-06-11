# TicketTodo

로그인 없이 즉시 사용 가능한 단일 사용자용 칸반 보드 티켓 관리 앱입니다.  
Backlog → TODO → In Progress → Done 4단계 흐름으로 업무를 관리하며, 드래그 앤 드롭과 마감일 임박 경고를 핵심 인터랙션으로 제공합니다.

[![Deployed on Vercel](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel&logoColor=white)](https://YOUR_VERCEL_URL)

---

## 스크린샷

> 실제 캡처 후 교체 예정

![TicketTodo 메인 화면](docs/screenshots/main.png)

---

## 기술 스택

| 레이어      | 기술                                          | 버전 |
| ----------- | --------------------------------------------- | ---- |
| 프레임워크  | Next.js (App Router + API Routes)             | 15   |
| 런타임      | Node.js (Vercel Serverless Functions 타겟)    | —    |
| DB          | Vercel Postgres (Neon 기반)                   | —    |
| ORM         | Drizzle ORM                                   | —    |
| DnD         | @dnd-kit/core (Mouse / Touch / Keyboard 센서) | —    |
| 언어        | TypeScript                                    | —    |
| 스타일      | Tailwind CSS                                  | 4    |
| 유효성 검증 | Zod                                           | —    |
| 테스트      | Jest + React Testing Library                  | —    |
| Lint        | ESLint + Prettier                             | —    |
| 배포        | Vercel (main 브랜치 자동 배포)                | —    |

---

## 시작하기

### 사전 요구사항

- Node.js 18 이상
- [Vercel CLI](https://vercel.com/docs/cli) (`npm i -g vercel`)
- Vercel 프로젝트에 Vercel Postgres 연동 완료

### 설치

```bash
git clone https://github.com/nayagott/ticket-todo.git
cd ticket-todo
npm install
```

### 환경 변수

Vercel CLI로 환경 변수를 로컬에 동기화합니다.

```bash
vercel env pull .env.local
```

`.env.local`에 포함되는 변수 목록:

| 변수명                     | 설명                                   |
| -------------------------- | -------------------------------------- |
| `POSTGRES_URL`             | Vercel Postgres 연결 URL (커넥션 풀링) |
| `POSTGRES_PRISMA_URL`      | Prisma 호환 연결 URL                   |
| `POSTGRES_URL_NON_POOLING` | 마이그레이션용 직접 연결 URL           |
| `POSTGRES_USER`            | DB 사용자명                            |
| `POSTGRES_HOST`            | DB 호스트                              |
| `POSTGRES_PASSWORD`        | DB 비밀번호                            |
| `POSTGRES_DATABASE`        | DB 이름                                |

> `.env.local`은 `.gitignore`에 등록되어 있습니다. 값을 코드에 하드코딩하지 마세요.

### DB 마이그레이션

```bash
npx drizzle-kit generate   # 스키마 변경 후 마이그레이션 파일 생성
npx drizzle-kit migrate    # 마이그레이션 적용
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열면 앱이 실행됩니다.

---

## 배포

`main` 브랜치에 push하면 Vercel이 자동으로 프로덕션 배포를 수행합니다.

```
로컬 개발
  → git push origin feature/xxx
  → PR 생성 → Vercel Preview URL 자동 생성
  → 코드 리뷰 통과 → main 브랜치 merge
  → Vercel 자동 프로덕션 배포 → https://YOUR_VERCEL_URL
```

프로덕션 환경 변수는 Vercel Dashboard → Settings → Environment Variables에서 관리합니다.

---

## 프로젝트 구조

```
ticket-todo/
├── app/
│   ├── api/tickets/
│   │   ├── route.ts          # GET /api/tickets, POST /api/tickets
│   │   └── [id]/route.ts     # GET / PATCH / DELETE /api/tickets/:id
│   ├── layout.tsx
│   └── page.tsx
├── src/
│   ├── server/               # 백엔드 전용 (클라이언트에서 import 금지)
│   │   ├── db/               # Drizzle 클라이언트 + 스키마
│   │   └── services/         # DB 접근 비즈니스 로직
│   ├── client/               # 프론트엔드 전용
│   │   ├── api/              # fetch 기반 API 래퍼
│   │   ├── components/       # Board / Card / Column / Modal
│   │   └── hooks/            # useTickets, useDnd
│   └── shared/               # 클라이언트·서버 공용
│       ├── types/            # Ticket 타입
│       ├── schemas/          # Zod 스키마
│       └── constants/        # ColumnStatus enum, 기한 임박 임계값
├── docs/                     # 설계 문서
├── drizzle/migrations/       # DB 마이그레이션 파일
└── drizzle.config.ts
```

---

## 설계 문서

| 문서                                          | 설명                                               |
| --------------------------------------------- | -------------------------------------------------- |
| [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md)  | 기능 요구사항(FR 18개) + 비기능 요구사항(NFR 25개) |
| [docs/PRD.md](docs/PRD.md)                    | 화면별 동작 정의, 사용자 시나리오, API 엔드포인트  |
| [docs/TRD.md](docs/TRD.md)                    | 디렉토리 구조, 계층 경계 규칙, 스키마, 코드 예시   |
| [docs/wireframe.png](docs/wireframe.png)       | UI 레이아웃 와이어프레임                           |
