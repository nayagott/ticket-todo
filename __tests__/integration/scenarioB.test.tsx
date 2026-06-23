/**
 * 시나리오 B — 칸반 보드 흐름 (PRD §3 시나리오 B)
 * TC-INT-006 (TC-INT-007~009는 Board.dnd.test.tsx 에서 커버)
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import { Board } from '@/client/components/Board/Board';
import { server } from '@/mocks/server';
import { ticketsHandlers } from '@/mocks/handlers';
import type { TicketDto } from '@/shared/types/ticket';

const NOW = '2026-06-22T00:00:00.000Z';

function ticket(overrides: Partial<TicketDto> & { id: string }): TicketDto {
  return {
    title: 'T',
    description: null,
    status: 'TODO',
    priority: null,
    order: 1000,
    startedAt: null,
    dueDate: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('시나리오 B — 초기 보드 렌더링', () => {
  it('TC-INT-006: 초기 로드 → 칼럼별 티켓 그룹핑 렌더링', async () => {
    const tickets = [
      ticket({ id: '1', title: 'Backlog 카드',      status: 'Backlog',     order: 1000 }),
      ticket({ id: '2', title: 'TODO 카드',         status: 'TODO',        order: 1000 }),
      ticket({ id: '3', title: 'In Progress 카드',  status: 'In Progress', order: 1000 }),
      ticket({ id: '4', title: 'Done 카드',         status: 'Done',        order: 1000 }),
    ];
    server.use(...ticketsHandlers(tickets));

    render(<Board />);

    await waitFor(() => expect(screen.getByText('Backlog 카드')).toBeInTheDocument());

    const backlog     = screen.getByRole('list', { name: '백로그' });
    const todo        = screen.getByRole('list', { name: '할 일' });
    const inProgress  = screen.getByRole('list', { name: '진행 중' });
    const done        = screen.getByRole('list', { name: '완료' });

    expect(within(backlog).getByText('Backlog 카드')).toBeInTheDocument();
    expect(within(todo).getByText('TODO 카드')).toBeInTheDocument();
    expect(within(inProgress).getByText('In Progress 카드')).toBeInTheDocument();
    expect(within(done).getByText('Done 카드')).toBeInTheDocument();

    // 각 칼럼에 다른 칼럼 카드가 없어야 한다
    expect(within(todo).queryByText('Backlog 카드')).toBeNull();
    expect(within(backlog).queryByText('TODO 카드')).toBeNull();
  });
});
