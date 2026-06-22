/**
 * 시나리오 D — 이번주 업무 집중 모드 (PRD §3 시나리오 D)
 * TC-INT-014 ~ TC-INT-016
 */

import { render, screen, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Board } from '@/client/components/Board/Board';
import { server } from '@/mocks/server';
import { ticketsHandlers } from '@/mocks/handlers';
import type { TicketDto } from '@/shared/types/ticket';
import { dragAndDrop, mockBoundingClientRect } from '@/client/test-utils/dragAndDrop';

const BASE_CREATED = '2026-06-22T00:00:00.000Z';

function thisWeekDate(): string {
  // Returns Wednesday of THIS week at noon (UTC) — safely within Mon-Sun
  const mon = new Date();
  mon.setHours(12, 0, 0, 0);
  mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7) + 2); // Wednesday
  return mon.toISOString();
}

function nextWeekDate(): string {
  // Returns Wednesday of NEXT week at noon (UTC)
  const mon = new Date();
  mon.setHours(12, 0, 0, 0);
  mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7) + 2 + 7); // +7 = next week
  return mon.toISOString();
}

function ticket(overrides: Partial<TicketDto> & { id: string }): TicketDto {
  return {
    title: 'T',
    description: null,
    status: 'TODO',
    priority: null,
    order: 1000,
    startedAt: null,
    dueDate: null,
    createdAt: BASE_CREATED,
    updatedAt: BASE_CREATED,
    ...overrides,
  };
}

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('시나리오 D — 이번주 업무 필터', () => {
  it('TC-INT-014: "이번주 업무" 필터 → 이번 주 카드만 표시', async () => {
    const tickets = [
      ticket({ id: 'w1', title: '이번주1', dueDate: thisWeekDate(), order: 1000 }),
      ticket({ id: 'w2', title: '이번주2', dueDate: thisWeekDate(), order: 2000 }),
      ticket({ id: 'n1', title: '다음주1', dueDate: nextWeekDate(), order: 3000 }),
      ticket({ id: 'n2', title: '다음주2', dueDate: nextWeekDate(), order: 4000 }),
    ];
    server.use(...ticketsHandlers(tickets));

    render(<Board />);
    await waitFor(() => expect(screen.getByText('이번주1')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: '이번주 업무' }));

    expect(screen.getByText('이번주1')).toBeInTheDocument();
    expect(screen.getByText('이번주2')).toBeInTheDocument();
    expect(screen.queryByText('다음주1')).not.toBeInTheDocument();
    expect(screen.queryByText('다음주2')).not.toBeInTheDocument();
  });

  it('TC-INT-015: 이번주 필터 활성 중 DnD → 필터 유지, 칼럼 이동 정상', async () => {
    const tickets = [
      ticket({ id: 'wt1', title: '이번주 드래그', status: 'Backlog', dueDate: thisWeekDate(), order: 1000 }),
    ];
    server.use(...ticketsHandlers(tickets));

    render(<Board />);
    await waitFor(() => expect(screen.getByText('이번주 드래그')).toBeInTheDocument());

    // 필터 활성
    await userEvent.click(screen.getByRole('button', { name: '이번주 업무' }));
    expect(screen.getByText('이번주 드래그')).toBeInTheDocument();

    const backlog = screen.getByRole('list', { name: 'Backlog' });
    const todo    = screen.getByRole('list', { name: 'TODO' });

    mockBoundingClientRect(backlog, { left: 0, top: 0, width: 150, height: 600 });
    mockBoundingClientRect(todo,    { left: 200, top: 0, width: 150, height: 600 });

    const card = screen.getByText('이번주 드래그').closest('[role="listitem"]') as HTMLElement;
    dragAndDrop(card, { left: 10, top: 10, width: 80, height: 40 }, todo, { left: 200, top: 0, width: 150, height: 600 });

    await waitFor(() => {
      expect(within(todo).getByText('이번주 드래그')).toBeInTheDocument();
    });
    // dnd-kit schedules documentListeners.removeAll() with 50ms delay — wait for it
    await new Promise(resolve => setTimeout(resolve, 100));
    // 필터 버튼이 여전히 활성 상태여야 한다
    expect(screen.getByRole('button', { name: '이번주 업무' })).toBeInTheDocument();
  });

  it('TC-INT-016: 필터 버튼 재클릭 → 전체 보드 복원', async () => {
    const tickets = [
      ticket({ id: 't016-w', title: '이번주t016',  dueDate: thisWeekDate(), order: 1000 }),
      ticket({ id: 't016-n', title: '다음주t016', dueDate: nextWeekDate(), order: 2000 }),
    ];
    server.use(...ticketsHandlers(tickets));

    render(<Board />);
    await waitFor(() => expect(screen.getByText('이번주t016')).toBeInTheDocument());
    expect(screen.getByText('다음주t016')).toBeInTheDocument();

    const btn = screen.getByRole('button', { name: '이번주 업무' });
    // 1. 필터 활성 → 이번주만 표시
    await userEvent.click(btn);
    await waitFor(() => expect(screen.queryByText('다음주t016')).not.toBeInTheDocument());
    expect(screen.getByText('이번주t016')).toBeInTheDocument();

    // 2. 필터 비활성 → 전체 복원
    await userEvent.click(btn);
    await waitFor(() => expect(screen.getByText('다음주t016')).toBeInTheDocument());
    expect(screen.getByText('이번주t016')).toBeInTheDocument();
  });
});
