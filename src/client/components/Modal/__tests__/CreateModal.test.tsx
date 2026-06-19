import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { CreateModal } from '../CreateModal';
import { server } from '@/mocks/server';
import { ticketsHandlers } from '@/mocks/handlers';

const NOW = '2026-06-19T00:00:00.000Z';

function makeCreatedTicket(title: string, priority?: string) {
  return {
    id: 'new-1',
    title,
    description: null,
    status: 'Backlog',
    priority: priority ?? null,
    order: 1000,
    startedAt: null,
    dueDate: null,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('CreateModal', () => {
  it('role="dialog" + aria-modal="true" 접근성 속성 (T009)', () => {
    render(
      <CreateModal isOpen={true} onClose={jest.fn()} onCreated={jest.fn()} />,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'create-modal-title');
  });

  it('isOpen=false 이면 렌더링하지 않음', () => {
    render(
      <CreateModal isOpen={false} onClose={jest.fn()} onCreated={jest.fn()} />,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('취소 버튼 클릭 → onClose 호출', async () => {
    const onClose = jest.fn();
    render(<CreateModal isOpen={true} onClose={onClose} onCreated={jest.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ESC 키 → onClose 호출', async () => {
    const onClose = jest.fn();
    render(<CreateModal isOpen={true} onClose={onClose} onCreated={jest.fn()} />);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('title 빈 상태에서 저장 버튼 비활성화', () => {
    render(<CreateModal isOpen={true} onClose={jest.fn()} onCreated={jest.fn()} />);
    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled();
  });

  it('title 입력 시 저장 버튼 활성화', async () => {
    render(<CreateModal isOpen={true} onClose={jest.fn()} onCreated={jest.fn()} />);
    await userEvent.type(screen.getByLabelText(/제목/), '새 티켓');
    expect(screen.getByRole('button', { name: '저장' })).toBeEnabled();
  });

  it('TC-COMP: title만 입력 후 제출 → onCreated 호출 (T010)', async () => {
    server.use(...ticketsHandlers([]));
    server.use(
      http.post('/api/tickets', () =>
        HttpResponse.json(makeCreatedTicket('새 티켓'), { status: 201 }),
      ),
    );
    const onCreated = jest.fn();
    render(<CreateModal isOpen={true} onClose={jest.fn()} onCreated={onCreated} />);

    await userEvent.type(screen.getByLabelText(/제목/), '새 티켓');
    await userEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
    expect(onCreated).toHaveBeenCalledWith(expect.objectContaining({ title: '새 티켓', status: 'Backlog' }));
  });

  it('TC-COMP: title 빈 상태에서 저장 버튼 비활성 → API 호출 없음 (T010)', async () => {
    const postSpy = jest.fn();
    server.use(
      http.post('/api/tickets', () => {
        postSpy();
        return HttpResponse.json({}, { status: 201 });
      }),
    );
    const onCreated = jest.fn();
    render(<CreateModal isOpen={true} onClose={jest.fn()} onCreated={onCreated} />);

    const saveButton = screen.getByRole('button', { name: '저장' });
    expect(saveButton).toBeDisabled();
    await userEvent.click(saveButton);

    expect(postSpy).not.toHaveBeenCalled();
    expect(onCreated).not.toHaveBeenCalled();
  });

  it('TC-COMP: priority 선택 후 제출 → priority 포함 요청 (T010)', async () => {
    let capturedBody: Record<string, unknown> = {};
    server.use(
      http.post('/api/tickets', async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(makeCreatedTicket('T', 'High'), { status: 201 });
      }),
    );
    const onCreated = jest.fn();
    render(<CreateModal isOpen={true} onClose={jest.fn()} onCreated={onCreated} />);

    await userEvent.type(screen.getByLabelText(/제목/), 'T');
    await userEvent.selectOptions(screen.getByLabelText(/우선순위/), 'High');
    await userEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
    expect(capturedBody.priority).toBe('High');
  });
});
