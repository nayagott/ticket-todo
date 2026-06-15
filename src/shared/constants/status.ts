export const TICKET_STATUSES = ['Backlog', 'TODO', 'In Progress', 'Done'] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const PRIORITIES = ['Low', 'Medium', 'High'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const DUE_WARNING_DAYS = 3;

export function getDeadlineStyle(dueDate: string | null, status: string): string {
  if (!dueDate || status === 'Done') return 'border-gray-200';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0)  return 'border-red-500';
  if (diffDays <= 3) return 'border-orange-400';
  return 'border-gray-200';
}
