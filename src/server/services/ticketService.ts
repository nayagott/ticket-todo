import { eq, max } from 'drizzle-orm';
import { db } from '@/server/db';
import { tickets } from '@/server/db/schema';
import type { ColumnStatus } from '@/shared/constants/status';
import type { CreateTicketInput, UpdateTicketInput } from '@/shared/schemas/ticketSchema';
import { toTicketDto, type TicketDto } from '@/shared/types/ticket';

const DEFAULT_CREATE_STATUS: ColumnStatus = 'Backlog'; // FR-001: 신규 티켓은 항상 Backlog로 생성

async function getNextBacklogOrder(): Promise<number> {
  const [{ maxOrder }] = await db
    .select({ maxOrder: max(tickets.order) })
    .from(tickets)
    .where(eq(tickets.status, DEFAULT_CREATE_STATUS));

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
      status: DEFAULT_CREATE_STATUS,
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

export async function getTicketById(id: string): Promise<TicketDto | null> {
  const [row] = await db.select().from(tickets).where(eq(tickets.id, id));
  return row ? toTicketDto(row) : null;
}

export async function updateTicket(
  id: string,
  input: UpdateTicketInput
): Promise<TicketDto | null> {
  const values: Partial<typeof tickets.$inferInsert> = {};

  if (input.title !== undefined) values.title = input.title;
  if (input.description !== undefined) values.description = input.description;
  if (input.priority !== undefined) values.priority = input.priority;
  if (input.status !== undefined) values.status = input.status;
  if (input.order !== undefined) values.order = input.order;
  if (input.startedAt !== undefined) {
    values.startedAt = input.startedAt ? new Date(input.startedAt) : null;
  }
  if (input.dueDate !== undefined) {
    values.dueDate = input.dueDate ? new Date(input.dueDate) : null;
  }

  const [row] = await db.update(tickets).set(values).where(eq(tickets.id, id)).returning();
  return row ? toTicketDto(row) : null;
}

export async function deleteTicket(id: string): Promise<boolean> {
  const deleted = await db.delete(tickets).where(eq(tickets.id, id)).returning({ id: tickets.id });
  return deleted.length > 0;
}
