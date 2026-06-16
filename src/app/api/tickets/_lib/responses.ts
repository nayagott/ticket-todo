import { NextResponse } from 'next/server';
import type { ZodError } from 'zod';

export function validationErrorResponse(error: ZodError) {
  return NextResponse.json(
    { error: 'Validation failed', details: error.flatten().fieldErrors },
    { status: 400 },
  );
}

export function notFoundResponse() {
  return NextResponse.json({ error: 'Ticket not found', details: {} }, { status: 404 });
}

export function internalErrorResponse(error: unknown) {
  console.error(error);
  return NextResponse.json({ error: 'Internal server error', details: {} }, { status: 500 });
}
