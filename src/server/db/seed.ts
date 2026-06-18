// 실행: export $(grep -v '^#' .env.local | xargs) && npx tsx src/server/db/seed.ts

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { tickets } from './schema';

if (process.env.NODE_ENV === 'production') {
  console.error('[seed] 프로덕션 환경에서는 실행할 수 없습니다.');
  process.exit(1);
}

const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

function dayOffset(offset: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d;
}

async function seed(): Promise<void> {
  await db.delete(tickets);

  await db.insert(tickets).values([
    // ─── Backlog ──────────────────────────────────────────────────
    {
      title:       '사용자 인터뷰 계획 수립',
      description: '다음 분기 신기능 검증을 위한 인터뷰 대상자 선정',
      status:      'Backlog',
      priority:    'Medium',
      order:       1000,
      dueDate:     dayOffset(14),
    },
    {
      title:       '경쟁사 분석 리포트 작성',
      description: null,
      status:      'Backlog',
      priority:    'Low',
      order:       2000,
      dueDate:     null,
    },

    // ─── TODO ─────────────────────────────────────────────────────
    {
      title:       '스프린트 백로그 우선순위 정리',
      description: '다음 스프린트 착수 전 항목 재조정',
      status:      'TODO',
      priority:    'High',
      order:       1000,
      startedAt:   dayOffset(0),
      dueDate:     dayOffset(2),
    },
    {
      title:       'API 문서 초안 작성',
      description: 'OpenAPI 스펙 기반 Swagger 문서 초안',
      status:      'TODO',
      priority:    'Medium',
      order:       2000,
      dueDate:     dayOffset(7),
    },

    // ─── In Progress ──────────────────────────────────────────────
    {
      title:       '결제 모듈 버그 수정',
      description: '카드 결제 실패 시 오류 메시지 미표시 이슈',
      status:      'In Progress',
      priority:    'High',
      order:       1000,
      startedAt:   dayOffset(-5),
      dueDate:     dayOffset(-2),
    },
    {
      title:       '대시보드 차트 리팩토링',
      description: 'Recharts → 자체 SVG 컴포넌트로 교체',
      status:      'In Progress',
      priority:    'Medium',
      order:       2000,
      startedAt:   dayOffset(-1),
      dueDate:     dayOffset(1),
    },
    {
      title:       '모바일 반응형 QA',
      description: '360px ~ 768px 구간 레이아웃 검증',
      status:      'In Progress',
      priority:    'Low',
      order:       3000,
      dueDate:     dayOffset(10),
    },

    // ─── Done ─────────────────────────────────────────────────────
    {
      title:       '로그인 페이지 UI 구현',
      description: '디자인 시스템 컴포넌트 적용 완료',
      status:      'Done',
      priority:    'High',
      order:       1000,
      startedAt:   dayOffset(-10),
      dueDate:     dayOffset(-3),
    },
  ]);

  console.log('[seed] 완료: 8개 티켓 삽입');
  await client.end();
}

seed().catch((err: unknown) => {
  console.error('[seed] 오류:', err);
  process.exit(1);
});
