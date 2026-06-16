'use client';

import { DndContext } from '@dnd-kit/core';
import { BacklogPanel } from '@/client/components/Column/BacklogPanel';
import { Column } from '@/client/components/Column/Column';
import { useDnd } from '@/client/hooks/useDnd';
import { useTickets } from '@/client/hooks/useTickets';
import { groupByStatus } from '@/client/utils/groupByStatus';

const KANBAN_STATUSES = ['TODO', 'In Progress', 'Done'] as const;

export function Board() {
  const { tickets, moveTicket } = useTickets();
  const { sensors, onDragEnd } = useDnd(tickets, moveTicket);
  const ticketsByColumn = groupByStatus(tickets);

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="board-layout flex flex-1 flex-row">
        <BacklogPanel tickets={ticketsByColumn.Backlog} />
        <div className="kanban-area flex flex-1 flex-row gap-4">
          {KANBAN_STATUSES.map((status) => (
            <Column key={status} status={status} tickets={ticketsByColumn[status]} />
          ))}
        </div>
      </div>
    </DndContext>
  );
}
