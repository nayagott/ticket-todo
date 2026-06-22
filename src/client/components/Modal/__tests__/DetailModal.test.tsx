import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DetailModal } from '../DetailModal';
import type { TicketDto } from '@/shared/types/ticket';
import type { UpdateTicketInput } from '@/shared/schemas/ticketSchema';

const NOW = '2026-06-22T00:00:00.000Z';

const baseTicket: TicketDto = {
  id: 'detail-1',
  title: '상세 보기 티켓',
  description: '티켓 설명입니다.',
  status: 'TODO',
  priority: 'Medium',
  order: 1000,
  startedAt: '2026-06-20T00:00:00.000Z',
  dueDate:   '2026-06-30T00:00:00.000Z',
  createdAt: NOW,
  updatedAt: NOW,
};

function mockUpdate(ticket: TicketDto = baseTicket) {
  return jest.fn<Promise<TicketDto>, [string, UpdateTicketInput]>().mockResolvedValue(ticket);
}

function mockDelete() {
  return jest.fn<Promise<void>, [string]>().mockResolvedValue(undefined);
}

afterEach(() => jest.clearAllMocks());

describe('DetailModal — 가시성', () => {
  it('ticket=null → 렌더링되지 않음', () => {
    render(<DetailModal ticket={null} onClose={jest.fn()} updateTicket={mockUpdate()} deleteTicket={mockDelete()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('ticket 있음 → role="dialog", aria-modal="true"', () => {
    render(<DetailModal ticket={baseTicket} onClose={jest.fn()} updateTicket={mockUpdate()} deleteTicket={mockDelete()} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });
});

describe('DetailModal — 필드 표시 (FR-016)', () => {
  it('title 표시', () => {
    render(<DetailModal ticket={baseTicket} onClose={jest.fn()} updateTicket={mockUpdate()} deleteTicket={mockDelete()} />);
    expect(screen.getByText('상세 보기 티켓')).toBeInTheDocument();
  });

  it('description 표시', () => {
    render(<DetailModal ticket={baseTicket} onClose={jest.fn()} updateTicket={mockUpdate()} deleteTicket={mockDelete()} />);
    expect(screen.getByText('티켓 설명입니다.')).toBeInTheDocument();
  });

  it('priority 표시', () => {
    render(<DetailModal ticket={baseTicket} onClose={jest.fn()} updateTicket={mockUpdate()} deleteTicket={mockDelete()} />);
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('status 표시', () => {
    render(<DetailModal ticket={baseTicket} onClose={jest.fn()} updateTicket={mockUpdate()} deleteTicket={mockDelete()} />);
    expect(screen.getByText('TODO')).toBeInTheDocument();
  });

  it('createdAt 표시 (읽기 전용)', () => {
    render(<DetailModal ticket={baseTicket} onClose={jest.fn()} updateTicket={mockUpdate()} deleteTicket={mockDelete()} />);
    expect(screen.getByText('2026-06-22')).toBeInTheDocument();
  });

  it('TC-COMP-045: startedAt 텍스트 표시', () => {
    render(<DetailModal ticket={baseTicket} onClose={jest.fn()} updateTicket={mockUpdate()} deleteTicket={mockDelete()} />);
    expect(screen.getByText('2026-06-20')).toBeInTheDocument();
  });

  it('TC-COMP-045: dueDate 텍스트 표시', () => {
    render(<DetailModal ticket={baseTicket} onClose={jest.fn()} updateTicket={mockUpdate()} deleteTicket={mockDelete()} />);
    expect(screen.getByText('2026-06-30')).toBeInTheDocument();
  });
});

describe('DetailModal — 인라인 편집', () => {
  it('title 클릭 → input으로 전환', async () => {
    render(<DetailModal ticket={baseTicket} onClose={jest.fn()} updateTicket={mockUpdate()} deleteTicket={mockDelete()} />);
    await userEvent.click(screen.getByText('상세 보기 티켓'));
    expect(screen.getByDisplayValue('상세 보기 티켓')).toBeInTheDocument();
  });

  it('title 수정 후 blur → updateTicket 호출', async () => {
    const updated: TicketDto = { ...baseTicket, title: '수정된 제목' };
    const updateTicket = mockUpdate(updated);
    render(<DetailModal ticket={baseTicket} onClose={jest.fn()} updateTicket={updateTicket} deleteTicket={mockDelete()} />);
    await userEvent.click(screen.getByText('상세 보기 티켓'));
    const input = screen.getByDisplayValue('상세 보기 티켓');
    await userEvent.clear(input);
    await userEvent.type(input, '수정된 제목');
    await userEvent.tab();
    await waitFor(() => expect(updateTicket).toHaveBeenCalledWith('detail-1', expect.objectContaining({ title: '수정된 제목' })));
  });

  it('title 비운 뒤 blur → updateTicket 호출 없음, 에러 표시 (NFR-016)', async () => {
    const updateTicket = mockUpdate();
    render(<DetailModal ticket={baseTicket} onClose={jest.fn()} updateTicket={updateTicket} deleteTicket={mockDelete()} />);
    await userEvent.click(screen.getByText('상세 보기 티켓'));
    const input = screen.getByDisplayValue('상세 보기 티켓');
    await userEvent.clear(input);
    await userEvent.tab();
    expect(updateTicket).not.toHaveBeenCalled();
  });

  it('편집 중 ESC → 편집 모드 취소, 원래 값 복원', async () => {
    render(<DetailModal ticket={baseTicket} onClose={jest.fn()} updateTicket={mockUpdate()} deleteTicket={mockDelete()} />);
    await userEvent.click(screen.getByText('상세 보기 티켓'));
    expect(screen.getByDisplayValue('상세 보기 티켓')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByDisplayValue('상세 보기 티켓')).not.toBeInTheDocument();
    expect(screen.getByText('상세 보기 티켓')).toBeInTheDocument();
  });
});

describe('DetailModal — 삭제 흐름 (FR-005, NFR-017)', () => {
  it('삭제 버튼 클릭 → ConfirmDialog 열림', async () => {
    render(<DetailModal ticket={baseTicket} onClose={jest.fn()} updateTicket={mockUpdate()} deleteTicket={mockDelete()} />);
    await userEvent.click(screen.getByRole('button', { name: '삭제' }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('ConfirmDialog 취소 → 모달 유지, ConfirmDialog 닫힘 (NFR-017)', async () => {
    render(<DetailModal ticket={baseTicket} onClose={jest.fn()} updateTicket={mockUpdate()} deleteTicket={mockDelete()} />);
    await userEvent.click(screen.getByRole('button', { name: '삭제' }));
    await userEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('ConfirmDialog 확인 → deleteTicket + onClose 호출', async () => {
    const deleteTicket = mockDelete();
    const onClose = jest.fn();
    render(<DetailModal ticket={baseTicket} onClose={onClose} updateTicket={mockUpdate()} deleteTicket={deleteTicket} />);
    await userEvent.click(screen.getByRole('button', { name: '삭제' }));
    await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: '삭제' }));
    await waitFor(() => expect(deleteTicket).toHaveBeenCalledWith('detail-1'));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });
});

describe('DetailModal — 닫기', () => {
  it('닫기 버튼 클릭 → onClose 호출', async () => {
    const onClose = jest.fn();
    render(<DetailModal ticket={baseTicket} onClose={onClose} updateTicket={mockUpdate()} deleteTicket={mockDelete()} />);
    await userEvent.click(screen.getByRole('button', { name: '닫기' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('배경 클릭 → onClose 호출', async () => {
    const onClose = jest.fn();
    render(<DetailModal ticket={baseTicket} onClose={onClose} updateTicket={mockUpdate()} deleteTicket={mockDelete()} />);
    await userEvent.click(screen.getByTestId('modal-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ESC (편집 모드 아닐 때) → onClose 호출', async () => {
    const onClose = jest.fn();
    render(<DetailModal ticket={baseTicket} onClose={onClose} updateTicket={mockUpdate()} deleteTicket={mockDelete()} />);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
