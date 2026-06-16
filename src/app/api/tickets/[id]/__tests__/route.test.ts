/**
 * @jest-environment node
 */
import { testApiHandler } from 'next-test-api-route-handler'; // 반드시 첫 import

import { eq } from 'drizzle-orm';
import * as appHandler from '@/app/api/tickets/[id]/route';
import { db, pool } from '@/server/db';
import { tickets } from '@/server/db/schema';

async function insertTicket(overrides: Partial<typeof tickets.$inferInsert> = {}) {
  const [row] = await db
    .insert(tickets)
    .values({ title: '기본 티켓', status: 'Backlog', order: 1000, ...overrides })
    .returning();
  return row;
}

async function getTicket(id: string) {
  let status = 0;
  let json: Record<string, unknown> = {};
  await testApiHandler({
    appHandler,
    params: { id },
    test: async ({ fetch }) => {
      const res = await fetch({ method: 'GET' });
      status = res.status;
      json = await res.json();
    },
  });
  return { status, json };
}

async function patchTicket(id: string, body: unknown) {
  let status = 0;
  let json: Record<string, unknown> = {};
  await testApiHandler({
    appHandler,
    params: { id },
    test: async ({ fetch }) => {
      const res = await fetch({
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      status = res.status;
      json = await res.json();
    },
  });
  return { status, json };
}

async function deleteTicket(id: string) {
  let status = 0;
  let body = '';
  await testApiHandler({
    appHandler,
    params: { id },
    test: async ({ fetch }) => {
      const res = await fetch({ method: 'DELETE' });
      status = res.status;
      body = await res.text();
    },
  });
  return { status, body, json: body ? (JSON.parse(body) as Record<string, unknown>) : {} };
}

beforeEach(async () => {
  await db.execute(`TRUNCATE TABLE tickets RESTART IDENTITY`);
});

afterAll(async () => {
  await pool.end();
});

describe('GET /api/tickets/:id', () => {
  it('TC-API-015: 단건 조회 정상', async () => {
    const ticket = await insertTicket({ title: '결제 모듈 버그 수정', priority: 'High' });

    const { status, json } = await getTicket(ticket.id);

    expect(status).toBe(200);
    expect(json.id).toBe(ticket.id);
    expect(json.title).toBe('결제 모듈 버그 수정');
    expect(json.priority).toBe('High');
  });

  it('TC-API-016: 미존재 id → 404', async () => {
    const { status, json } = await getTicket(crypto.randomUUID());

    expect(status).toBe(404);
    expect(json).toEqual({ error: 'Ticket not found', details: {} });
  });

  it('TC-API-017: DB 오류 → 500 및 콘솔 로깅', async () => {
    const ticket = await insertTicket();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const selectSpy = jest.spyOn(db, 'select').mockImplementation(() => {
      throw new Error('simulated DB select failure');
    });

    const { status, json } = await getTicket(ticket.id);

    expect(status).toBe(500);
    expect(json).toEqual({ error: 'Internal server error', details: {} });
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

    selectSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});

describe('PATCH /api/tickets/:id', () => {
  it('TC-API-018: 필드 수정 — 전달된 필드만 변경', async () => {
    const ticket = await insertTicket({ title: 'Old', priority: 'Low', description: '기존 설명' });

    const { status, json } = await patchTicket(ticket.id, { title: 'New', priority: 'High' });

    expect(status).toBe(200);
    expect(json.title).toBe('New');
    expect(json.priority).toBe('High');
    expect(json.description).toBe('기존 설명');
    expect(json.status).toBe('Backlog');
  });

  it('TC-API-019: status 변경 (칼럼 이동)', async () => {
    const ticket = await insertTicket({ status: 'Backlog' });

    const { status, json } = await patchTicket(ticket.id, { status: 'TODO', order: 1500 });

    expect(status).toBe(200);
    expect(json.status).toBe('TODO');
    expect(json.order).toBe(1500);
  });

  it('TC-API-020: order 단독 변경 (칼럼 내 순서)', async () => {
    const ticket = await insertTicket({ status: 'TODO', order: 1000 });

    const { status, json } = await patchTicket(ticket.id, { order: 2500 });

    expect(status).toBe(200);
    expect(json.order).toBe(2500);
    expect(json.status).toBe('TODO');
  });

  it('TC-API-021: description null 전달 → 필드 삭제', async () => {
    const ticket = await insertTicket({ description: '삭제될 설명' });

    const { status, json } = await patchTicket(ticket.id, { description: null });

    expect(status).toBe(200);
    expect(json.description).toBeNull();
  });

  it('TC-API-022: title 빈 문자열 → 400', async () => {
    const ticket = await insertTicket();

    const { status, json } = await patchTicket(ticket.id, { title: '' });

    expect(status).toBe(400);
    expect((json.details as Record<string, unknown>).title).toBeDefined();
  });

  it('TC-API-023: 허용값 외 status → 400', async () => {
    const ticket = await insertTicket();

    const { status, json } = await patchTicket(ticket.id, { status: 'Pending' });

    expect(status).toBe(400);
    expect((json.details as Record<string, unknown>).status).toBeDefined();
  });

  it('TC-API-024: order 소수점 → 400', async () => {
    const ticket = await insertTicket();

    const { status, json } = await patchTicket(ticket.id, { order: 1500.5 });

    expect(status).toBe(400);
    expect((json.details as Record<string, unknown>).order).toBeDefined();
  });

  it('TC-API-025: 미존재 id → 404', async () => {
    const { status, json } = await patchTicket(crypto.randomUUID(), { title: 'T' });

    expect(status).toBe(404);
    expect(json).toEqual({ error: 'Ticket not found', details: {} });
  });

  it('TC-API-026: DB 오류 → 500 및 콘솔 로깅', async () => {
    const ticket = await insertTicket();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const updateSpy = jest.spyOn(db, 'update').mockImplementation(() => {
      throw new Error('simulated DB update failure');
    });

    const { status, json } = await patchTicket(ticket.id, { title: 'T' });

    expect(status).toBe(500);
    expect(json).toEqual({ error: 'Internal server error', details: {} });
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

    updateSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});

describe('DELETE /api/tickets/:id', () => {
  it('TC-API-027: 티켓 정상 삭제', async () => {
    const ticket = await insertTicket();

    const { status, body } = await deleteTicket(ticket.id);

    expect(status).toBe(204);
    expect(body).toBe('');

    const remaining = await db.select().from(tickets).where(eq(tickets.id, ticket.id));
    expect(remaining).toHaveLength(0);
  });

  it('TC-API-028: 미존재 id → 404', async () => {
    const { status, json } = await deleteTicket(crypto.randomUUID());

    expect(status).toBe(404);
    expect(json).toEqual({ error: 'Ticket not found', details: {} });
  });

  it('TC-API-029: DB 오류 → 500 및 콘솔 로깅', async () => {
    const ticket = await insertTicket();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const deleteSpy = jest.spyOn(db, 'delete').mockImplementation(() => {
      throw new Error('simulated DB delete failure');
    });

    const { status } = await deleteTicket(ticket.id);

    expect(status).toBe(500);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

    deleteSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});
