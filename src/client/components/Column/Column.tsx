'use client';

import { useDroppable } from '@dnd-kit/core';
import { TicketCard } from '@/client/components/Card/TicketCard';
import type { ColumnStatus } from '@/shared/constants/status';
import type { TicketDto } from '@/shared/types/ticket';

type ColumnProps = {
  status:      Exclude<ColumnStatus, 'Backlog'>;
  tickets:     TicketDto[];
  onCardClick: (id: string) => void;
};

export function Column({ status, tickets, onCardClick }: ColumnProps) {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <section
      ref={setNodeRef}
      role="list"
      aria-label={status}
      className="flex min-w-[var(--column-width)] flex-1 flex-col gap-2 rounded-xl bg-[var(--color-column-bg)] p-3"
      style={{ minHeight: 'var(--column-min-h)' }}
    >
      <h2 className="px-1 text-sm font-semibold text-[var(--color-text-secondary)]">
        {status}
      </h2>
      {tickets.map(t => (
        <TicketCard key={t.id} ticket={t} onClick={onCardClick} />
      ))}
    </section>
  );
}
