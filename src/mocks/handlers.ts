import { http, HttpResponse } from 'msw';
import type { TicketDto } from '@/shared/types/ticket';

export function ticketsHandlers(tickets: TicketDto[]) {
  return [
    http.get('/api/tickets', () => HttpResponse.json(tickets)),
    http.patch('/api/tickets/:id', async ({ params, request }) => {
      const body = (await request.json()) as Partial<TicketDto>;
      const ticket = tickets.find((t) => t.id === params.id);
      if (!ticket) {
        return HttpResponse.json({ error: 'Ticket not found', details: {} }, { status: 404 });
      }
      Object.assign(ticket, body);
      return HttpResponse.json(ticket);
    }),
  ];
}
