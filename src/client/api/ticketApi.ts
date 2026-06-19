import type { CreateTicketInput, UpdateTicketInput } from '@/shared/schemas/ticketSchema';
import type { TicketDto } from '@/shared/types/ticket';

export const ticketApi = {
  getAll: async (): Promise<TicketDto[]> => {
    const res = await fetch('/api/tickets');
    if (!res.ok) throw new Error('Failed to fetch tickets');
    return res.json();
  },
  create: async (input: CreateTicketInput): Promise<TicketDto> => {
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error('Failed to create ticket');
    return res.json();
  },
  update: async (id: string, input: UpdateTicketInput): Promise<TicketDto> => {
    const res = await fetch(`/api/tickets/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error('Failed to update ticket');
    return res.json();
  },
};
