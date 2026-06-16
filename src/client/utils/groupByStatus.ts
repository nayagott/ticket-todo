import { COLUMN_STATUSES, type ColumnStatus } from '@/shared/constants/status';
import type { TicketDto } from '@/shared/types/ticket';

export function groupByStatus(tickets: TicketDto[]): Record<ColumnStatus, TicketDto[]> {
  const grouped = Object.fromEntries(
    COLUMN_STATUSES.map((status) => [status, [] as TicketDto[]]),
  ) as Record<ColumnStatus, TicketDto[]>;

  for (const ticket of tickets) {
    grouped[ticket.status].push(ticket);
  }

  for (const status of COLUMN_STATUSES) {
    grouped[status].sort((a, b) => a.order - b.order); // order 오름차순 나열 (PRD §4-4/4-5)
  }

  return grouped;
}
