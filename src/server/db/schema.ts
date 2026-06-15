import { pgTable, varchar, text, integer, pgEnum, uuid, date, timestamp } from 'drizzle-orm/pg-core';

export const statusEnum   = pgEnum('status',   ['Backlog', 'TODO', 'In Progress', 'Done']);
export const priorityEnum = pgEnum('priority', ['Low', 'Medium', 'High']);

export const tickets = pgTable('tickets', {
  id:          uuid('id').defaultRandom().primaryKey(),
  title:       varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status:      statusEnum('status').notNull().default('Backlog'),
  priority:    priorityEnum('priority'),
  order:       integer('order').notNull(),
  startedAt:   date('started_at'),
  dueDate:     date('due_date'),
  createdAt:   timestamp('created_at').notNull().defaultNow(),
  updatedAt:   timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Ticket    = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;
