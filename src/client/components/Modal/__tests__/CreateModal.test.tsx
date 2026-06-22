import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateModal } from '../CreateModal';
import type { TicketDto } from '@/shared/types/ticket';
import type { CreateTicketInput } from '@/shared/schemas/ticketSchema';

const NOW = '2026-06-19T00:00:00.000Z';

function makeCreatedTicket(title: string, priority?: string): TicketDto {
  return {
    id: 'new-1',
    title,
    description: null,
    status: 'Backlog',
    priority: (priority as TicketDto['priority']) ?? null,
    order: 1000,
    startedAt: null,
    dueDate: null,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function mockCreateTicket(ticket: TicketDto) {
  return jest.fn<Promise<TicketDto>, [CreateTicketInput]>().mockResolvedValue(ticket);
}

describe('CreateModal', () => {
  it('role="dialog" + aria-modal="true" 접근성 속성 (T009)', () => {
    render(
      <CreateModal isOpen={true} onClose={jest.fn()} createTicket={mockCreateTicket(makeCreatedTicket('T'))} />,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'create-modal-title');
  });

  it('isOpen=false 이면 렌더링하지 않음', () => {
    render(
      <CreateModal isOpen={false} onClose={jest.fn()} createTicket={mockCreateTicket(makeCreatedTicket('T'))} />,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('취소 버튼 클릭 → onClose 호출', async () => {
    const onClose = jest.fn();
    render(<CreateModal isOpen={true} onClose={onClose} createTicket={mockCreateTicket(makeCreatedTicket('T'))} />);
    await userEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ESC 키 → onClose 호출', async () => {
    const onClose = jest.fn();
    render(<CreateModal isOpen={true} onClose={onClose} createTicket={mockCreateTicket(makeCreatedTicket('T'))} />);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('title 빈 상태에서 저장 버튼 비활성화', () => {
    render(<CreateModal isOpen={true} onClose={jest.fn()} createTicket={mockCreateTicket(makeCreatedTicket('T'))} />);
    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled();
  });

  it('title 입력 시 저장 버튼 활성화', async () => {
    render(<CreateModal isOpen={true} onClose={jest.fn()} createTicket={mockCreateTicket(makeCreatedTicket('T'))} />);
    await userEvent.type(screen.getByLabelText(/제목/), '새 티켓');
    expect(screen.getByRole('button', { name: '저장' })).toBeEnabled();
  });

  it('TC-COMP: title만 입력 후 제출 → createTicket 호출 + onClose (T010)', async () => {
    const ticket = makeCreatedTicket('새 티켓');
    const createTicket = mockCreateTicket(ticket);
    const onClose = jest.fn();
    render(<CreateModal isOpen={true} onClose={onClose} createTicket={createTicket} />);

    await userEvent.type(screen.getByLabelText(/제목/), '새 티켓');
    await userEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => expect(createTicket).toHaveBeenCalledTimes(1));
    expect(createTicket).toHaveBeenCalledWith(expect.objectContaining({ title: '새 티켓' }));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('TC-COMP: title 빈 상태에서 저장 버튼 비활성 → createTicket 호출 없음 (T010)', async () => {
    const createTicket = mockCreateTicket(makeCreatedTicket('T'));
    render(<CreateModal isOpen={true} onClose={jest.fn()} createTicket={createTicket} />);

    const saveButton = screen.getByRole('button', { name: '저장' });
    expect(saveButton).toBeDisabled();
    await userEvent.click(saveButton);

    expect(createTicket).not.toHaveBeenCalled();
  });

  it('TC-COMP: priority 선택 후 제출 → priority 포함 createTicket 호출 (T010)', async () => {
    const createTicket = mockCreateTicket(makeCreatedTicket('T', 'High'));
    render(<CreateModal isOpen={true} onClose={jest.fn()} createTicket={createTicket} />);

    await userEvent.type(screen.getByLabelText(/제목/), 'T');
    await userEvent.selectOptions(screen.getByLabelText(/우선순위/), 'High');
    await userEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => expect(createTicket).toHaveBeenCalledTimes(1));
    expect(createTicket).toHaveBeenCalledWith(expect.objectContaining({ priority: 'High' }));
  });

  it('TC-COMP-037: isOpen=true → 제목·설명·우선순위·시작일·마감일 입력 필드 모두 렌더링', () => {
    render(<CreateModal isOpen={true} onClose={jest.fn()} createTicket={mockCreateTicket(makeCreatedTicket('T'))} />);
    expect(screen.getByLabelText(/제목/)).toBeInTheDocument();
    expect(screen.getByLabelText(/설명/)).toBeInTheDocument();
    expect(screen.getByLabelText(/우선순위/)).toBeInTheDocument();
    expect(screen.getByLabelText(/시작일/)).toBeInTheDocument();
    expect(screen.getByLabelText(/마감일/)).toBeInTheDocument();
  });

  it('TC-COMP-039: title 255자 입력 → 저장 버튼 활성 (경계값)', () => {
    render(<CreateModal isOpen={true} onClose={jest.fn()} createTicket={mockCreateTicket(makeCreatedTicket('T'))} />);
    fireEvent.change(screen.getByLabelText(/제목/), { target: { value: 'A'.repeat(255) } });
    expect(screen.getByRole('button', { name: '저장' })).toBeEnabled();
  });

  it('TC-COMP-040: title 256자 입력 → 저장 버튼 비활성 (경계값)', () => {
    render(<CreateModal isOpen={true} onClose={jest.fn()} createTicket={mockCreateTicket(makeCreatedTicket('T'))} />);
    fireEvent.change(screen.getByLabelText(/제목/), { target: { value: 'A'.repeat(256) } });
    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled();
  });

  it('TC-COMP-043: API 실패 → 에러 메시지 표시, 모달 유지', async () => {
    const createTicket = jest.fn<Promise<TicketDto>, [CreateTicketInput]>().mockRejectedValue(new Error('서버 오류'));
    const onClose = jest.fn();
    render(<CreateModal isOpen={true} onClose={onClose} createTicket={createTicket} />);

    fireEvent.change(screen.getByLabelText(/제목/), { target: { value: '실패 테스트' } });
    await userEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
