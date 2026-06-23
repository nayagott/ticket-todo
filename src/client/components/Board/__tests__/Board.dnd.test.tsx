import { render, screen, waitFor, within } from '@testing-library/react';
import { Board } from '../Board';
import { server } from '@/mocks/server';
import { ticketsHandlers } from '@/mocks/handlers';
import { dragAndDrop, mockBoundingClientRect } from '@/client/test-utils/dragAndDrop';
import type { TicketDto } from '@/shared/types/ticket';

function makeTicket(overrides: Partial<TicketDto> & { id: string }): TicketDto {
  return {
    title: 'T',
    description: null,
    status: 'Backlog',
    priority: null,
    order: 1000,
    startedAt: null,
    dueDate: null,
    createdAt: '2026-06-16T00:00:00.000Z',
    updatedAt: '2026-06-16T00:00:00.000Z',
    ...overrides,
  };
}

const RECTS = {
  Backlog: { left: 0, top: 0, width: 150, height: 600 },
  TODO: { left: 200, top: 0, width: 150, height: 600 },
  'In Progress': { left: 400, top: 0, width: 150, height: 600 },
  Done: { left: 600, top: 0, width: 150, height: 600 },
} as const;

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function mockAllColumnRects() {
  mockBoundingClientRect(screen.getByRole('list', { name: '백로그' }), RECTS.Backlog);
  mockBoundingClientRect(screen.getByRole('list', { name: '할 일' }), RECTS.TODO);
  mockBoundingClientRect(screen.getByRole('list', { name: '진행 중' }), RECTS['In Progress']);
  mockBoundingClientRect(screen.getByRole('list', { name: '완료' }), RECTS.Done);
}

describe('Board DnD (FR-009)', () => {
  it('TC-INT-007: Backlog → TODO 드래그 → 칼럼 이동 확인', async () => {
    const ticket = makeTicket({ id: '1', title: '신규 티켓', status: 'Backlog' });
    server.use(...ticketsHandlers([ticket]));

    render(<Board />);
    await waitFor(() => screen.getByText('신규 티켓'));
    mockAllColumnRects();

    const card = screen.getByText('신규 티켓').closest('[role="listitem"]') as HTMLElement;
    const backlogPanel = screen.getByRole('list', { name: '백로그' });
    const todoColumn = screen.getByRole('list', { name: '할 일' });

    dragAndDrop(card, { left: 10, top: 10, width: 80, height: 40 }, todoColumn, RECTS.TODO);

    await waitFor(() => {
      expect(within(todoColumn).getByText('신규 티켓')).toBeInTheDocument();
    });
    expect(within(backlogPanel).queryByText('신규 티켓')).toBeNull();
  });

  it('TC-INT-004: 신규 카드 DnD → TODO 이동, status 변경', async () => {
    const ticket = makeTicket({ id: '1', title: '신규 카드', status: 'Backlog' });
    server.use(...ticketsHandlers([ticket]));

    render(<Board />);
    await waitFor(() => screen.getByText('신규 카드'));
    mockAllColumnRects();

    const card = screen.getByText('신규 카드').closest('[role="listitem"]') as HTMLElement;
    const todoColumn = screen.getByRole('list', { name: '할 일' });

    dragAndDrop(card, { left: 10, top: 10, width: 80, height: 40 }, todoColumn, RECTS.TODO);

    await waitFor(() => {
      expect(within(todoColumn).getByText('신규 카드')).toBeInTheDocument();
    });
  });

  it('TC-INT-008: 기한 초과 카드를 Done으로 드래그 → border-[#DFE1E6]으로 변경', async () => {
    const ticket = makeTicket({
      id: '1',
      title: '초과 티켓',
      status: 'In Progress',
      dueDate: '2026-06-10T00:00:00.000Z', // 오늘(2026-06-16) 기준 기한 초과
    });
    server.use(...ticketsHandlers([ticket]));

    render(<Board />);
    await waitFor(() => screen.getByText('초과 티켓'));

    const cardBefore = screen.getByText('초과 티켓').closest('[role="listitem"]') as HTMLElement;
    expect(cardBefore).toHaveClass('border-[#FF5630]');

    mockAllColumnRects();
    const inProgressColumn = screen.getByRole('list', { name: '진행 중' });
    const doneColumn = screen.getByRole('list', { name: '완료' });

    dragAndDrop(cardBefore, { left: 410, top: 10, width: 80, height: 40 }, doneColumn, RECTS.Done);

    await waitFor(() => {
      const cardAfter = within(doneColumn).getByText('초과 티켓').closest('[role="listitem"]');
      expect(cardAfter).toHaveClass('border-[#DFE1E6]');
    });
    expect(within(inProgressColumn).queryByText('초과 티켓')).toBeNull();
  });
});

describe('Board DnD — aria-live 알림 (NFR-010)', () => {
  it('TC-COMP-004: DnD 완료 → aria-live 영역에 이동 완료 메시지 포함', async () => {
    const ticket = makeTicket({ id: 'ann-1', title: '알림 티켓', status: 'Backlog' });
    server.use(...ticketsHandlers([ticket]));

    const { container } = render(<Board />);
    await waitFor(() => screen.getByText('알림 티켓'));
    mockAllColumnRects();

    const card = screen.getByText('알림 티켓').closest('[role="listitem"]') as HTMLElement;
    const todoColumn = screen.getByRole('list', { name: '할 일' });

    dragAndDrop(card, { left: 10, top: 10, width: 80, height: 40 }, todoColumn, RECTS.TODO);

    await waitFor(() => {
      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion?.textContent).toContain('할 일');
    });
  });
});

describe('Board DnD — 칼럼 내 순서 변경 (FR-010)', () => {
  it('TC-INT-009: 같은 칼럼 내 카드 순서 변경 → order 변경 후 렌더 순서 반영', async () => {
    const ticketA = makeTicket({ id: '1', title: '카드A', status: 'TODO', order: 1000 });
    const ticketB = makeTicket({ id: '2', title: '카드B', status: 'TODO', order: 2000 });
    server.use(...ticketsHandlers([ticketA, ticketB]));

    render(<Board />);
    await waitFor(() => screen.getByText('카드A'));
    mockAllColumnRects();

    const todoColumn = screen.getByRole('list', { name: '할 일' });
    const cardA = screen.getByText('카드A').closest('[role="listitem"]') as HTMLElement;
    const cardB = screen.getByText('카드B').closest('[role="listitem"]') as HTMLElement;

    const initialCards = within(todoColumn).getAllByRole('listitem');
    expect(initialCards[0]).toBe(cardA);
    expect(initialCards[1]).toBe(cardB);

    dragAndDrop(
      cardA,
      { left: 210, top: 10, width: 130, height: 40 },
      cardB,
      { left: 210, top: 60, width: 130, height: 40 },
    );

    await waitFor(() => {
      const cardsAfter = within(todoColumn).getAllByRole('listitem');
      expect(cardsAfter[0]).toBe(cardB);
      expect(cardsAfter[1]).toBe(cardA);
    });
  });
});
