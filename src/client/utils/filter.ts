import type { TicketDto } from '@/shared/types/ticket';

export type FilterState = {
  overdue:  boolean; // FR-017
  thisWeek: boolean; // FR-018
};

export function applyFilter(tickets: TicketDto[], filter: FilterState): TicketDto[] {
  if (!filter.overdue && !filter.thisWeek) return tickets;
  return tickets.filter(t => {
    if (filter.overdue  && isOverdue(t))  return true;
    if (filter.thisWeek && isThisWeek(t)) return true;
    return false;
  });
}

export function isOverdue(t: TicketDto): boolean {
  if (!t.dueDate || t.status === 'Done') return false;
  return new Date(t.dueDate) < startOfToday();
}

export function isThisWeek(t: TicketDto): boolean {
  if (!t.dueDate) return false;
  const due = new Date(t.dueDate);
  return due >= startOfWeek() && due <= endOfWeek();
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(): Date {
  const d = startOfToday();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // 월요일 기준
  return d;
}

function endOfWeek(): Date {
  const d = startOfWeek();
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}
