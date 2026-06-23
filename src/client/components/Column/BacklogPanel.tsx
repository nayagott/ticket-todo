'use client';

import { useDroppable } from '@dnd-kit/core';
import { TicketCard } from '@/client/components/Card/TicketCard';
import { COLUMN_LABELS } from '@/shared/constants/status';
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
      aria-label={COLUMN_LABELS['Backlog']}
      /* DS §3.3: 고정 너비 280px, swimlane */
      className="flex shrink-0 flex-col gap-2 px-3 pb-4"
      style={{ width: 'var(--backlog-width)', minHeight: 'var(--column-min-h)', paddingTop: 'calc(var(--filterbar-h) + 16px)' }}
    >
      {/* DS §2 Column Title: 16px Semi-Bold */}
      <h2 className="px-1 text-base font-semibold text-[#5E6C84]">
        {COLUMN_LABELS['Backlog']}
      </h2>

      {tickets.map(t => (
        <TicketCard key={t.id} ticket={t} onClick={onCardClick} />
      ))}

    </aside>
  );
}
