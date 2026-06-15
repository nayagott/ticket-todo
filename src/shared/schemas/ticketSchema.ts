import { z } from 'zod';

export const TicketStatusEnum = z.enum(['Backlog', 'TODO', 'In Progress', 'Done']);
export const PriorityEnum     = z.enum(['Low', 'Medium', 'High']);

export const createTicketSchema = z.object({
  title:       z.string().min(1).max(255),
  description: z.string().optional(),
  priority:    PriorityEnum.optional(),
  startedAt:   z.string().date().optional(),
  dueDate:     z.string().date().optional(),
});

export const updateTicketSchema = z.object({
  title:       z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  priority:    PriorityEnum.optional(),
  status:      TicketStatusEnum.optional(),
  order:       z.number().int().optional(),
  startedAt:   z.string().date().optional().nullable(),
  dueDate:     z.string().date().optional().nullable(),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
