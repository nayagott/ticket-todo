'use client';

import { useState } from 'react';
import { DndContext } from '@dnd-kit/core';
import { BacklogPanel } from '@/client/components/Column/BacklogPanel';
import { Column } from '@/client/components/Column/Column';
import { Header } from '@/client/components/Board/Header';
import { CreateModal } from '@/client/components/Modal/CreateModal';
import { useDnd } from '@/client/hooks/useDnd';
import { useTickets } from '@/client/hooks/useTickets';
import { groupByStatus } from '@/client/utils/groupByStatus';
import type { TicketDto } from '@/shared/types/ticket';

const KANBAN_STATUSES = ['TODO', 'In Progress', 'Done'] as const;

export function Board() {
  const { tickets, appendTicket, moveTicket } = useTickets();
  const { sensors, onDragEnd } = useDnd(tickets, moveTicket);
  const ticketsByColumn = groupByStatus(tickets);

  const [createModalOpen, setCreateModalOpen] = useState(false);

  function handleCreated(ticket: TicketDto) {
    appendTicket(ticket);
    setCreateModalOpen(false);
  }

  return (
    <div className="flex h-screen flex-col">
      <Header onNewTicket={() => setCreateModalOpen(true)} />
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="board-layout flex flex-1 flex-row overflow-hidden">
          <BacklogPanel tickets={ticketsByColumn.Backlog} />
          <div className="kanban-area flex flex-1 flex-row gap-4 overflow-x-auto p-4">
            {KANBAN_STATUSES.map((status) => (
              <Column key={status} status={status} tickets={ticketsByColumn[status]} />
            ))}
          </div>
        </div>
      </DndContext>
      <CreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
