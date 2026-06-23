import { render, screen } from '@testing-library/react';
import { PriorityBadge } from '../PriorityBadge';

describe('PriorityBadge', () => {
  it('Low: 텍스트 렌더링 + DS §1.2 Low 색상 (bg-[#DFE1E6])', () => {
    render(<PriorityBadge priority="Low" />);
    const badge = screen.getByText('Low');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-[#DFE1E6]');
    expect(badge).toHaveClass('text-[#42526E]');
  });

  it('Medium: 텍스트 렌더링 + DS §1.2 Medium 색상 (bg-[#DEEBFF])', () => {
    render(<PriorityBadge priority="Medium" />);
    const badge = screen.getByText('Medium');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-[#DEEBFF]');
    expect(badge).toHaveClass('text-[#0747A6]');
  });

  it('High: 텍스트 렌더링 + DS §1.2 High 색상 (bg-[#FFEBE6])', () => {
    render(<PriorityBadge priority="High" />);
    const badge = screen.getByText('High');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-[#FFEBE6]');
    expect(badge).toHaveClass('text-[#BF2600]');
  });
});
