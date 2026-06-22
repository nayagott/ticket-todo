import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterBar } from '../FilterBar';

const defaultFilter = { overdue: false, thisWeek: false };

describe('FilterBar', () => {
  it('"이번주 업무" 버튼 렌더링', () => {
    render(<FilterBar filter={defaultFilter} onFilterChange={jest.fn()} />);
    expect(screen.getByRole('button', { name: '이번주 업무' })).toBeInTheDocument();
  });

  it('"일정이 초과된 업무" 버튼 렌더링', () => {
    render(<FilterBar filter={defaultFilter} onFilterChange={jest.fn()} />);
    expect(screen.getByRole('button', { name: '일정이 초과된 업무' })).toBeInTheDocument();
  });

  it('두 버튼 모두 <button> 태그 (NFR-011)', () => {
    render(<FilterBar filter={defaultFilter} onFilterChange={jest.fn()} />);
    screen.getAllByRole('button').forEach(btn => {
      expect(btn.tagName).toBe('BUTTON');
    });
  });

  it('thisWeek=false → aria-pressed="false"', () => {
    render(<FilterBar filter={{ ...defaultFilter, thisWeek: false }} onFilterChange={jest.fn()} />);
    expect(screen.getByRole('button', { name: '이번주 업무' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('thisWeek=true → aria-pressed="true" (NFR-008, NFR-011)', () => {
    render(<FilterBar filter={{ ...defaultFilter, thisWeek: true }} onFilterChange={jest.fn()} />);
    expect(screen.getByRole('button', { name: '이번주 업무' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('overdue=false → aria-pressed="false"', () => {
    render(<FilterBar filter={{ ...defaultFilter, overdue: false }} onFilterChange={jest.fn()} />);
    expect(screen.getByRole('button', { name: '일정이 초과된 업무' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('overdue=true → aria-pressed="true"', () => {
    render(<FilterBar filter={{ ...defaultFilter, overdue: true }} onFilterChange={jest.fn()} />);
    expect(screen.getByRole('button', { name: '일정이 초과된 업무' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('"이번주 업무" 클릭 → onFilterChange("thisWeek") 호출', async () => {
    const onFilterChange = jest.fn();
    render(<FilterBar filter={defaultFilter} onFilterChange={onFilterChange} />);
    await userEvent.click(screen.getByRole('button', { name: '이번주 업무' }));
    expect(onFilterChange).toHaveBeenCalledWith('thisWeek');
  });

  it('"일정이 초과된 업무" 클릭 → onFilterChange("overdue") 호출', async () => {
    const onFilterChange = jest.fn();
    render(<FilterBar filter={defaultFilter} onFilterChange={onFilterChange} />);
    await userEvent.click(screen.getByRole('button', { name: '일정이 초과된 업무' }));
    expect(onFilterChange).toHaveBeenCalledWith('overdue');
  });

  it('활성 thisWeek 버튼에 강조 클래스 존재', () => {
    render(<FilterBar filter={{ ...defaultFilter, thisWeek: true }} onFilterChange={jest.fn()} />);
    expect(screen.getByRole('button', { name: '이번주 업무' })).toHaveClass('bg-blue-50');
  });

  it('비활성 thisWeek 버튼에 강조 클래스 없음', () => {
    render(<FilterBar filter={{ ...defaultFilter, thisWeek: false }} onFilterChange={jest.fn()} />);
    expect(screen.getByRole('button', { name: '이번주 업무' })).not.toHaveClass('bg-blue-50');
  });

  it('두 버튼 동시 활성 가능 (독립 토글, PRD §4-3)', () => {
    render(<FilterBar filter={{ overdue: true, thisWeek: true }} onFilterChange={jest.fn()} />);
    expect(screen.getByRole('button', { name: '이번주 업무' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '일정이 초과된 업무' })).toHaveAttribute('aria-pressed', 'true');
  });
});
