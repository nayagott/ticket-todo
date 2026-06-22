import { applyFilter, isOverdue, isThisWeek, type FilterState } from '../filter';
import type { TicketDto } from '@/shared/types/ticket';

const NOW = new Date().toISOString();

function d(offsetDays: number): string {
  const dt = new Date();
  dt.setDate(dt.getDate() + offsetDays);
  dt.setHours(0, 0, 0, 0);
  return dt.toISOString();
}

function ticket(overrides: Partial<TicketDto> = {}): TicketDto {
  return {
    id: 'x', title: 'T', description: null, status: 'TODO',
    priority: null, order: 1000, startedAt: null, dueDate: null,
    createdAt: NOW, updatedAt: NOW,
    ...overrides,
  };
}

const noFilter: FilterState = { overdue: false, thisWeek: false };

// ── applyFilter ────────────────────────────────────────────────────
describe('applyFilter', () => {
  it('둘 다 false → 전체 반환', () => {
    const tickets = [ticket({ id: '1' }), ticket({ id: '2' })];
    expect(applyFilter(tickets, noFilter)).toEqual(tickets);
  });

  it('overdue만 활성 → 초과 티켓만', () => {
    const tickets = [
      ticket({ id: 'ok',      dueDate: d(5),  status: 'TODO' }),
      ticket({ id: 'over',    dueDate: d(-1), status: 'TODO' }),
    ];
    const result = applyFilter(tickets, { overdue: true, thisWeek: false });
    expect(result.map(t => t.id)).toEqual(['over']);
  });

  it('thisWeek만 활성 → 이번주 마감 티켓만', () => {
    const tickets = [
      ticket({ id: 'this',  dueDate: d(1),  status: 'TODO' }),
      ticket({ id: 'far',   dueDate: d(14), status: 'TODO' }),
    ];
    const result = applyFilter(tickets, { overdue: false, thisWeek: true });
    expect(result.map(t => t.id)).toEqual(['this']);
  });

  it('둘 다 활성 → OR 조건 (하나라도 해당하면 포함)', () => {
    const tickets = [
      ticket({ id: 'over', dueDate: d(-1), status: 'TODO' }),
      ticket({ id: 'this', dueDate: d(2),  status: 'TODO' }),
      ticket({ id: 'none', dueDate: d(20), status: 'TODO' }),
    ];
    const result = applyFilter(tickets, { overdue: true, thisWeek: true });
    const ids = result.map(t => t.id);
    expect(ids).toContain('over');
    expect(ids).toContain('this');
    expect(ids).not.toContain('none');
  });
});

// ── isOverdue ──────────────────────────────────────────────────────
describe('isOverdue', () => {
  it('dueDate 없음 → false', () => {
    expect(isOverdue(ticket({ dueDate: null }))).toBe(false);
  });

  it('status === "Done" → false (완료 티켓 제외)', () => {
    expect(isOverdue(ticket({ dueDate: d(-1), status: 'Done' }))).toBe(false);
  });

  it('dueDate < 오늘 → true', () => {
    expect(isOverdue(ticket({ dueDate: d(-1), status: 'TODO' }))).toBe(true);
  });

  it('dueDate === 오늘 00:00 → false (당일은 초과 아님)', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expect(isOverdue(ticket({ dueDate: today.toISOString(), status: 'TODO' }))).toBe(false);
  });
});

// ── isThisWeek ─────────────────────────────────────────────────────
describe('isThisWeek', () => {
  it('dueDate 없음 → false', () => {
    expect(isThisWeek(ticket({ dueDate: null }))).toBe(false);
  });

  it('이번 주 안 날짜 → true', () => {
    // d(1) ~ d(3) 중 이번 주에 속하는 날짜 사용
    // 이번 주 월~일 계산
    const mon = new Date();
    mon.setHours(0, 0, 0, 0);
    mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7)); // 이번 주 월요일
    const mid = new Date(mon);
    mid.setDate(mon.getDate() + 3); // 목요일
    expect(isThisWeek(ticket({ dueDate: mid.toISOString() }))).toBe(true);
  });

  it('지난 주 → false', () => {
    expect(isThisWeek(ticket({ dueDate: d(-8) }))).toBe(false);
  });

  it('다음 주 → false', () => {
    expect(isThisWeek(ticket({ dueDate: d(8) }))).toBe(false);
  });

  it('이번 주 월요일 00:00 (경계값) → true', () => {
    const mon = new Date();
    mon.setHours(0, 0, 0, 0);
    mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
    expect(isThisWeek(ticket({ dueDate: mon.toISOString() }))).toBe(true);
  });

  it('이번 주 일요일 23:59 (경계값) → true', () => {
    const sun = new Date();
    sun.setHours(0, 0, 0, 0);
    sun.setDate(sun.getDate() - ((sun.getDay() + 6) % 7) + 6);
    sun.setHours(23, 59, 59, 0);
    expect(isThisWeek(ticket({ dueDate: sun.toISOString() }))).toBe(true);
  });
});
