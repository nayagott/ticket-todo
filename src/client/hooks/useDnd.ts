'use client';

import { KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { calculateOrder } from '@/client/utils/calculateOrder';
import { COLUMN_STATUSES, type ColumnStatus } from '@/shared/constants/status';
import type { TicketDto } from '@/shared/types/ticket';

type MoveTicket = (id: string, status: ColumnStatus, order: number) => void;

type UseDndReturn = {
  sensors: ReturnType<typeof useSensors>;
  onDragEnd: (event: DragEndEvent) => void;
};

function isColumnStatus(value: string): value is ColumnStatus {
  return (COLUMN_STATUSES as readonly string[]).includes(value);
}

function appendOrder(maxOrder: number | null): number {
  if (maxOrder === null) return 1000; // 빈 칼럼 최초 삽입
  const calc = calculateOrder(maxOrder, null); // nextOrder=null → 항상 최하단 삽입 분기
  return calc.kind === 'order' ? calc.order : maxOrder + 1000;
}

export function useDnd(tickets: TicketDto[], moveTicket: MoveTicket): UseDndReturn {
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const dragged = tickets.find((t) => t.id === activeId);
    if (!dragged) return;

    // over는 칼럼 컨테이너(status) 또는 다른 티켓 카드(id) 둘 다 가능하다.
    const overTicket = tickets.find((t) => t.id === overId);
    const targetStatus = overTicket ? overTicket.status : isColumnStatus(overId) ? overId : null;
    if (!targetStatus) return;

    if (targetStatus !== dragged.status) {
      // 칼럼 간 이동 (FR-009): 대상 칼럼 최하단에 삽입
      const targetOrders = tickets.filter((t) => t.status === targetStatus).map((t) => t.order);
      const order = appendOrder(targetOrders.length > 0 ? Math.max(...targetOrders) : null);
      moveTicket(activeId, targetStatus, order);
      return;
    }

    // 칼럼 내 순서 변경 (FR-010): 카드 위에 드롭하면 그 카드 바로 뒤에 삽입
    if (!overTicket) return; // 빈 공간(칼럼 컨테이너)에 드롭 — 위치 정보 없음, 처리하지 않음

    const columnTickets = tickets
      .filter((t) => t.status === targetStatus && t.id !== activeId)
      .sort((a, b) => a.order - b.order);
    const overIndex = columnTickets.findIndex((t) => t.id === overId);
    const nextTicket = columnTickets[overIndex + 1] ?? null;

    const calc = calculateOrder(overTicket.order, nextTicket ? nextTicket.order : null);
    if (calc.kind === 'order') {
      moveTicket(activeId, targetStatus, calc.order);
    }
    // 'renormalize' 신호는 아직 처리하지 않는다 — 전체 칼럼 재정규화는 별도 작업으로 남겨둔다.
  }

  return { sensors, onDragEnd };
}
