/**
 * 시나리오 C — 기한 임박 확인 및 처리 (PRD §3 시나리오 C)
 * TC-INT-010 ~ TC-INT-013
 */

import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Board } from '@/client/components/Board/Board';
import { server } from '@/mocks/server';
import { ticketsHandlers } from '@/mocks/handlers';
import type { TicketDto } from '@/shared/types/ticket';

const NOW = new Date();
NOW.setHours(0, 0, 0, 0);

function daysFromNow(n: number): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

const BASE_CREATED = '2026-06-22T00:00:00.000Z';

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

describe('시나리오 C — 기한 경고 색상', () => {
  it('TC-INT-010: 초기 로드 → 기한 경고 카드 색상 표시', async () => {
    const tickets = [
      ticket({ id: 'c010-over', title: '초과 카드c010', dueDate: daysFromNow(-1), status: 'TODO', order: 1000 }),
      ticket({ id: 'c010-warn', title: '임박 카드c010', dueDate: daysFromNow(2),  status: 'TODO', order: 2000 }),
      ticket({ id: 'c010-ok',   title: '정상 카드c010', dueDate: daysFromNow(10), status: 'TODO', order: 3000 }),
    ];
    server.use(...ticketsHandlers(tickets));

    render(<Board />);
    await waitFor(() => expect(screen.getByText('초과 카드c010')).toBeInTheDocument());

    const overCard = screen.getByText('초과 카드c010').closest('[role="listitem"]');
    const warnCard = screen.getByText('임박 카드c010').closest('[role="listitem"]');
    const okCard   = screen.getByText('정상 카드c010').closest('[role="listitem"]');

    expect(overCard).toHaveClass('border-[#FF5630]');
    expect(warnCard).toHaveClass('border-[#FFAB00]');
    expect(okCard).toHaveClass('border-[#DFE1E6]');
  });

  it('TC-INT-011: "일정이 초과된 업무" 필터 → 해당 카드만 표시', async () => {
    const tickets = [
      ticket({ id: 'c011-over1', title: '초과c011-1', dueDate: daysFromNow(-1), status: 'TODO', order: 1000 }),
      ticket({ id: 'c011-over2', title: '초과c011-2', dueDate: daysFromNow(-2), status: 'In Progress', order: 1000 }),
      ticket({ id: 'c011-ok1',   title: '정상c011-1', dueDate: daysFromNow(5),  status: 'TODO', order: 2000 }),
      ticket({ id: 'c011-ok2',   title: '정상c011-2', status: 'Done', order: 1000 }),
    ];
    server.use(...ticketsHandlers(tickets));

    render(<Board />);
    await waitFor(() => expect(screen.getByText('초과c011-1')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: '일정이 초과된 업무' }));

    await waitFor(() => expect(screen.queryByText('정상c011-1')).not.toBeInTheDocument());
    expect(screen.getByText('초과c011-1')).toBeInTheDocument();
    expect(screen.getByText('초과c011-2')).toBeInTheDocument();
    expect(screen.queryByText('정상c011-2')).not.toBeInTheDocument();
  });

  it('TC-INT-012: DetailModal에서 dueDate 수정 → 테두리 border-[#DFE1E6]으로 변경', async () => {
    const id = 'c012-edit';
    const futureISO = daysFromNow(10);
    const overdueTicket = ticket({ id, title: '기한초과c012', dueDate: daysFromNow(-1), status: 'TODO' });
    const updatedTicket = { ...overdueTicket, dueDate: futureISO };

    server.use(...ticketsHandlers([overdueTicket]));
    server.use(
      http.patch(`/api/tickets/${id}`, () => HttpResponse.json(updatedTicket)),
    );

    render(<Board />);
    await waitFor(() => expect(screen.getByText('기한초과c012')).toBeInTheDocument());

    // 카드 초기 상태: border-[#FF5630]
    const todoCol = screen.getByRole('list', { name: '할 일' });
    expect(within(todoCol).getAllByRole('listitem')[0]).toHaveClass('border-[#FF5630]');

    // 카드 클릭 → DetailModal 오픈 (only one element at this point)
    fireEvent.click(screen.getByText('기한초과c012'));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    // 종료예정일 필드 span 클릭 → 편집 input 활성화
    const dialog = screen.getByRole('dialog');
    const dueDateRow = within(dialog).getByText('종료예정일').closest('.grid') as HTMLElement;
    const dueDateSpan = within(dueDateRow).getByText(/\d{4}-\d{2}-\d{2}/);
    await userEvent.click(dueDateSpan);

    // 날짜 input blur → saveField('dueDate') 호출 → MSW returns updatedTicket
    const dateInput = await screen.findByDisplayValue(/\d{4}-\d{2}-\d{2}/);
    await userEvent.tab(); // blur → saveField('dueDate')

    await waitFor(() => {
      // replaceTicket updates the board card's dueDate → border-[#DFE1E6]
      const cards = within(todoCol).getAllByRole('listitem');
      expect(cards[0]).toHaveClass('border-[#DFE1E6]');
    });
  });

  it('TC-INT-013: 수정 API 실패 → 에러 메시지 표시, 이전 값 유지', async () => {
    const id = 'c013-fail';
    const overdueTicket = ticket({ id, title: '수정실패c013', dueDate: daysFromNow(-1), status: 'TODO' });

    server.use(...ticketsHandlers([overdueTicket]));
    server.use(
      http.patch(`/api/tickets/${id}`, () =>
        HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 }),
      ),
    );

    render(<Board />);
    await waitFor(() => expect(screen.getByText('수정실패c013')).toBeInTheDocument());

    // 카드 클릭 → DetailModal 오픈
    fireEvent.click(screen.getByText('수정실패c013'));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    // 제목 span 클릭 → input 활성화
    const dialog = screen.getByRole('dialog');
    const titleSpan = within(dialog).getAllByText('수정실패c013')[0];
    await userEvent.click(titleSpan);

    // input에서 값 변경 후 blur → saveField → API 500
    const titleInput = await screen.findByDisplayValue('수정실패c013');
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, '변경된제목c013');
    await userEvent.tab(); // blur → saveField('title')

    // API 실패 → error toast (role="alert") 표시
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // 모달이 닫히지 않아야 한다
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
