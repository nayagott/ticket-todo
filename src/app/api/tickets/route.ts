import { NextRequest, NextResponse } from 'next/server';
import { createTicketSchema } from '@/shared/schemas/ticketSchema';
import { createTicket, listTickets } from '@/server/services/ticketService';

export async function GET() {
  try {
    const ticketList = await listTickets();
    return NextResponse.json(ticketList, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error', details: {} }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createTicketSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const ticket = await createTicket(parsed.data);
    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error', details: {} }, { status: 500 });
  }
}
