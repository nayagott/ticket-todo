'use client';

import { useDroppable } from '@dnd-kit/core';
import { TicketCard } from '@/client/components/Card/TicketCard';
import type { ColumnStatus } from '@/shared/constants/status';
import type { TicketDto } from '@/shared/types/ticket';

type ColumnProps = {
  status:  Exclude<ColumnStatus, 'Backlog'>;
  tickets: TicketDto[];
};

export function Column({ status, tickets }: ColumnProps) {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <section ref={setNodeRef} role="list" aria-label={status} className="flex-1">
      <h2>{status}</h2>
      {tickets.map((ticket) => (
        <TicketCard key={ticket.id} ticket={ticket} />
      ))}
    </section>
  );
}
