/**
 * 시나리오 A — 새 티켓 생성 후 칸반 배치 (PRD §3 시나리오 A)
 * TC-INT-001 ~ TC-INT-003
 * (TC-INT-004, TC-INT-005 는 Board.dnd.test.tsx 에서 커버)
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Board } from '@/client/components/Board/Board';
import { server } from '@/mocks/server';
import { ticketsHandlers } from '@/mocks/handlers';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('시나리오 A — 새 티켓 생성', () => {
  it('TC-INT-001: "새 업무" 클릭 → CreateModal 오픈', async () => {
    server.use(...ticketsHandlers([]));
    render(<Board />);
    await waitFor(() => expect(screen.getByRole('list', { name: 'Backlog' })).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /새 업무/ }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('TC-INT-002: 제목 미입력 → 저장 버튼 비활성, POST 요청 없음', async () => {
    server.use(...ticketsHandlers([]));
    let postCalled = false;
    server.use(
      http.post('/api/tickets', () => {
        postCalled = true;
        return HttpResponse.json({}, { status: 201 });
      }),
    );

    render(<Board />);
    await waitFor(() => expect(screen.getByRole('list', { name: 'Backlog' })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /새 업무/ }));

    const saveBtn = screen.getByRole('button', { name: '저장' });
    expect(saveBtn).toBeDisabled();

    await userEvent.click(saveBtn);
    expect(postCalled).toBe(false);
  });

  it('TC-INT-003: 유효 입력 → Backlog 칼럼에 카드 추가', async () => {
    server.use(...ticketsHandlers([]));

    render(<Board />);
    await waitFor(() => expect(screen.getByRole('list', { name: 'Backlog' })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /새 업무/ }));

    await userEvent.type(screen.getByLabelText(/제목/), '새 통합 티켓');
    await userEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      const backlog = screen.getByRole('list', { name: 'Backlog' });
      expect(within(backlog).getByText('새 통합 티켓')).toBeInTheDocument();
    });
  });
});
