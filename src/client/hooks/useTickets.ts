'use client';

import { useEffect, useState } from 'react';
import { ticketApi } from '@/client/api/ticketApi';
import type { ColumnStatus } from '@/shared/constants/status';
import type { TicketDto } from '@/shared/types/ticket';

type UseTicketsReturn = {
  tickets: TicketDto[];
  isLoading: boolean;
  error: string | null;
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

  async function moveTicket(id: string, status: ColumnStatus, order: number) {
    const updated = await ticketApi.update(id, { status, order });
    setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }

  return { tickets, isLoading, error, moveTicket };
}
