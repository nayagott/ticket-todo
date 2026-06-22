'use client';

/**
 * 컴포넌트 프리뷰 갤러리 — /preview
 *
 * DB 연결 없이 Mock 데이터로 개별 컴포넌트를 확인한다.
 * Phase가 완료될 때마다 해당 섹션에 실제 컴포넌트를 추가한다.
 *
 * 추가 방법:
 *   1. 상단 import 주석 해제
 *   2. 해당 Phase 섹션의 <PreviewCard> children에 컴포넌트 삽입
 */

import { useState } from 'react';
import { Header } from '@/client/components/Board/Header';
// Phase 1 ✅
import { PriorityBadge } from '@/client/components/Card/PriorityBadge';
import { DueDateBadge }  from '@/client/components/Card/DueDateBadge';
import { ConfirmDialog } from '@/client/components/Modal/ConfirmDialog';
// Phase 2 ✅
import { TicketCard }    from '@/client/components/Card/TicketCard';
// Phase 3 ✅
import { FilterBar }     from '@/client/components/Board/FilterBar';
import { BacklogPanel }  from '@/client/components/Column/BacklogPanel';
import { Column }        from '@/client/components/Column/Column';
// Phase 5 ✅
import { CreateModal }   from '@/client/components/Modal/CreateModal';
import { DetailModal }   from '@/client/components/Modal/DetailModal';

import type { TicketDto } from '@/shared/types/ticket';

// ── Mock Data ──────────────────────────────────────────────────────
// 날짜 오프셋 헬퍼 (오늘 기준 ±N일 ISO 문자열)
function d(offsetDays: number): string {
  const dt = new Date();
  dt.setDate(dt.getDate() + offsetDays);
  dt.setHours(0, 0, 0, 0);
  return dt.toISOString();
}

const NOW = new Date().toISOString();

/** 각 케이스별 픽스처 — Phase별 PreviewCard에서 직접 참조 */
export const MOCK: Record<string, TicketDto> = {
  /** 기본 — dueDate 없음, priority 없음 */
  plain: {
    id: 'mock-plain',
    title: '기본 티켓 (dueDate 없음)',
    description: null,
    status: 'Backlog',
    priority: null,
    order: 1000,
    startedAt: null,
    dueDate: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  /** D-2 임박 — border-orange-400 (FR-012) */
  soon: {
    id: 'mock-soon',
    title: 'D-2 임박 항목',
    description: '곧 마감됩니다.',
    status: 'TODO',
    priority: 'Medium',
    order: 1000,
    startedAt: d(-1),
    dueDate: d(2),
    createdAt: NOW,
    updatedAt: NOW,
  },
  /** 기한 초과 — border-red-500 (FR-013) */
  overdue: {
    id: 'mock-overdue',
    title: '기한 초과 항목',
    description: '지난주에 완료했어야 합니다.',
    status: 'TODO',
    priority: 'High',
    order: 2000,
    startedAt: d(-7),
    dueDate: d(-3),
    createdAt: NOW,
    updatedAt: NOW,
  },
  /** 완료 상태 — border-gray-200 (FR-014, status=Done이면 초과여도 기본) */
  done: {
    id: 'mock-done',
    title: '완료된 항목 (Done)',
    description: '기한이 지났어도 Done이면 기본 테두리.',
    status: 'Done',
    priority: 'Low',
    order: 1000,
    startedAt: d(-10),
    dueDate: d(-1),
    createdAt: NOW,
    updatedAt: NOW,
  },
  /** 긴 제목 + 설명 — line-clamp 확인 */
  longText: {
    id: 'mock-long',
    title: '매우 긴 제목: 이 텍스트는 두 줄을 초과할 만큼 충분히 길게 작성한 제목입니다 line-clamp-2 테스트용',
    description: '설명도 길게: 이 설명 텍스트는 한 줄을 넘겨서 line-clamp-1 동작을 확인하기 위한 목적으로 작성되었습니다.',
    status: 'In Progress',
    priority: 'High',
    order: 3000,
    startedAt: d(-2),
    dueDate: d(5),
    createdAt: NOW,
    updatedAt: NOW,
  },
  /** Backlog용 — priority 있음, dueDate 있음 */
  backlog: {
    id: 'mock-backlog',
    title: 'Backlog 항목 — 우선순위 Medium',
    description: '백로그에서 대기 중인 업무입니다.',
    status: 'Backlog',
    priority: 'Medium',
    order: 1000,
    startedAt: null,
    dueDate: d(14),
    createdAt: NOW,
    updatedAt: NOW,
  },
};

/** 칼럼별 목록 픽스처 */
export const MOCK_TICKETS: TicketDto[] = Object.values(MOCK);

export const MOCK_BY_STATUS = {
  Backlog:      [MOCK.plain, MOCK.backlog],
  TODO:         [MOCK.overdue, MOCK.soon],
  'In Progress':[MOCK.longText],
  Done:         [MOCK.done],
} as const;

// ── Layout Primitives ──────────────────────────────────────────────
function Section({
  id,
  phase,
  title,
  description,
  children,
}: {
  id: string;
  phase: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-20 scroll-mt-16">
      <div className="mb-6 border-b border-gray-200 pb-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-blue-600">
          {phase}
        </span>
        <h2 className="mt-1 text-lg font-bold text-gray-900">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function PreviewCard({
  label,
  hint,
  fullWidth = false,
  children,
}: {
  label: string;
  hint?: string;
  fullWidth?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm ${fullWidth ? 'col-span-full' : ''}`}>
      <div className="mb-3 flex items-baseline gap-2">
        <span className="font-mono text-xs font-semibold text-gray-700">{label}</span>
        {hint && <span className="text-xs text-gray-400">{hint}</span>}
      </div>
      {children ?? (
        <div className="flex h-16 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-xs text-gray-400">
          구현 예정
        </div>
      )}
    </div>
  );
}

function Grid({ cols = 3, children }: { cols?: 2 | 3; children: React.ReactNode }) {
  return (
    <div className={`grid grid-cols-1 gap-4 ${cols === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2'}`}>
      {children}
    </div>
  );
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className="flex h-16 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-xs text-gray-400">
      {label}
    </div>
  );
}

// ── Nav ────────────────────────────────────────────────────────────
const NAV = [
  { id: 'phase-0', label: 'Phase 0', sub: '유틸리티' },
  { id: 'phase-1', label: 'Phase 1', sub: '원자 컴포넌트' },
  { id: 'phase-2', label: 'Phase 2', sub: 'TicketCard' },
  { id: 'phase-3', label: 'Phase 3', sub: '칼럼 · FilterBar' },
  { id: 'phase-4', label: 'Phase 4', sub: '커스텀 훅' },
  { id: 'phase-5', label: 'Phase 5', sub: '모달' },
  { id: 'phase-6', label: 'Phase 6', sub: 'Board' },
];

// ── Page ───────────────────────────────────────────────────────────
export default function PreviewPage() {
  // Phase 1 — ConfirmDialog 토글
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Phase 3 — FilterBar 토글
  const [filter, setFilter] = useState({ overdue: false, thisWeek: false });
  // Phase 3 — Header 인터랙션 확인용
  const [headerClicked, setHeaderClicked] = useState(false);
  // Phase 5 — 모달 토글
  const [createOpen, setCreateOpen]       = useState(false);
  const [detailTicket, setDetailTicket]   = useState<import('@/shared/types/ticket').TicketDto | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── 상단 고정 네비게이션 ── */}
      <div className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-4 overflow-x-auto px-6 py-2">
          <span className="shrink-0 text-xs font-bold text-gray-900">
            TicketTodo <span className="font-normal text-gray-400">프리뷰</span>
          </span>
          <div className="h-4 w-px shrink-0 bg-gray-200" />
          <nav className="flex gap-1">
            {NAV.map(({ id, label, sub }) => (
              <a
                key={id}
                href={`#${id}`}
                className="shrink-0 rounded-md px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              >
                <span className="font-semibold">{label}</span>
                <span className="ml-1 hidden sm:inline">{sub}</span>
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* ── 본문 ── */}
      <main className="mx-auto max-w-5xl px-6 py-10">

        {/* ─────────────────────────────────────────────────── Phase 0 */}
        <Section
          id="phase-0"
          phase="Phase 0"
          title="유틸리티 함수"
          description="시각 출력 없음 — 단위 테스트로 검증한다."
        >
          <div className="rounded-lg border border-dashed border-gray-300 bg-white px-5 py-4 text-sm text-gray-500">
            <ul className="space-y-1">
              <li><code className="rounded bg-gray-100 px-1 py-0.5 text-xs">calculateOrder.ts</code> — ✅ 완료 (<code className="text-xs">calculateOrder.test.ts</code>)</li>
              <li><code className="rounded bg-gray-100 px-1 py-0.5 text-xs">groupByStatus.ts</code>  — ✅ 완료 (<code className="text-xs">groupByStatus.test.ts</code>)</li>
              <li><code className="rounded bg-gray-100 px-1 py-0.5 text-xs">filter.ts</code>         — ✅ 완료 (<code className="text-xs">filter.test.ts</code>)</li>
            </ul>
          </div>
        </Section>

        {/* ─────────────────────────────────────────────────── Phase 1 */}
        <Section
          id="phase-1"
          phase="Phase 1"
          title="원자 컴포넌트"
          description="PriorityBadge · DueDateBadge · ConfirmDialog — 다른 컴포넌트에 의존하지 않는 단말 컴포넌트."
        >
          <Grid>
            {/* PriorityBadge ✅ */}
            <PreviewCard label="PriorityBadge" hint="Low / Medium / High">
              <div className="flex flex-wrap gap-2">
                <PriorityBadge priority="Low"    />
                <PriorityBadge priority="Medium" />
                <PriorityBadge priority="High"   />
              </div>
            </PreviewCard>

            {/* DueDateBadge ✅ */}
            <PreviewCard label="DueDateBadge" hint="ISO → M월 D일">
              <div className="flex flex-wrap gap-2">
                <DueDateBadge dueDate={d(5)}  />
                <DueDateBadge dueDate={d(-2)} />
                <DueDateBadge dueDate={d(30)} />
                <DueDateBadge dueDate="invalid" />
              </div>
            </PreviewCard>

            {/* ConfirmDialog ✅ */}
            <PreviewCard label="ConfirmDialog" hint="버튼으로 열기">
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
              >
                삭제 확인 열기
              </button>
              <ConfirmDialog
                isOpen={confirmOpen}
                message="정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
                onConfirm={() => { alert('삭제 확인!'); setConfirmOpen(false); }}
                onCancel={() => setConfirmOpen(false)}
              />
            </PreviewCard>
          </Grid>
        </Section>

        {/* ─────────────────────────────────────────────────── Phase 2 */}
        <Section
          id="phase-2"
          phase="Phase 2"
          title="TicketCard"
          description="deadline 스타일 3종 · priority/dueDate 배지 · line-clamp · 클릭 이벤트."
        >
          <Grid>
            <PreviewCard label="기본 (priority·dueDate 없음)">
              <TicketCard ticket={MOCK.plain} onClick={id => alert(`clicked: ${id}`)} />
            </PreviewCard>
            <PreviewCard label="D-2 임박 (border-orange)" hint="FR-012">
              <TicketCard ticket={MOCK.soon} onClick={id => alert(`clicked: ${id}`)} />
            </PreviewCard>
            <PreviewCard label="기한 초과 (border-red)" hint="FR-013">
              <TicketCard ticket={MOCK.overdue} onClick={id => alert(`clicked: ${id}`)} />
            </PreviewCard>
            <PreviewCard label="Done — 기본 테두리 유지" hint="FR-014">
              <TicketCard ticket={MOCK.done} onClick={id => alert(`clicked: ${id}`)} />
            </PreviewCard>
            <PreviewCard label="priority: High + dueDate 배지">
              <TicketCard ticket={MOCK.backlog} onClick={id => alert(`clicked: ${id}`)} />
            </PreviewCard>
            <PreviewCard label="긴 제목 · 설명 (line-clamp)">
              <TicketCard ticket={MOCK.longText} onClick={id => alert(`clicked: ${id}`)} />
            </PreviewCard>
          </Grid>
        </Section>

        {/* ─────────────────────────────────────────────────── Phase 3 */}
        <Section
          id="phase-3"
          phase="Phase 3"
          title="칼럼 · 패널 · FilterBar"
          description="Header는 이미 구현됨. FilterBar · BacklogPanel · Column은 Phase 3 완료 후 추가."
        >
          <Grid cols={2}>
            {/* Header — 이미 구현됨 */}
            <PreviewCard label="Header" hint="✅ 구현 완료">
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <Header onNewTicket={() => setHeaderClicked(v => !v)} />
              </div>
              {headerClicked && (
                <p className="mt-2 text-xs text-blue-600">onNewTicket 호출됨 ✓ (다시 클릭해 토글)</p>
              )}
            </PreviewCard>

            {/* FilterBar ✅ */}
            <PreviewCard label="FilterBar" hint="이번주 · 초과 토글 (FR-017, FR-018)">
              <FilterBar
                filter={filter}
                onFilterChange={key => setFilter(prev => ({ ...prev, [key]: !prev[key] }))}
              />
              <p className="mt-1 text-xs text-gray-400">
                overdue={String(filter.overdue)} / thisWeek={String(filter.thisWeek)}
              </p>
            </PreviewCard>

            {/* BacklogPanel ✅ */}
            <PreviewCard label="BacklogPanel" hint="Backlog 2개 티켓">
              <BacklogPanel
                tickets={MOCK_BY_STATUS.Backlog}
                onCardClick={id => alert(`card clicked: ${id}`)}
              />
            </PreviewCard>

            {/* Column TODO ✅ */}
            <PreviewCard label="Column · TODO" hint="overdue + soon 포함">
              <Column
                status="TODO"
                tickets={MOCK_BY_STATUS.TODO}
                onCardClick={id => alert(`card clicked: ${id}`)}
              />
            </PreviewCard>

            {/* Column In Progress ✅ */}
            <PreviewCard label="Column · In Progress">
              <Column
                status="In Progress"
                tickets={MOCK_BY_STATUS['In Progress']}
                onCardClick={id => alert(`card clicked: ${id}`)}
              />
            </PreviewCard>

            {/* Column Done ✅ — 빈 칼럼 */}
            <PreviewCard label="Column · Done (빈 칼럼)" hint="최소 높이 유지 확인">
              <Column
                status="Done"
                tickets={[]}
                onCardClick={id => alert(`card clicked: ${id}`)}
              />
            </PreviewCard>
          </Grid>
        </Section>

        {/* ─────────────────────────────────────────────────── Phase 4 */}
        <Section
          id="phase-4"
          phase="Phase 4"
          title="커스텀 훅"
          description="useTickets · useDnd — 시각 출력 없음, 단위 테스트로 검증."
        >
          <div className="rounded-lg border border-dashed border-gray-300 bg-white px-5 py-4 text-sm text-gray-500">
            <ul className="space-y-1">
              <li><code className="rounded bg-gray-100 px-1 py-0.5 text-xs">useTickets.ts</code> — ✅ 완료 (<code className="text-xs">useTickets.test.ts</code>)</li>
              <li><code className="rounded bg-gray-100 px-1 py-0.5 text-xs">useDnd.ts</code>     — ✅ 완료 (<code className="text-xs">useDnd.test.ts</code>)</li>
            </ul>
          </div>
        </Section>

        {/* ─────────────────────────────────────────────────── Phase 5 */}
        <Section
          id="phase-5"
          phase="Phase 5"
          title="모달 — CreateModal · DetailModal · ConfirmDialog"
          description="모달은 isOpen=true 고정으로 프리뷰. 오버레이 없이 인라인 표시."
        >
          <Grid cols={2}>
            <PreviewCard label="CreateModal" hint="버튼으로 열기">
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
              >
                새 업무 생성 열기
              </button>
              <CreateModal
                isOpen={createOpen}
                onClose={() => setCreateOpen(false)}
                createTicket={async (input) => {
                  const ticket = { ...MOCK.plain, id: 'preview-new', title: input.title };
                  alert(`생성됨: ${ticket.title}`);
                  setCreateOpen(false);
                  return ticket;
                }}
              />
            </PreviewCard>

            <PreviewCard label="DetailModal" hint="카드 클릭으로 열기">
              <div className="space-y-2">
                {[MOCK.soon, MOCK.overdue, MOCK.done].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setDetailTicket(t)}
                    className="w-full rounded border border-gray-200 bg-gray-50 px-3 py-1.5 text-left text-xs hover:bg-gray-100"
                  >
                    {t.title}
                  </button>
                ))}
              </div>
              <DetailModal
                ticket={detailTicket}
                onClose={() => setDetailTicket(null)}
                updateTicket={async (id, input) => {
                  const updated = { ...detailTicket!, ...input };
                  alert(`수정됨: ${updated.title}`);
                  setDetailTicket(updated);
                  return updated;
                }}
                deleteTicket={async (id) => {
                  alert(`삭제됨: ${id}`);
                  setDetailTicket(null);
                }}
              />
            </PreviewCard>

            <PreviewCard label="ConfirmDialog" hint="Phase 1에서 확인 가능">
              <p className="text-xs text-gray-400">ConfirmDialog는 Phase 1 섹션에서 인터랙티브하게 확인할 수 있습니다.</p>
            </PreviewCard>
          </Grid>
        </Section>

        {/* ─────────────────────────────────────────────────── Phase 6 */}
        <Section
          id="phase-6"
          phase="Phase 6"
          title="Board (루트 통합)"
          description="Mock useTickets를 주입해 DB 없이 전체 보드를 렌더링한다."
        >
          <PreviewCard label="Board 전체" hint="✅ 구현 완료 — 메인 페이지에서 확인" fullWidth>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-4 text-sm text-gray-600">
              <p className="font-medium text-gray-800">Board 컴포넌트는 API 연결이 필요합니다.</p>
              <ul className="mt-2 space-y-1 text-xs text-gray-500">
                <li>• Header (새 업무 버튼) + FilterBar (FR-017, FR-018)</li>
                <li>• BacklogPanel + Column × 3 (DndContext)</li>
                <li>• CreateModal · DetailModal 통합</li>
                <li>• aria-live DnD 결과 알림 (NFR-010)</li>
              </ul>
              <a
                href="/"
                className="mt-3 inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
              >
                메인 페이지에서 전체 보드 확인 →
              </a>
            </div>
          </PreviewCard>
        </Section>

      </main>
    </div>
  );
}
