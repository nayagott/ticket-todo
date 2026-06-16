'use client';

import { useDraggable, useDroppable } from '@dnd-kit/core';
import { getDeadlineStyle } from '@/shared/constants/status';
import type { TicketDto } from '@/shared/types/ticket';

type TicketCardProps = {
  ticket: TicketDto;
};

export function TicketCard({ ticket }: TicketCardProps) {
  const { setNodeRef: setDraggableRef, listeners, attributes, transform } = useDraggable({
    id: ticket.id,
    attributes: { role: 'listitem' },
  });
  // 같은 칼럼 내 카드 위 드롭 위치를 식별하기 위해 드롭 대상으로도 등록한다 (FR-010).
  const { setNodeRef: setDroppableRef } = useDroppable({ id: ticket.id });

  function setNodeRef(node: HTMLElement | null) {
    setDraggableRef(node);
    setDroppableRef(node);
  }

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={getDeadlineStyle(ticket.dueDate, ticket.status)}
      {...listeners}
      {...attributes}
    >
      <h3>{ticket.title}</h3>
    </div>
  );
}
