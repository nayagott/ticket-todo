import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Board } from '../Board';
import { server } from '@/mocks/server';
import { ticketsHandlers } from '@/mocks/handlers';
import type { TicketDto } from '@/shared/types/ticket';

const NOW = '2026-06-22T00:00:00.000Z';

function d(offset: number): string {
  const dt = new Date();
  dt.setDate(dt.getDate() + offset);
  dt.setHours(0, 0, 0, 0);
  return dt.toISOString();
}

function ticket(overrides: Partial<TicketDto>): TicketDto {
  return {
    id: 'x', title: 'T', description: null, status: 'TODO',
    priority: null, order: 1000, startedAt: null, dueDate: null,
    createdAt: NOW, updatedAt: NOW,
    ...overrides,
  };
}

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Board — 기본 렌더링 (FR-006)', () => {
  it('Backlog 패널 + TODO/In Progress/Done 3칼럼 모두 렌더링', async () => {
    server.use(...ticketsHandlers([]));
    render(<Board />);
    await waitFor(() => expect(screen.getByRole('list', { name: 'Backlog' })).toBeInTheDocument());
    expect(screen.getByRole('list', { name: 'TODO' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'In Progress' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Done' })).toBeInTheDocument();
  });

  it('Backlog는 kanban-area 바깥에 위치', async () => {
    server.use(...ticketsHandlers([]));
    const { container } = render(<Board />);
    await waitFor(() => expect(screen.getByRole('list', { name: 'Backlog' })).toBeInTheDocument());
    const kanbanArea = container.querySelector('.kanban-area');
    expect(kanbanArea).not.toBeNull();
    expect(kanbanArea?.querySelector('[aria-label="Backlog"]')).toBeNull();
    expect(screen.getByRole('list', { name: 'Backlog' }).closest('.kanban-area')).toBeNull();
  });

  it('"새 업무" 클릭 → CreateModal 열림', async () => {
    server.use(...ticketsHandlers([]));
    render(<Board />);
    await waitFor(() => expect(screen.getByRole('list', { name: 'Backlog' })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /새 업무/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('FilterBar 렌더링 확인 (FR-017, FR-018)', async () => {
    server.use(...ticketsHandlers([]));
    render(<Board />);
    await waitFor(() => expect(screen.getByRole('list', { name: 'Backlog' })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: '이번주 업무' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '일정이 초과된 업무' })).toBeInTheDocument();
  });

  it('aria-live="polite" 영역 존재 (NFR-010)', async () => {
    server.use(...ticketsHandlers([]));
    const { container } = render(<Board />);
    await waitFor(() => expect(screen.getByRole('list', { name: 'Backlog' })).toBeInTheDocument());
    expect(container.querySelector('[aria-live="polite"]')).toBeInTheDocument();
  });
});

describe('Board — 필터 (FR-017, FR-018)', () => {
  const overdueTicket = ticket({ id: 'over', title: '초과 티켓', status: 'TODO', dueDate: d(-3) });
  const normalTicket  = ticket({ id: 'norm', title: '정상 티켓', status: 'TODO', dueDate: d(10) });

  it('"일정이 초과된 업무" 토글 → 초과 티켓만 표시', async () => {
    server.use(...ticketsHandlers([overdueTicket, normalTicket]));
    render(<Board />);
    await waitFor(() => expect(screen.getByText('초과 티켓')).toBeInTheDocument());
    expect(screen.getByText('정상 티켓')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '일정이 초과된 업무' }));
    expect(screen.getByText('초과 티켓')).toBeInTheDocument();
    expect(screen.queryByText('정상 티켓')).not.toBeInTheDocument();
  });

  it('필터 재토글(비활성화) → 전체 복원', async () => {
    server.use(...ticketsHandlers([overdueTicket, normalTicket]));
    render(<Board />);
    await waitFor(() => expect(screen.getByText('초과 티켓')).toBeInTheDocument());

    const btn = screen.getByRole('button', { name: '일정이 초과된 업무' });
    await userEvent.click(btn); // 활성
    await userEvent.click(btn); // 비활성
    expect(screen.getByText('정상 티켓')).toBeInTheDocument();
  });
});

describe('Board — DetailModal (FR-016)', () => {
  it('카드 클릭 → DetailModal 열림', async () => {
    const t = ticket({ id: 'detail-t', title: '상세 확인 티켓', status: 'TODO' });
    server.use(...ticketsHandlers([t]));
    render(<Board />);
    await waitFor(() => expect(screen.getByText('상세 확인 티켓')).toBeInTheDocument());
    // dnd-kit의 pointerdown 인터셉션을 우회하기 위해 fireEvent.click 사용
    fireEvent.click(screen.getByText('상세 확인 티켓'));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
  });

  it('DetailModal 닫기 → 모달 닫힘', async () => {
    const t = ticket({ id: 'close-t', title: '닫기 테스트', status: 'TODO' });
    server.use(...ticketsHandlers([t]));
    render(<Board />);
    await waitFor(() => expect(screen.getByText('닫기 테스트')).toBeInTheDocument());
    fireEvent.click(screen.getByText('닫기 테스트'));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: '닫기' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
