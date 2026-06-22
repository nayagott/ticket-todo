import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TicketCard } from '../TicketCard';
import type { TicketDto } from '@/shared/types/ticket';

const baseTicket: TicketDto = {
  id: 'tc-1',
  title: '테스트 티켓',
  description: null,
  status: 'TODO',
  priority: null,
  order: 1000,
  startedAt: null,
  dueDate: null,
  createdAt: '2026-06-16T00:00:00.000Z',
  updatedAt: '2026-06-16T00:00:00.000Z',
};

const noop = jest.fn();

describe('TicketCard — 렌더링', () => {
  it('TC-COMP-019: 제목을 항상 표시한다', () => {
    render(<TicketCard ticket={baseTicket} onClick={noop} />);
    expect(screen.getByText('테스트 티켓')).toBeInTheDocument();
  });

  it('TC-COMP-029: role="listitem" 적용 (useDraggable attributes)', () => {
    render(<TicketCard ticket={baseTicket} onClick={noop} />);
    expect(screen.getByRole('listitem')).toBeInTheDocument();
  });

  it('<button> 태그 사용 (NFR-011)', () => {
    render(<TicketCard ticket={baseTicket} onClick={noop} />);
    expect(screen.getByRole('listitem').tagName).toBe('BUTTON');
  });

  it('description 있을 때 표시', () => {
    const ticket = { ...baseTicket, description: '설명 텍스트' };
    render(<TicketCard ticket={ticket} onClick={noop} />);
    expect(screen.getByText('설명 텍스트')).toBeInTheDocument();
  });

  it('description 없을 때 미표시', () => {
    render(<TicketCard ticket={baseTicket} onClick={noop} />);
    expect(screen.queryByText('설명 텍스트')).not.toBeInTheDocument();
  });
});

describe('TicketCard — priority/dueDate 배지', () => {
  it('priority 있을 때 PriorityBadge 렌더링', () => {
    const ticket = { ...baseTicket, priority: 'High' as const };
    render(<TicketCard ticket={ticket} onClick={noop} />);
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('priority 없을 때 PriorityBadge 미렌더링', () => {
    render(<TicketCard ticket={baseTicket} onClick={noop} />);
    expect(screen.queryByText(/Low|Medium|High/)).not.toBeInTheDocument();
  });

  it('dueDate 있을 때 DueDateBadge 렌더링', () => {
    const ticket = { ...baseTicket, dueDate: '2026-06-30T00:00:00.000Z' };
    render(<TicketCard ticket={ticket} onClick={noop} />);
    expect(screen.getByText('6월 30일')).toBeInTheDocument();
  });

  it('dueDate 없을 때 DueDateBadge 미렌더링', () => {
    render(<TicketCard ticket={baseTicket} onClick={noop} />);
    expect(screen.queryByText(/월.*일/)).not.toBeInTheDocument();
  });
});

describe('TicketCard — deadline 테두리', () => {
  it('TC-COMP-023: 기한 초과 + Done 아님 → border-red-500', () => {
    const ticket: TicketDto = { ...baseTicket, status: 'TODO', dueDate: '2026-06-10T00:00:00.000Z' };
    render(<TicketCard ticket={ticket} onClick={noop} />);
    expect(screen.getByRole('listitem')).toHaveClass('border-red-500');
  });

  it('TC-COMP-027: status=Done이면 기한 초과여도 border-gray-200', () => {
    const ticket: TicketDto = { ...baseTicket, status: 'Done', dueDate: '2026-06-10T00:00:00.000Z' };
    render(<TicketCard ticket={ticket} onClick={noop} />);
    expect(screen.getByRole('listitem')).toHaveClass('border-gray-200');
  });

  it('dueDate 없으면 border-gray-200', () => {
    render(<TicketCard ticket={baseTicket} onClick={noop} />);
    expect(screen.getByRole('listitem')).toHaveClass('border-gray-200');
  });
});

describe('TicketCard — 이벤트', () => {
  it('클릭 시 onClick(ticket.id) 호출', async () => {
    const onClick = jest.fn();
    render(<TicketCard ticket={baseTicket} onClick={onClick} />);
    await userEvent.click(screen.getByRole('listitem'));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith('tc-1');
  });

  it('키보드 포커스 가능 (tabIndex, NFR-008)', () => {
    render(<TicketCard ticket={baseTicket} onClick={noop} />);
    const card = screen.getByRole('listitem');
    expect(card).not.toHaveAttribute('tabindex', '-1');
  });
});
