'use client';

import { useDraggable, useDroppable } from '@dnd-kit/core';
import { getDeadlineStyle } from '@/shared/constants/status';
import type { TicketDto } from '@/shared/types/ticket';
import { PriorityBadge } from './PriorityBadge';
import { DueDateBadge }  from './DueDateBadge';

type TicketCardProps = {
  ticket:  TicketDto;
  onClick: (id: string) => void;
};

export function TicketCard({ ticket, onClick }: TicketCardProps) {
  const {
    setNodeRef: setDraggableRef,
    listeners,
    attributes,
    transform,
    isDragging,
  } = useDraggable({
    id: ticket.id,
    attributes: { role: 'listitem' },
  });

  // 칼럼 내 카드 위 드롭 위치 식별 (FR-010)
  const { setNodeRef: setDroppableRef } = useDroppable({ id: ticket.id });

  function setNodeRef(node: HTMLElement | null) {
    setDraggableRef(node);
    setDroppableRef(node);
  }

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={style}
      aria-grabbed={isDragging}
      onClick={() => onClick(ticket.id)}
      className={[
        'w-full rounded-lg border-2 bg-white p-3 text-left shadow-sm',
        'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500',
        getDeadlineStyle(ticket.dueDate, ticket.status),
      ].join(' ')}
      {...listeners}
      {...attributes}
    >
      <p className="line-clamp-2 text-sm font-medium text-gray-900">
        {ticket.title}
      </p>
      {ticket.description && (
        <p className="mt-1 line-clamp-1 text-xs text-gray-500">
          {ticket.description}
        </p>
      )}
      {(ticket.priority || ticket.dueDate) && (
        <div className="mt-2 flex flex-wrap gap-1">
          {ticket.priority && <PriorityBadge priority={ticket.priority} />}
          {ticket.dueDate  && <DueDateBadge  dueDate={ticket.dueDate}  />}
        </div>
      )}
    </button>
  );
}
