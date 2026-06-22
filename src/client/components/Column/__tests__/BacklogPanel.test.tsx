import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BacklogPanel } from '../BacklogPanel';
import type { TicketDto } from '@/shared/types/ticket';

const noop = jest.fn();

function makeTicket(id: string): TicketDto {
  return {
    id,
    title: `T-${id}`,
    description: null,
    status: 'Backlog',
    priority: null,
    order: 1000,
    startedAt: null,
    dueDate: null,
    createdAt: '2026-06-16T00:00:00.000Z',
    updatedAt: '2026-06-16T00:00:00.000Z',
  };
}

describe('BacklogPanel', () => {
  it('패널 헤더 "Backlog" 표시 (FR-006)', () => {
    render(<BacklogPanel tickets={[]} onCardClick={noop} />);
    expect(screen.getByRole('heading', { name: 'Backlog' })).toBeInTheDocument();
  });

  it('role="list" + aria-label="Backlog" 적용 (NFR-011)', () => {
    render(<BacklogPanel tickets={[]} onCardClick={noop} />);
    expect(screen.getByRole('list', { name: 'Backlog' })).toBeInTheDocument();
  });

  it('TC-COMP-012: tickets 배열 기반 카드 렌더링', () => {
    const tickets = [makeTicket('1'), makeTicket('2'), makeTicket('3')];
    render(<BacklogPanel tickets={tickets} onCardClick={noop} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('TC-COMP-014: 빈 배열 — 드롭 영역 컨테이너 유지', () => {
    render(<BacklogPanel tickets={[]} onCardClick={noop} />);
    expect(screen.getByRole('list', { name: 'Backlog' })).toBeInTheDocument();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('첫 번째 카드 클릭 → onCardClick(ticket.id) 호출', async () => {
    const onCardClick = jest.fn();
    const tickets = [makeTicket('a'), makeTicket('b')];
    render(<BacklogPanel tickets={tickets} onCardClick={onCardClick} />);
    await userEvent.click(screen.getAllByRole('listitem')[0]);
    expect(onCardClick).toHaveBeenCalledTimes(1);
    expect(onCardClick).toHaveBeenCalledWith('a');
  });

  it('두 번째 카드 클릭 → 해당 id로 호출', async () => {
    const onCardClick = jest.fn();
    const tickets = [makeTicket('a'), makeTicket('b')];
    render(<BacklogPanel tickets={tickets} onCardClick={onCardClick} />);
    await userEvent.click(screen.getAllByRole('listitem')[1]);
    expect(onCardClick).toHaveBeenCalledWith('b');
  });
});
