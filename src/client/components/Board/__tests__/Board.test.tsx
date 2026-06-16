import { render, screen, waitFor } from '@testing-library/react';
import { Board } from '../Board';
import { server } from '@/mocks/server';
import { ticketsHandlers } from '@/mocks/handlers';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Board', () => {
  it('FR-006: Backlog 패널 + TODO/In Progress/Done 3칼럼 모두 렌더링', async () => {
    server.use(...ticketsHandlers([]));
    render(<Board />);

    await waitFor(() => {
      expect(screen.getByRole('list', { name: 'Backlog' })).toBeInTheDocument();
    });
    expect(screen.getByRole('list', { name: 'TODO' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'In Progress' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Done' })).toBeInTheDocument();
  });

  it('FR-006: Backlog는 좌측 고정 패널 — kanban-area 바깥에 위치', async () => {
    server.use(...ticketsHandlers([]));
    const { container } = render(<Board />);

    await waitFor(() => {
      expect(screen.getByRole('list', { name: 'Backlog' })).toBeInTheDocument();
    });
    const kanbanArea = container.querySelector('.kanban-area');
    expect(kanbanArea).not.toBeNull();
    expect(kanbanArea?.querySelector('[aria-label="Backlog"]')).toBeNull();
    expect(screen.getByRole('list', { name: 'Backlog' }).closest('.kanban-area')).toBeNull();
  });
});
