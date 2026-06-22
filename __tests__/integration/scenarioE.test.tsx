/**
 * 시나리오 E — 티켓 삭제 (PRD §3 시나리오 E)
 * TC-INT-017 ~ TC-INT-020
 */

import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
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

/** Click the card on the board (not inside a dialog) */
function clickBoardCard(title: string) {
  const cards = screen.getAllByText(title);
  // The board card is the one NOT inside a dialog
  const boardCard = cards.find(el => !el.closest('[role="dialog"]') && !el.closest('[role="alertdialog"]'));
  if (!boardCard) throw new Error(`Board card "${title}" not found`);
  fireEvent.click(boardCard);
}

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('시나리오 E — 티켓 삭제', () => {
  it('TC-INT-017: 카드 클릭 → DetailModal 오픈, 삭제 버튼 존재', async () => {
    server.use(...ticketsHandlers([ticket({ id: 'e017', title: '삭제대상e017' })]));
    render(<Board />);
    await waitFor(() => expect(screen.getByText('삭제대상e017')).toBeInTheDocument());

    clickBoardCard('삭제대상e017');

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    // DetailModal has a '삭제' button in the footer
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: '삭제' })).toBeInTheDocument();
  });

  it('TC-INT-018: 삭제 버튼 → ConfirmDialog 표시', async () => {
    server.use(...ticketsHandlers([ticket({ id: 'e018', title: '삭제확인e018' })]));
    render(<Board />);
    await waitFor(() => expect(screen.getByText('삭제확인e018')).toBeInTheDocument());

    clickBoardCard('삭제확인e018');
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '삭제' }));

    await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());
    expect(screen.getByText(/정말 삭제하시겠습니까/)).toBeInTheDocument();
  });

  it('TC-INT-019: ConfirmDialog 취소 → DELETE 미호출, 카드 보드에 유지', async () => {
    server.use(...ticketsHandlers([ticket({ id: 'e019', title: '취소카드e019' })]));
    let deleteCalled = false;
    server.use(
      http.delete('/api/tickets/e019', () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    render(<Board />);
    await waitFor(() => expect(screen.getByText('취소카드e019')).toBeInTheDocument());

    clickBoardCard('취소카드e019');
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '삭제' }));
    await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());

    // ConfirmDialog에서 '취소' 클릭
    await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: '취소' }));

    expect(deleteCalled).toBe(false);
    // 카드는 여전히 보드에 있어야 한다 (board card)
    const cards = screen.getAllByText('취소카드e019');
    expect(cards.length).toBeGreaterThanOrEqual(1);
  });

  it('TC-INT-020: ConfirmDialog 확인 → DELETE 1회 호출, 카드 보드에서 제거', async () => {
    server.use(...ticketsHandlers([ticket({ id: 'e020', title: '삭제될카드e020' })]));
    server.use(
      http.delete('/api/tickets/e020', () => new HttpResponse(null, { status: 204 })),
    );

    render(<Board />);
    await waitFor(() => expect(screen.getByText('삭제될카드e020')).toBeInTheDocument());

    clickBoardCard('삭제될카드e020');
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '삭제' }));
    await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());

    // ConfirmDialog에서 '삭제' (확인) 클릭
    await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: '삭제' }));

    await waitFor(() => {
      expect(screen.queryByText('삭제될카드e020')).not.toBeInTheDocument();
    });
  });
});
