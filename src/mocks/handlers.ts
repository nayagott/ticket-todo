import { http, HttpResponse } from 'msw';
import type { TicketDto } from '@/shared/types/ticket';

const NOW = '2026-06-19T00:00:00.000Z';

export function ticketsHandlers(tickets: TicketDto[]) {
  return [
    http.get('/api/tickets', () => HttpResponse.json(tickets)),
    http.post('/api/tickets', async ({ request }) => {
      const body = (await request.json()) as Partial<TicketDto>;
      const created: TicketDto = {
        id: `mock-${Date.now()}`,
        title: body.title ?? '',
        description: body.description ?? null,
        status: 'Backlog',
        priority: body.priority ?? null,
        order: (tickets.length + 1) * 1000,
        startedAt: body.startedAt ?? null,
        dueDate: body.dueDate ?? null,
        createdAt: NOW,
        updatedAt: NOW,
      };
      tickets.push(created);
      return HttpResponse.json(created, { status: 201 });
    }),
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
