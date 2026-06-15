import {
  pgTable,
  varchar,
  text,
  integer,
  uuid,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

export const tickets = pgTable(
  'tickets',
  {
    id:          uuid('id').defaultRandom().primaryKey(),
    title:       varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    status:      varchar('status',   { length: 20 }).notNull().default('Backlog'),
    priority:    varchar('priority', { length: 10 }),
    order:       integer('order').notNull(),
    startedAt:   timestamp('started_at'),
    dueDate:     timestamp('due_date'),
    createdAt:   timestamp('created_at').notNull().defaultNow(),
    updatedAt:   timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_tickets_status_order').on(table.status, table.order),
    index('idx_tickets_due_date').on(table.dueDate),
  ],
);

export type TicketRow    = typeof tickets.$inferSelect;
export type NewTicketRow = typeof tickets.$inferInsert;
