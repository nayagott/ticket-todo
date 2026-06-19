'use client';

import { useEffect, useState } from 'react';
import { ticketApi } from '@/client/api/ticketApi';
import type { ColumnStatus } from '@/shared/constants/status';
import type { CreateTicketInput } from '@/shared/schemas/ticketSchema';
import type { TicketDto } from '@/shared/types/ticket';

type UseTicketsReturn = {
  tickets: TicketDto[];
  isLoading: boolean;
  error: string | null;
  createTicket: (input: CreateTicketInput) => Promise<TicketDto>;
  appendTicket: (ticket: TicketDto) => void;
  moveTicket: (id: string, status: ColumnStatus, order: number) => Promise<void>;
};

export function useTickets(): UseTicketsReturn {
  const [tickets, setTickets] = useState<TicketDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ticketApi
      .getAll()
      .then(setTickets)
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  async function createTicket(input: CreateTicketInput): Promise<TicketDto> {
    const created = await ticketApi.create(input);
    setTickets((prev) => [...prev, created]);
    return created;
  }

  function appendTicket(ticket: TicketDto) {
    setTickets((prev) => [...prev, ticket]);
  }

  async function moveTicket(id: string, status: ColumnStatus, order: number) {
    const updated = await ticketApi.update(id, { status, order });
    setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }

  return { tickets, isLoading, error, createTicket, appendTicket, moveTicket };
}
