import { NextRequest, NextResponse } from 'next/server';
import { createTicketSchema } from '@/shared/schemas/ticketSchema';
import { createTicket, listTickets } from '@/server/services/ticketService';
import { internalErrorResponse, validationErrorResponse } from './_lib/responses';

export async function GET() {
  try {
    const ticketList = await listTickets();
    return NextResponse.json(ticketList, { status: 200 });
  } catch (error) {
    return internalErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createTicketSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const ticket = await createTicket(parsed.data);
    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    return internalErrorResponse(error);
  }
}
