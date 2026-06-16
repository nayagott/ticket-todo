import { render, screen } from '@testing-library/react';
import { TicketCard } from '../TicketCard';
import type { TicketDto } from '@/shared/types/ticket';

const baseTicket: TicketDto = {
  id: '1',
  title: 'T',
  description: null,
  status: 'TODO',
  priority: null,
  order: 1000,
  startedAt: null,
  dueDate: null,
  createdAt: '2026-06-16T00:00:00.000Z',
  updatedAt: '2026-06-16T00:00:00.000Z',
};

describe('TicketCard', () => {
  it('TC-COMP-019: 제목을 항상 표시한다', () => {
    render(<TicketCard ticket={baseTicket} />);
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('TC-COMP-029: role="listitem" 적용', () => {
    render(<TicketCard ticket={baseTicket} />);
    expect(screen.getByRole('listitem')).toBeInTheDocument();
  });

  it('TC-COMP-023: 기한 초과 + Done 아님 → border-red-500', () => {
    const ticket: TicketDto = { ...baseTicket, status: 'TODO', dueDate: '2026-06-10T00:00:00.000Z' };
    render(<TicketCard ticket={ticket} />);
    expect(screen.getByRole('listitem')).toHaveClass('border-red-500');
  });

  it('TC-COMP-027 / TC-INT-008: status=Done이면 기한 초과여도 border-gray-200', () => {
    const ticket: TicketDto = { ...baseTicket, status: 'Done', dueDate: '2026-06-10T00:00:00.000Z' };
    render(<TicketCard ticket={ticket} />);
    expect(screen.getByRole('listitem')).toHaveClass('border-gray-200');
  });
});
