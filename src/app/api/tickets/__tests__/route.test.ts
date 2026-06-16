/**
 * @jest-environment node
 */
import { testApiHandler } from 'next-test-api-route-handler'; // 반드시 첫 import

import * as appHandler from '@/app/api/tickets/route';
import { db, pool } from '@/server/db';
import { tickets } from '@/server/db/schema';

async function postTicket(body: unknown) {
  let status = 0;
  let json: Record<string, unknown> = {};
  await testApiHandler({
    appHandler,
    test: async ({ fetch }) => {
      const res = await fetch({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      status = res.status;
      json = await res.json();
    },
  });
  return { status, json };
}

beforeEach(async () => {
  await db.execute(`TRUNCATE TABLE tickets RESTART IDENTITY`);
});

afterAll(async () => {
  await pool.end();
});

describe('POST /api/tickets', () => {
  it('TC-API-004: 필수 필드만으로 티켓 생성 — Backlog 비어있음', async () => {
    const { status, json } = await postTicket({ title: '테스트' });

    expect(status).toBe(201);
    expect(json.status).toBe('Backlog');
    expect(json.order).toBe(1000);
    expect(json.title).toBe('테스트');
    expect(json.description).toBeNull();
    expect(json.priority).toBeNull();
    expect(typeof json.id).toBe('string');
  });

  it('TC-API-005: 전체 필드 입력 티켓 생성 — Backlog 1건 존재(order:1000)', async () => {
    await db.insert(tickets).values({ title: 'existing', status: 'Backlog', order: 1000 });

    const { status, json } = await postTicket({
      title: 'API 문서 초안 작성',
      description: 'OpenAPI 스펙 기반 Swagger 문서 초안',
      priority: 'Medium',
      startedAt: '2026-06-15T00:00:00.000Z',
      dueDate: '2026-06-22T00:00:00.000Z',
    });

    expect(status).toBe(201);
    expect(json.order).toBe(2000);
    expect(json.title).toBe('API 문서 초안 작성');
    expect(json.description).toBe('OpenAPI 스펙 기반 Swagger 문서 초안');
    expect(json.priority).toBe('Medium');
    expect(json.startedAt).toBe('2026-06-15T00:00:00.000Z');
    expect(json.dueDate).toBe('2026-06-22T00:00:00.000Z');
    expect(json.status).toBe('Backlog');
  });

  it('TC-API-006: title 누락 → 400', async () => {
    const { status, json } = await postTicket({});

    expect(status).toBe(400);
    expect(json.error).toBe('Validation failed');
    expect((json.details as Record<string, unknown>).title).toBeDefined();
  });

  it('TC-API-007: title 빈 문자열 → 400', async () => {
    const { status, json } = await postTicket({ title: '' });

    expect(status).toBe(400);
    expect((json.details as Record<string, unknown>).title).toBeDefined();
  });

  it('TC-API-008: title 255자 → 201 (경계값)', async () => {
    const { status, json } = await postTicket({ title: 'A'.repeat(255) });

    expect(status).toBe(201);
    expect(json.title).toHaveLength(255);
  });

  it('TC-API-009: title 256자 → 400 (경계값)', async () => {
    const { status, json } = await postTicket({ title: 'A'.repeat(256) });

    expect(status).toBe(400);
    expect((json.details as Record<string, unknown>).title).toBeDefined();
  });

  it('TC-API-010: 허용값 외 priority → 400', async () => {
    const { status, json } = await postTicket({ title: 'T', priority: 'Critical' });

    expect(status).toBe(400);
    expect((json.details as Record<string, unknown>).priority).toBeDefined();
  });

  it('TC-API-011: 잘못된 dueDate 형식 → 400', async () => {
    const { status, json } = await postTicket({ title: 'T', dueDate: '2026/06/15' });

    expect(status).toBe(400);
    expect((json.details as Record<string, unknown>).dueDate).toBeDefined();
  });

  it('TC-API-012: order 자동 계산 — 최초 삽입', async () => {
    const { status, json } = await postTicket({ title: 'T' });

    expect(status).toBe(201);
    expect(json.order).toBe(1000);
  });

  it('TC-API-013: order 자동 계산 — 기존 MAX+1000', async () => {
    await db.insert(tickets).values({ title: 'existing', status: 'Backlog', order: 3000 });

    const { status, json } = await postTicket({ title: 'T' });

    expect(status).toBe(201);
    expect(json.order).toBe(4000);
  });

  it('TC-API-014: DB 오류 시 500 및 콘솔 로깅', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const insertSpy = jest.spyOn(db, 'insert').mockImplementation(() => {
      throw new Error('simulated DB insert failure');
    });

    const { status, json } = await postTicket({ title: 'T' });

    expect(status).toBe(500);
    expect(json).toEqual({ error: 'Internal server error', details: {} });
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

    insertSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});

async function getTickets() {
  let status = 0;
  let json: unknown;
  await testApiHandler({
    appHandler,
    test: async ({ fetch }) => {
      const res = await fetch({ method: 'GET' });
      status = res.status;
      json = await res.json();
    },
  });
  return { status, json };
}

describe('GET /api/tickets', () => {
  it('TC-API-001: 전체 목록 정상 조회 — order 오름차순', async () => {
    await db.insert(tickets).values([
      { title: 'second', status: 'Backlog', order: 2000 },
      { title: 'first', status: 'Backlog', order: 1000 },
    ]);

    const { status, json } = await getTickets();

    expect(status).toBe(200);
    const list = json as Array<Record<string, unknown>>;
    expect(list).toHaveLength(2);
    expect(list[0].title).toBe('first');
    expect(list[0].order).toBe(1000);
    expect(list[1].title).toBe('second');
    expect(list[1].order).toBe(2000);
  });

  it('TC-API-002: 티켓 없을 때 빈 배열 반환', async () => {
    const { status, json } = await getTickets();

    expect(status).toBe(200);
    expect(json).toEqual([]);
  });

  it('TC-API-003: DB 오류 시 500 및 콘솔 로깅', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const selectSpy = jest.spyOn(db, 'select').mockImplementation(() => {
      throw new Error('simulated DB select failure');
    });

    const { status, json } = await getTickets();

    expect(status).toBe(500);
    expect(json).toEqual({ error: 'Internal server error', details: {} });
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

    selectSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});
