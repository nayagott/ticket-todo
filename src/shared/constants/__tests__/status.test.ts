import { getDeadlineStyle } from '../status';

const FAKE_NOW = '2026-06-22T00:00:00.000Z'; // 월요일 기준

describe('getDeadlineStyle', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(FAKE_NOW));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('TC-UTIL-001: diffDays=-1 (기한 초과) → border-red-500', () => {
    expect(getDeadlineStyle('2026-06-21T00:00:00.000Z', 'TODO')).toBe('border-red-500');
  });

  it('TC-UTIL-002: diffDays=0 (당일) → border-orange-400', () => {
    expect(getDeadlineStyle('2026-06-22T00:00:00.000Z', 'TODO')).toBe('border-orange-400');
  });

  it('TC-UTIL-003: diffDays=3 (D-3) → border-orange-400 (경계값)', () => {
    expect(getDeadlineStyle('2026-06-25T00:00:00.000Z', 'TODO')).toBe('border-orange-400');
  });

  it('TC-UTIL-004: diffDays=4 (D-4) → border-gray-200 (경계값)', () => {
    expect(getDeadlineStyle('2026-06-26T00:00:00.000Z', 'TODO')).toBe('border-gray-200');
  });

  it('TC-UTIL-005: dueDate=null → border-gray-200', () => {
    expect(getDeadlineStyle(null, 'TODO')).toBe('border-gray-200');
  });

  it('TC-UTIL-006: status=Done, 기한 초과 → border-gray-200', () => {
    expect(getDeadlineStyle('2026-06-21T00:00:00.000Z', 'Done')).toBe('border-gray-200');
  });
});
