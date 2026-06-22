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
  if (maxOrder === null) return 1000;
  const calc = calculateOrder(maxOrder, null);
  return calc.kind === 'order' ? calc.order : maxOrder + 1000;
}

export function useDnd(
  tickets: TicketDto[],
  moveTicket: MoveTicket,
  renormalize?: (status: ColumnStatus) => void,
): UseDndReturn {
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

    const overTicket = tickets.find((t) => t.id === overId);
    const targetStatus = overTicket ? overTicket.status : isColumnStatus(overId) ? overId : null;
    if (!targetStatus) return;

    if (targetStatus !== dragged.status) {
      const targetOrders = tickets.filter((t) => t.status === targetStatus).map((t) => t.order);
      const order = appendOrder(targetOrders.length > 0 ? Math.max(...targetOrders) : null);
      moveTicket(activeId, targetStatus, order);
      return;
    }

    if (!overTicket) return;

    const columnTickets = tickets
      .filter((t) => t.status === targetStatus && t.id !== activeId)
      .sort((a, b) => a.order - b.order);
    const overIndex = columnTickets.findIndex((t) => t.id === overId);
    const nextTicket = columnTickets[overIndex + 1] ?? null;

    const calc = calculateOrder(overTicket.order, nextTicket ? nextTicket.order : null);
    if (calc.kind === 'order') {
      moveTicket(activeId, targetStatus, calc.order);
    } else if (calc.kind === 'renormalize') {
      renormalize?.(targetStatus);
    }
  }

  return { sensors, onDragEnd };
}
