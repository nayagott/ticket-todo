'use client';

import { useDroppable } from '@dnd-kit/core';
import { TicketCard } from '@/client/components/Card/TicketCard';
import type { TicketDto } from '@/shared/types/ticket';

type BacklogPanelProps = {
  tickets: TicketDto[];
};

export function BacklogPanel({ tickets }: BacklogPanelProps) {
  const { setNodeRef } = useDroppable({ id: 'Backlog' });

  return (
    <aside ref={setNodeRef} role="list" aria-label="Backlog" className="w-64 flex-shrink-0">
      <h2>할일 목록 영역(Backlog)</h2>
      {tickets.map((ticket) => (
        <TicketCard key={ticket.id} ticket={ticket} />
      ))}
    </aside>
  );
}
