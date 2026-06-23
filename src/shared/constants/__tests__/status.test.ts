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

  it('TC-UTIL-001: diffDays=-1 (기한 초과) → border-[#FF5630] (DS §1.2 Highlight Red)', () => {
    expect(getDeadlineStyle('2026-06-21T00:00:00.000Z', 'TODO')).toBe('border-[#FF5630]');
  });

  it('TC-UTIL-002: diffDays=0 (당일) → border-[#FFAB00] (DS §1.2 Highlight Orange)', () => {
    expect(getDeadlineStyle('2026-06-22T00:00:00.000Z', 'TODO')).toBe('border-[#FFAB00]');
  });

  it('TC-UTIL-003: diffDays=3 (D-3) → border-[#FFAB00] (경계값)', () => {
    expect(getDeadlineStyle('2026-06-25T00:00:00.000Z', 'TODO')).toBe('border-[#FFAB00]');
  });

  it('TC-UTIL-004: diffDays=4 (D-4) → border-[#DFE1E6] (경계값)', () => {
    expect(getDeadlineStyle('2026-06-26T00:00:00.000Z', 'TODO')).toBe('border-[#DFE1E6]');
  });

  it('TC-UTIL-005: dueDate=null → border-[#DFE1E6]', () => {
    expect(getDeadlineStyle(null, 'TODO')).toBe('border-[#DFE1E6]');
  });

  it('TC-UTIL-006: status=Done, 기한 초과 → border-[#DFE1E6]', () => {
    expect(getDeadlineStyle('2026-06-21T00:00:00.000Z', 'Done')).toBe('border-[#DFE1E6]');
  });
});
