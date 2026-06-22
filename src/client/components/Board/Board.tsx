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
import type { TicketDto } from '@/shared/types/ticket';

const KANBAN_STATUSES = ['TODO', 'In Progress', 'Done'] as const;

export function Board() {
  const { tickets, appendTicket, moveTicket } = useTickets();

  const [filter, setFilter]           = useState<FilterState>({ overdue: false, thisWeek: false });
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

  function handleCreated(ticket: TicketDto) {
    appendTicket(ticket);
    setCreateModalOpen(false);
  }

  function handleUpdated(ticket: TicketDto) {
    // useTickets 상태는 Board를 통해 동기화 — appendTicket 미사용, 직접 반영 필요
    // DetailModal의 onUpdated가 호출되면 selectedTicket도 최신값으로 갱신하기 위해
    // tickets를 직접 업데이트하는 updateTicket 함수가 필요하지만
    // MVP 범위에서는 다음 GET으로 재동기화하는 대신 낙관적으로 처리한다
    void ticket; // 향후 useTickets.updateTicket 연결
  }

  function handleDeleted(id: string) {
    setSelectedTicketId(null);
    void id; // 향후 useTickets.deleteTicket 연결
  }

  const { sensors, onDragEnd } = useDnd(tickets, (id, status, order) =>
    moveTicket(id, status, order).then(() => {
      const t = tickets.find(tk => tk.id === id);
      if (t) setAnnouncement(`"${t.title}"이(가) ${status}로 이동됐습니다.`);
    }).catch(() => {
      setAnnouncement('이동에 실패했습니다. 이전 상태로 복원됐습니다.');
    }),
  );

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
        onCreated={handleCreated}
      />

      <DetailModal
        ticket={selectedTicket}
        onClose={() => setSelectedTicketId(null)}
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
      />

      {/* aria-live: DnD 결과 스크린리더 알림 (NFR-010) */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}
