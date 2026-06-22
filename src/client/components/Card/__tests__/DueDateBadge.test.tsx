import { render, screen } from '@testing-library/react';
import { DueDateBadge } from '../DueDateBadge';

describe('DueDateBadge', () => {
  it('"2026-06-22T00:00:00.000Z" → "6월 22일" 형식 렌더링', () => {
    render(<DueDateBadge dueDate="2026-06-22T00:00:00.000Z" />);
    expect(screen.getByText('6월 22일')).toBeInTheDocument();
  });

  it('한 자리 월 (1월) + 한 자리 일 (5일) → "1월 5일"', () => {
    render(<DueDateBadge dueDate="2026-01-05T00:00:00.000Z" />);
    expect(screen.getByText('1월 5일')).toBeInTheDocument();
  });

  it('유효하지 않은 날짜 문자열 → "-" 렌더링, 크래시 없음', () => {
    render(<DueDateBadge dueDate="invalid-date" />);
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('12월 31일 → "12월 31일"', () => {
    render(<DueDateBadge dueDate="2026-12-31T00:00:00.000Z" />);
    expect(screen.getByText('12월 31일')).toBeInTheDocument();
  });
});
