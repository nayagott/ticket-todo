'use client';

import { useDroppable } from '@dnd-kit/core';
import { TicketCard } from '@/client/components/Card/TicketCard';
import type { TicketDto } from '@/shared/types/ticket';

type BacklogPanelProps = {
  tickets:     TicketDto[];
  onCardClick: (id: string) => void;
};

export function BacklogPanel({ tickets, onCardClick }: BacklogPanelProps) {
  const { setNodeRef } = useDroppable({ id: 'Backlog' });

  return (
    <aside
      ref={setNodeRef}
      role="list"
      aria-label="Backlog"
      className="flex w-64 shrink-0 flex-col gap-2 rounded-xl bg-[var(--color-column-bg)] p-3"
      style={{ minHeight: 'var(--column-min-h)' }}
    >
      <h2 className="px-1 text-sm font-semibold text-[var(--color-text-secondary)]">
        Backlog
      </h2>
      {tickets.map(t => (
        <TicketCard key={t.id} ticket={t} onClick={onCardClick} />
      ))}
    </aside>
  );
}
