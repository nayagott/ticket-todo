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

/** 카드 내용 렌더링 (DnD 훅 없음) */
function TicketCardContent({ ticket }: { ticket: TicketDto }) {
  return (
    <>
      {/* DS §2 Card Title: 14px Medium / Card Description: 12px Regular */}
      <p className="line-clamp-2 text-sm font-medium text-[#172B4D]">
        {ticket.title}
      </p>
      {ticket.description && (
        <p className="mt-1 line-clamp-1 text-xs text-[#5E6C84]">
          {ticket.description}
        </p>
      )}
      {(ticket.priority || ticket.dueDate) && (
        <div className="mt-2 flex flex-wrap gap-1">
          {ticket.priority && <PriorityBadge priority={ticket.priority} />}
          {ticket.dueDate  && <DueDateBadge  dueDate={ticket.dueDate}  />}
        </div>
      )}
    </>
  );
}

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
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: 0.4 }
    : undefined;

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={style}
      aria-grabbed={isDragging}
      onClick={() => onClick(ticket.id)}
      className={[
        /* DS §3.2: radius 8px, padding 12px, shadow 0 1px 2px rgba(0,0,0,0.1) */
        'w-full rounded-[8px] border-2 bg-white p-3 text-left shadow-[0_1px_2px_rgba(0,0,0,0.1)]',
        'hover:bg-[#FAFBFC] hover:shadow-[0_2px_4px_rgba(0,0,0,0.12)] focus:outline-none focus:ring-2 focus:ring-[#0052CC]',
        getDeadlineStyle(ticket.dueDate, ticket.status),
      ].join(' ')}
      {...listeners}
      {...attributes}
    >
      <TicketCardContent ticket={ticket} />
    </button>
  );
}
