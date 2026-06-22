import { act, renderHook, waitFor } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';
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

  it('TC-HOOK-003: updateTicket → PATCH 후 해당 티켓 교체', async () => {
    const seed = [makeTicket({ id: '1', title: 'Original' })];
    server.use(...ticketsHandlers(seed));

    const { result } = renderHook(() => useTickets());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.updateTicket('1', { title: 'Updated' });
    });

    expect(result.current.tickets[0].title).toBe('Updated');
  });

  it('TC-HOOK-004: deleteTicket → DELETE 후 해당 티켓 제거', async () => {
    const seed = [makeTicket({ id: '1' }), makeTicket({ id: '2' })];
    server.use(...ticketsHandlers(seed));
    server.use(
      http.delete('/api/tickets/1', () => new HttpResponse(null, { status: 204 })),
    );

    const { result } = renderHook(() => useTickets());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.deleteTicket('1');
    });

    expect(result.current.tickets).toHaveLength(1);
    expect(result.current.tickets[0].id).toBe('2');
  });

  it('TC-HOOK-005: moveTicket → 낙관적 업데이트 즉시 반영 (API 응답 전)', async () => {
    const seed = [makeTicket({ id: '1', status: 'Backlog', order: 1000 })];
    server.use(
      http.get('/api/tickets', () => HttpResponse.json(seed)),
      http.patch('/api/tickets/1', async () => {
        await delay(300);
        return HttpResponse.json({ ...seed[0], status: 'TODO', order: 1000 });
      }),
    );

    const { result } = renderHook(() => useTickets());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // 낙관적 업데이트: API 응답 전에 상태가 즉시 변경돼야 한다
    act(() => {
      void result.current.moveTicket('1', 'TODO', 1000);
    });

    // setTickets(optimistic) → act 내 동기 플러시
    expect(result.current.tickets[0].status).toBe('TODO');
  });

  it('TC-HOOK-006: moveTicket → 성공 시 서버 응답값으로 재동기화', async () => {
    const seed = [makeTicket({ id: '1', status: 'Backlog', order: 1000 })];
    const serverValue = { ...seed[0], status: 'TODO' as const, order: 1000, updatedAt: '2026-06-23T00:00:00.000Z' };
    server.use(
      http.get('/api/tickets', () => HttpResponse.json(seed)),
      http.patch('/api/tickets/1', () => HttpResponse.json(serverValue)),
    );

    const { result } = renderHook(() => useTickets());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.moveTicket('1', 'TODO', 1000);
    });

    expect(result.current.tickets[0].updatedAt).toBe('2026-06-23T00:00:00.000Z');
  });

  it('TC-HOOK-007: moveTicket → API 실패 시 이전 상태 롤백', async () => {
    const seed = [makeTicket({ id: '1', status: 'Backlog', order: 1000 })];
    server.use(
      http.get('/api/tickets', () => HttpResponse.json(seed)),
      http.patch('/api/tickets/1', () =>
        HttpResponse.json({ error: 'Server Error' }, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => useTickets());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await expect(result.current.moveTicket('1', 'TODO', 1000)).rejects.toThrow();
    });

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
