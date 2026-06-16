import { NextRequest, NextResponse } from 'next/server';
import { updateTicketSchema } from '@/shared/schemas/ticketSchema';
import { deleteTicket, getTicketById, updateTicket } from '@/server/services/ticketService';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  try {
    const ticket = await getTicketById(id);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found', details: {} }, { status: 404 });
    }
    return NextResponse.json(ticket, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error', details: {} }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json();
  const parsed = updateTicketSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const ticket = await updateTicket(id, parsed.data);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found', details: {} }, { status: 404 });
    }
    return NextResponse.json(ticket, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error', details: {} }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  try {
    const deleted = await deleteTicket(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Ticket not found', details: {} }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error', details: {} }, { status: 500 });
  }
}
