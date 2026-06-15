import type { TicketStatus, Priority } from '../constants/status';

export interface Ticket {
  id: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: Priority | null;
  order: number;
  startedAt: string | null;  // YYYY-MM-DD
  dueDate: string | null;    // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}
