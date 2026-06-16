import { fireEvent } from '@testing-library/react';

type Rect = { left: number; top: number; width: number; height: number };

export function mockBoundingClientRect(element: Element, rect: Rect): void {
  const domRect: DOMRect = {
    ...rect,
    right: rect.left + rect.width,
    bottom: rect.top + rect.height,
    x: rect.left,
    y: rect.top,
    toJSON: () => rect,
  };
  jest.spyOn(element, 'getBoundingClientRect').mockReturnValue(domRect);
}

function center(rect: Rect) {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

/**
 * dnd-kit MouseSensor 기반 드래그를 jsdom에서 시뮬레이션한다.
 * MouseSensor는 활성화 제약이 없어 mousedown 즉시 드래그가 시작되고,
 * move/end 리스너는 document에 바인딩된다(MouseSensor 소스 확인).
 * 기본 collisionDetection(rectIntersection)은 getBoundingClientRect로 측정한
 * 사각형의 교차 영역으로 over를 결정하므로, source/target rect를 모킹해 둔다.
 */
export function dragAndDrop(source: Element, sourceRect: Rect, target: Element, targetRect: Rect): void {
  mockBoundingClientRect(source, sourceRect);
  mockBoundingClientRect(target, targetRect);

  const from = center(sourceRect);
  const to = center(targetRect);

  fireEvent.mouseDown(source, { clientX: from.x, clientY: from.y, button: 0 });
  fireEvent.mouseMove(document, { clientX: to.x, clientY: to.y });
  fireEvent.mouseUp(document);
}
