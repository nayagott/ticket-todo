import { eq, max } from 'drizzle-orm';
import { db } from '@/server/db';
import { tickets } from '@/server/db/schema';
import type { CreateTicketInput } from '@/shared/schemas/ticketSchema';
import { toTicketDto, type TicketDto } from '@/shared/types/ticket';

async function getNextBacklogOrder(): Promise<number> {
  const [{ maxOrder }] = await db
    .select({ maxOrder: max(tickets.order) })
    .from(tickets)
    .where(eq(tickets.status, 'Backlog'));

  return maxOrder === null ? 1000 : maxOrder + 1000;
}

export async function createTicket(input: CreateTicketInput): Promise<TicketDto> {
  const order = await getNextBacklogOrder();

  const [row] = await db
    .insert(tickets)
    .values({
      title: input.title,
      description: input.description,
      priority: input.priority,
      status: 'Backlog',
      order,
      startedAt: input.startedAt ? new Date(input.startedAt) : undefined,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
    })
    .returning();

  return toTicketDto(row);
}

export async function listTickets(): Promise<TicketDto[]> {
  const rows = await db.select().from(tickets).orderBy(tickets.order);
  return rows.map(toTicketDto);
}
