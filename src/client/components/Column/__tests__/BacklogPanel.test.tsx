import { render, screen } from '@testing-library/react';
import { BacklogPanel } from '../BacklogPanel';
import type { TicketDto } from '@/shared/types/ticket';

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
  it('패널 헤더 레이블 표시 (FR-006, PRD §4-4)', () => {
    render(<BacklogPanel tickets={[]} />);
    expect(screen.getByRole('heading', { name: '할일 목록 영역(Backlog)' })).toBeInTheDocument();
  });

  it('role="list" 컨테이너 적용 (NFR-011)', () => {
    render(<BacklogPanel tickets={[]} />);
    expect(screen.getByRole('list', { name: 'Backlog' })).toBeInTheDocument();
  });

  it('TC-COMP-012: tickets 배열 기반 카드 렌더링', () => {
    const tickets = [makeTicket('1'), makeTicket('2'), makeTicket('3')];
    render(<BacklogPanel tickets={tickets} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('TC-COMP-014: 빈 배열 — 드롭 영역 컨테이너 유지', () => {
    render(<BacklogPanel tickets={[]} />);
    expect(screen.getByRole('list', { name: 'Backlog' })).toBeInTheDocument();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });
});
