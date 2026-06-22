'use client';

import { useEffect, useState } from 'react';
import { ticketApi } from '@/client/api/ticketApi';
import type { ColumnStatus } from '@/shared/constants/status';
import type { CreateTicketInput, UpdateTicketInput } from '@/shared/schemas/ticketSchema';
import type { TicketDto } from '@/shared/types/ticket';

type UseTicketsReturn = {
  tickets: TicketDto[];
  isLoading: boolean;
  error: string | null;
  createTicket: (input: CreateTicketInput) => Promise<TicketDto>;
  appendTicket: (ticket: TicketDto) => void;
  replaceTicket: (ticket: TicketDto) => void;
  removeTicket: (id: string) => void;
  updateTicket: (id: string, input: UpdateTicketInput) => Promise<TicketDto>;
  deleteTicket: (id: string) => Promise<void>;
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

  function replaceTicket(ticket: TicketDto) {
    setTickets((prev) => prev.map((t) => (t.id === ticket.id ? ticket : t)));
  }

  function removeTicket(id: string) {
    setTickets((prev) => prev.filter((t) => t.id !== id));
  }

  async function updateTicket(id: string, input: UpdateTicketInput): Promise<TicketDto> {
    const updated = await ticketApi.update(id, input);
    setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return updated;
  }

  async function deleteTicket(id: string): Promise<void> {
    await ticketApi.delete(id);
    setTickets((prev) => prev.filter((t) => t.id !== id));
  }

  async function moveTicket(id: string, status: ColumnStatus, order: number) {
    const snapshot = tickets;
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status, order } : t)));
    try {
      const updated = await ticketApi.update(id, { status, order });
      setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      setTickets(snapshot);
      throw err;
    }
  }

  return {
    tickets,
    isLoading,
    error,
    createTicket,
    appendTicket,
    replaceTicket,
    removeTicket,
    updateTicket,
    deleteTicket,
    moveTicket,
  };
}
