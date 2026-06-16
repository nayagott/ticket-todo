import { renderHook } from '@testing-library/react';
import type { DragEndEvent } from '@dnd-kit/core';
import { useDnd } from '../useDnd';
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

function dragEndEvent(activeId: string, overId: string | null): DragEndEvent {
  return {
    active: { id: activeId },
    over: overId === null ? null : { id: overId },
  } as unknown as DragEndEvent;
}

describe('useDnd', () => {
  it('TC-HOOK-009: Mouse·Touch·Keyboard 센서 3종 반환', () => {
    const { result } = renderHook(() => useDnd([], jest.fn()));
    expect(result.current.sensors).toHaveLength(3);
  });

  it('TC-HOOK-010: onDragEnd — 칼럼 간 이동 시 moveTicket 호출 (대상 칼럼 최하단에 삽입)', () => {
    const moveTicket = jest.fn();
    const tickets = [
      makeTicket({ id: '1', status: 'Backlog', order: 1000 }),
      makeTicket({ id: '2', status: 'TODO', order: 1000 }),
      makeTicket({ id: '3', status: 'TODO', order: 2000 }),
    ];
    const { result } = renderHook(() => useDnd(tickets, moveTicket));

    result.current.onDragEnd(dragEndEvent('1', 'TODO'));

    expect(moveTicket).toHaveBeenCalledTimes(1);
    expect(moveTicket).toHaveBeenCalledWith('1', 'TODO', 3000);
  });

  it('대상 칼럼이 비어 있으면 order=1000으로 삽입', () => {
    const moveTicket = jest.fn();
    const tickets = [makeTicket({ id: '1', status: 'Backlog', order: 1000 })];
    const { result } = renderHook(() => useDnd(tickets, moveTicket));

    result.current.onDragEnd(dragEndEvent('1', 'Done'));

    expect(moveTicket).toHaveBeenCalledWith('1', 'Done', 1000);
  });

  it('TC-HOOK-012: over=null(드롭 취소) 시 moveTicket 미호출', () => {
    const moveTicket = jest.fn();
    const tickets = [makeTicket({ id: '1', status: 'Backlog', order: 1000 })];
    const { result } = renderHook(() => useDnd(tickets, moveTicket));

    result.current.onDragEnd(dragEndEvent('1', null));

    expect(moveTicket).not.toHaveBeenCalled();
  });

  it('TC-HOOK-011: onDragEnd — 칼럼 내 카드 위에 드롭 시 order 중간값 계산 (prevOrder=1000, nextOrder=3000 → 2000)', () => {
    const moveTicket = jest.fn();
    const tickets = [
      makeTicket({ id: '1', status: 'TODO', order: 500 }), // 드래그 대상
      makeTicket({ id: '2', status: 'TODO', order: 1000 }), // 드롭 대상(over)
      makeTicket({ id: '3', status: 'TODO', order: 3000 }), // over 바로 다음 카드
    ];
    const { result } = renderHook(() => useDnd(tickets, moveTicket));

    result.current.onDragEnd(dragEndEvent('1', '2'));

    expect(moveTicket).toHaveBeenCalledTimes(1);
    expect(moveTicket).toHaveBeenCalledWith('1', 'TODO', 2000);
  });

  it('칼럼 내 마지막 카드 위에 드롭 시 최하단 삽입 (prevOrder + 1000)', () => {
    const moveTicket = jest.fn();
    const tickets = [
      makeTicket({ id: '1', status: 'TODO', order: 500 }),
      makeTicket({ id: '2', status: 'TODO', order: 2000 }), // 칼럼의 마지막 카드(over)
    ];
    const { result } = renderHook(() => useDnd(tickets, moveTicket));

    result.current.onDragEnd(dragEndEvent('1', '2'));

    expect(moveTicket).toHaveBeenCalledWith('1', 'TODO', 3000);
  });

  it('자기 자신 위에 드롭 시 moveTicket 미호출', () => {
    const moveTicket = jest.fn();
    const tickets = [makeTicket({ id: '1', status: 'TODO', order: 1000 })];
    const { result } = renderHook(() => useDnd(tickets, moveTicket));

    result.current.onDragEnd(dragEndEvent('1', '1'));

    expect(moveTicket).not.toHaveBeenCalled();
  });

  it('같은 칼럼의 빈 공간(컨테이너)에 드롭 시 moveTicket 미호출 (위치 정보 없음)', () => {
    const moveTicket = jest.fn();
    const tickets = [makeTicket({ id: '1', status: 'TODO', order: 1000 })];
    const { result } = renderHook(() => useDnd(tickets, moveTicket));

    result.current.onDragEnd(dragEndEvent('1', 'TODO'));

    expect(moveTicket).not.toHaveBeenCalled();
  });
});
