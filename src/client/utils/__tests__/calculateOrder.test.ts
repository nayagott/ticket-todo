import { calculateOrder } from '../calculateOrder';

describe('calculateOrder (FR-008, NFR-015)', () => {
  it('TC-HOOK-011 시나리오: 카드 사이 삽입 — 중간값 계산 (prevOrder=1000, nextOrder=3000 → 2000)', () => {
    expect(calculateOrder(1000, 3000)).toEqual({ kind: 'order', order: 2000 });
  });

  it('칼럼 최하단 삽입 — prevOrder + 1000', () => {
    expect(calculateOrder(2000, null)).toEqual({ kind: 'order', order: 3000 });
  });

  it('TC-HOOK-013 시나리오: 인접 order 차이 ≤ 1 → 재정규화 신호 (충돌 감지)', () => {
    expect(calculateOrder(1000, 1001)).toEqual({ kind: 'renormalize' });
  });

  it('차이가 정확히 2 — 재정규화 없이 중간값 계산', () => {
    expect(calculateOrder(1000, 1002)).toEqual({ kind: 'order', order: 1001 });
  });
});
