import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Column } from '../Column';
import type { TicketDto } from '@/shared/types/ticket';

const noop = jest.fn();

function makeTicket(id: string, status: TicketDto['status'] = 'TODO'): TicketDto {
  return {
    id,
    title: `T-${id}`,
    description: null,
    status,
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
    render(<Column status="In Progress" tickets={[]} onCardClick={noop} />);
    expect(screen.getByRole('heading', { name: '진행 중' })).toBeInTheDocument();
  });

  it('role="list" + aria-label=status 적용 (NFR-011)', () => {
    render(<Column status="TODO" tickets={[]} onCardClick={noop} />);
    expect(screen.getByRole('list', { name: '할 일' })).toBeInTheDocument();
  });

  it('TC-COMP-016: tickets 배열 기반 카드 렌더링', () => {
    const tickets = [makeTicket('1'), makeTicket('2')];
    render(<Column status="TODO" tickets={tickets} onCardClick={noop} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('TC-COMP-018: 빈 칼럼이어도 컨테이너 DOM 유지', () => {
    render(<Column status="Done" tickets={[]} onCardClick={noop} />);
    expect(screen.getByRole('list', { name: '완료' })).toBeInTheDocument();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('카드 클릭 → onCardClick(ticket.id) 호출', async () => {
    const onCardClick = jest.fn();
    render(<Column status="TODO" tickets={[makeTicket('x')]} onCardClick={onCardClick} />);
    await userEvent.click(screen.getByRole('listitem'));
    expect(onCardClick).toHaveBeenCalledWith('x');
  });

  it('status="In Progress" 카드 클릭 → 해당 id 전달', async () => {
    const onCardClick = jest.fn();
    render(<Column status="In Progress" tickets={[makeTicket('y', 'In Progress')]} onCardClick={onCardClick} />);
    await userEvent.click(screen.getByRole('listitem'));
    expect(onCardClick).toHaveBeenCalledWith('y');
  });

  it('status="Done" 카드 클릭 → 해당 id 전달', async () => {
    const onCardClick = jest.fn();
    render(<Column status="Done" tickets={[makeTicket('z', 'Done')]} onCardClick={onCardClick} />);
    await userEvent.click(screen.getByRole('listitem'));
    expect(onCardClick).toHaveBeenCalledWith('z');
  });
});
