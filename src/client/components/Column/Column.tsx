'use client';

import { useDroppable } from '@dnd-kit/core';
import { TicketCard } from '@/client/components/Card/TicketCard';
import { COLUMN_LABELS } from '@/shared/constants/status';
import type { ColumnStatus } from '@/shared/constants/status';
import type { TicketDto } from '@/shared/types/ticket';

type ColumnProps = {
  status:      Exclude<ColumnStatus, 'Backlog'>;
  tickets:     TicketDto[];
  onCardClick: (id: string) => void;
};

export function Column({ status, tickets, onCardClick }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      ref={setNodeRef}
      role="list"
      aria-label={COLUMN_LABELS[status]}
      /* DS §3.3: 고정 너비 280px, swimlane */
      className="flex min-w-[var(--column-width)] flex-1 flex-col gap-2 px-3 pt-4 pb-4"
      style={{ minHeight: 'var(--column-min-h)' }}
    >
      {/* DS §2 Column Title: 16px Semi-Bold */}
      <h2 className="px-1 text-base font-semibold text-[#5E6C84]">
        {COLUMN_LABELS[status]}
      </h2>

      {tickets.map(t => (
        <TicketCard key={t.id} ticket={t} onClick={onCardClick} />
      ))}

      {/* TODO 컬럼에만 드롭존 힌트 표시 */}
      {status === 'TODO' && (
        <div
          aria-hidden="true"
          className={[
            'mt-1 rounded-[8px] border-2 border-dashed p-4 text-center text-xs font-medium select-none transition-colors',
            isOver
              ? 'border-[#0052CC] bg-[#DEEBFF] text-[#0747A6]'
              : 'border-[#DFE1E6] text-[#5E6C84]',
          ].join(' ')}
        >
          여기로 드래그하세요
        </div>
      )}
    </section>
  );
}
