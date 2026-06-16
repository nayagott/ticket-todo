import { NextRequest, NextResponse } from 'next/server';
import { updateTicketSchema } from '@/shared/schemas/ticketSchema';
import { deleteTicket, getTicketById, updateTicket } from '@/server/services/ticketService';
import { internalErrorResponse, notFoundResponse, validationErrorResponse } from '../_lib/responses';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  try {
    const ticket = await getTicketById(id);
    if (!ticket) {
      return notFoundResponse();
    }
    return NextResponse.json(ticket, { status: 200 });
  } catch (error) {
    return internalErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateTicketSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const ticket = await updateTicket(id, parsed.data);
    if (!ticket) {
      return notFoundResponse();
    }
    return NextResponse.json(ticket, { status: 200 });
  } catch (error) {
    return internalErrorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  try {
    const deleted = await deleteTicket(id);
    if (!deleted) {
      return notFoundResponse();
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return internalErrorResponse(error);
  }
}
