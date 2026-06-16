import { groupByStatus } from '../groupByStatus';
import type { TicketDto } from '@/shared/types/ticket';
import type { ColumnStatus } from '@/shared/constants/status';

function makeTicket(overrides: Partial<TicketDto> & { id: string; status: ColumnStatus }): TicketDto {
  return {
    title: 'T',
    description: null,
    priority: null,
    order: 1000,
    startedAt: null,
    dueDate: null,
    createdAt: '2026-06-16T00:00:00.000Z',
    updatedAt: '2026-06-16T00:00:00.000Z',
    ...overrides,
  };
}

describe('groupByStatus (FR-007)', () => {
  it('status 필드 기준으로 칼럼별 배열에 배치한다', () => {
    const tickets: TicketDto[] = [
      makeTicket({ id: '1', status: 'TODO', order: 1000 }),
      makeTicket({ id: '2', status: 'Backlog', order: 1000 }),
      makeTicket({ id: '3', status: 'TODO', order: 2000 }),
      makeTicket({ id: '4', status: 'Done', order: 1000 }),
    ];

    const grouped = groupByStatus(tickets);

    expect(grouped.Backlog.map((t) => t.id)).toEqual(['2']);
    expect(grouped.TODO.map((t) => t.id)).toEqual(['1', '3']);
    expect(grouped['In Progress']).toEqual([]);
    expect(grouped.Done.map((t) => t.id)).toEqual(['4']);
  });

  it('각 칼럼 내에서 order 오름차순으로 정렬한다 (PRD §4-4/4-5, FR-008)', () => {
    const tickets: TicketDto[] = [
      makeTicket({ id: '1', status: 'TODO', order: 3000 }),
      makeTicket({ id: '2', status: 'TODO', order: 1000 }),
      makeTicket({ id: '3', status: 'TODO', order: 2000 }),
    ];

    const grouped = groupByStatus(tickets);

    expect(grouped.TODO.map((t) => t.id)).toEqual(['2', '3', '1']);
  });

  it('빈 배열 입력 시 모든 칼럼이 빈 배열이다', () => {
    const grouped = groupByStatus([]);

    expect(grouped).toEqual({
      Backlog: [],
      TODO: [],
      'In Progress': [],
      Done: [],
    });
  });
});
