const ORDER_GAP = 1000;
const ORDER_CONFLICT_THRESHOLD = 1; // 인접 order 차이 ≤ 1 → 재정규화 (NFR-015)

export type OrderCalculation = { kind: 'order'; order: number } | { kind: 'renormalize' };

/**
 * 칼럼 내 삽입 위치의 order 값을 계산한다 (NFR-015).
 * prevOrder: 삽입 위치 바로 위 티켓의 order (없으면 null — 미지원, 최하단 삽입만 처리)
 * nextOrder: 삽입 위치 바로 아래 티켓의 order (없으면 null → 최하단 삽입)
 */
export function calculateOrder(prevOrder: number, nextOrder: number | null): OrderCalculation {
  if (nextOrder === null) {
    return { kind: 'order', order: prevOrder + ORDER_GAP };
  }
  if (nextOrder - prevOrder <= ORDER_CONFLICT_THRESHOLD) {
    return { kind: 'renormalize' };
  }
  return { kind: 'order', order: Math.floor((prevOrder + nextOrder) / 2) };
}
