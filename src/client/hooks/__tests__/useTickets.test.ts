import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { useTickets } from '../useTickets';
import { server } from '@/mocks/server';
import { ticketsHandlers } from '@/mocks/handlers';
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

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('useTickets', () => {
  it('TC-HOOK-001: 마운트 시 GET 호출 → tickets 상태 저장', async () => {
    const seed = [makeTicket({ id: '1' }), makeTicket({ id: '2' }), makeTicket({ id: '3' })];
    server.use(...ticketsHandlers(seed));

    const { result } = renderHook(() => useTickets());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.tickets).toHaveLength(3);
  });

  it('moveTicket → PATCH 후 해당 티켓 status/order 갱신', async () => {
    const seed = [makeTicket({ id: '1', status: 'Backlog', order: 1000 })];
    server.use(...ticketsHandlers(seed));

    const { result } = renderHook(() => useTickets());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.moveTicket('1', 'TODO', 1500);
    });

    await waitFor(() => {
      const ticket = result.current.tickets.find((t) => t.id === '1');
      expect(ticket?.status).toBe('TODO');
      expect(ticket?.order).toBe(1500);
    });
  });

  it('TC-HOOK-008: API 오류 → error 상태 설정', async () => {
    server.use(
      http.get('/api/tickets', () =>
        HttpResponse.json({ error: 'Internal server error', details: {} }, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => useTickets());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).not.toBeNull();
    expect(result.current.tickets).toEqual([]);
  });

  it('T011: createTicket → POST 호출 + tickets 상태에 추가', async () => {
    const seed: TicketDto[] = [];
    server.use(...ticketsHandlers(seed));

    const { result } = renderHook(() => useTickets());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.createTicket({ title: '새 티켓' });
    });

    expect(result.current.tickets).toHaveLength(1);
    expect(result.current.tickets[0].title).toBe('새 티켓');
    expect(result.current.tickets[0].status).toBe('Backlog');
  });

  it('T011: appendTicket → API 호출 없이 tickets 상태에 추가', async () => {
    const seed = [makeTicket({ id: '1' })];
    server.use(...ticketsHandlers(seed));

    const { result } = renderHook(() => useTickets());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const newTicket = makeTicket({ id: '99', title: '직접 추가' });
    act(() => {
      result.current.appendTicket(newTicket);
    });

    expect(result.current.tickets).toHaveLength(2);
    expect(result.current.tickets[1].id).toBe('99');
  });
});
