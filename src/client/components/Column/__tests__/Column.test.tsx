import { render, screen } from '@testing-library/react';
import { Column } from '../Column';
import type { TicketDto } from '@/shared/types/ticket';

function makeTicket(id: string): TicketDto {
  return {
    id,
    title: `T-${id}`,
    description: null,
    status: 'TODO',
    priority: null,
    order: 1000,
    startedAt: null,
    dueDate: null,
    createdAt: '2026-06-16T00:00:00.000Z',
    updatedAt: '2026-06-16T00:00:00.000Z',
  };
}

describe('Column', () => {
  it('TC-COMP-015: status prop 기반 헤더 텍스트 렌더링', () => {
    render(<Column status="In Progress" tickets={[]} />);
    expect(screen.getByRole('heading', { name: 'In Progress' })).toBeInTheDocument();
  });

  it('role="list" 컨테이너 적용 (NFR-011)', () => {
    render(<Column status="TODO" tickets={[]} />);
    expect(screen.getByRole('list', { name: 'TODO' })).toBeInTheDocument();
  });

  it('TC-COMP-016: tickets 배열 기반 카드 렌더링', () => {
    const tickets = [makeTicket('1'), makeTicket('2')];
    render(<Column status="TODO" tickets={tickets} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('TC-COMP-018: 빈 칼럼이어도 컨테이너 DOM 유지', () => {
    render(<Column status="Done" tickets={[]} />);
    expect(screen.getByRole('list', { name: 'Done' })).toBeInTheDocument();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });
});
