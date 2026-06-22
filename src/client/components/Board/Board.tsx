'use client';

import { useMemo, useState } from 'react';
import { DndContext } from '@dnd-kit/core';
import { BacklogPanel } from '@/client/components/Column/BacklogPanel';
import { Column } from '@/client/components/Column/Column';
import { Header } from '@/client/components/Board/Header';
import { FilterBar } from '@/client/components/Board/FilterBar';
import { CreateModal } from '@/client/components/Modal/CreateModal';
import { DetailModal } from '@/client/components/Modal/DetailModal';
import { useDnd } from '@/client/hooks/useDnd';
import { useTickets } from '@/client/hooks/useTickets';
import { groupByStatus } from '@/client/utils/groupByStatus';
import { applyFilter, type FilterState } from '@/client/utils/filter';
import type { ColumnStatus } from '@/shared/constants/status';

const KANBAN_STATUSES = ['TODO', 'In Progress', 'Done'] as const;

export function Board() {
  const { tickets, isLoading, error, createTicket, updateTicket, deleteTicket, moveTicket } = useTickets();

  const [filter, setFilter]                       = useState<FilterState>({ overdue: false, thisWeek: false });
  const [createModalOpen, setCreateModalOpen]     = useState(false);
  const [selectedTicketId, setSelectedTicketId]   = useState<string | null>(null);
  const [announcement, setAnnouncement]           = useState('');

  const filteredTickets = useMemo(() => applyFilter(tickets, filter), [tickets, filter]);
  const ticketsByColumn = useMemo(() => groupByStatus(filteredTickets), [filteredTickets]);

  const selectedTicket = useMemo(
    () => tickets.find(t => t.id === selectedTicketId) ?? null,
    [tickets, selectedTicketId],
  );

  function handleFilterChange(key: keyof FilterState) {
    setFilter(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function renormalizeColumn(status: ColumnStatus) {
    const columnTickets = tickets
      .filter(t => t.status === status)
      .sort((a, b) => a.order - b.order);

    columnTickets.forEach((ticket, i) => {
      const newOrder = (i + 1) * 1000;
      if (ticket.order !== newOrder) {
        void moveTicket(ticket.id, status, newOrder);
      }
    });
  }

  const { sensors, onDragEnd } = useDnd(
    tickets,
    (id, status, order) =>
      moveTicket(id, status, order).then(() => {
        const t = tickets.find(tk => tk.id === id);
        if (t) setAnnouncement(`"${t.title}"이(가) ${status}로 이동됐습니다.`);
      }).catch(() => {
        setAnnouncement('이동에 실패했습니다. 이전 상태로 복원됐습니다.');
      }),
    renormalizeColumn,
  );

  if (isLoading) return <div className="flex h-screen items-center justify-center text-sm text-gray-500">로딩 중...</div>;
  if (error) return <div className="flex h-screen items-center justify-center text-sm text-red-600">오류: {error}</div>;

  return (
    <div className="flex h-screen flex-col bg-[var(--color-board-bg)]">
      <Header onNewTicket={() => setCreateModalOpen(true)} />

      <FilterBar filter={filter} onFilterChange={handleFilterChange} />

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="board-layout">
          <BacklogPanel
            tickets={ticketsByColumn.Backlog}
            onCardClick={setSelectedTicketId}
          />
          <div className="kanban-area">
            {KANBAN_STATUSES.map(status => (
              <Column
                key={status}
                status={status}
                tickets={ticketsByColumn[status]}
                onCardClick={setSelectedTicketId}
              />
            ))}
          </div>
        </div>
      </DndContext>

      <CreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        createTicket={createTicket}
      />

      <DetailModal
        ticket={selectedTicket}
        onClose={() => setSelectedTicketId(null)}
        updateTicket={updateTicket}
        deleteTicket={async (id) => { await deleteTicket(id); setSelectedTicketId(null); }}
      />

      {/* aria-live: DnD 결과 스크린리더 알림 (NFR-010) */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}
