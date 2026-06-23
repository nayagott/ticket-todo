import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterBar } from '../FilterBar';

const defaultFilter = { overdue: false, thisWeek: false };
const noop = jest.fn();

function renderFilterBar(filter = defaultFilter, onFilterChange = noop, onClearFilter = noop) {
  return render(
    <FilterBar filter={filter} onFilterChange={onFilterChange} onClearFilter={onClearFilter} />,
  );
}

describe('FilterBar', () => {
  it('"전체 업무" 버튼 렌더링', () => {
    renderFilterBar();
    expect(screen.getByRole('button', { name: '전체 업무' })).toBeInTheDocument();
  });

  it('"이번주 업무" 버튼 렌더링', () => {
    renderFilterBar();
    expect(screen.getByRole('button', { name: '이번주 업무' })).toBeInTheDocument();
  });

  it('"일정이 초과된 업무" 버튼 렌더링', () => {
    renderFilterBar();
    expect(screen.getByRole('button', { name: '일정이 초과된 업무' })).toBeInTheDocument();
  });

  it('세 버튼 모두 <button> 태그 (NFR-011)', () => {
    renderFilterBar();
    screen.getAllByRole('button').forEach(btn => {
      expect(btn.tagName).toBe('BUTTON');
    });
  });

  it('필터 없을 때 "전체 업무" active', () => {
    renderFilterBar({ overdue: false, thisWeek: false });
    expect(screen.getByRole('button', { name: '전체 업무' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('필터 활성 중에는 "전체 업무" inactive', () => {
    renderFilterBar({ overdue: false, thisWeek: true });
    expect(screen.getByRole('button', { name: '전체 업무' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('"전체 업무" 클릭 → onClearFilter 호출', async () => {
    const onClearFilter = jest.fn();
    renderFilterBar(defaultFilter, noop, onClearFilter);
    await userEvent.click(screen.getByRole('button', { name: '전체 업무' }));
    expect(onClearFilter).toHaveBeenCalledTimes(1);
  });

  it('thisWeek=false → aria-pressed="false"', () => {
    renderFilterBar({ ...defaultFilter, thisWeek: false });
    expect(screen.getByRole('button', { name: '이번주 업무' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('thisWeek=true → aria-pressed="true" (NFR-008, NFR-011)', () => {
    renderFilterBar({ ...defaultFilter, thisWeek: true });
    expect(screen.getByRole('button', { name: '이번주 업무' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('overdue=false → aria-pressed="false"', () => {
    renderFilterBar({ ...defaultFilter, overdue: false });
    expect(screen.getByRole('button', { name: '일정이 초과된 업무' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('overdue=true → aria-pressed="true"', () => {
    renderFilterBar({ ...defaultFilter, overdue: true });
    expect(screen.getByRole('button', { name: '일정이 초과된 업무' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('"이번주 업무" 클릭 → onFilterChange("thisWeek") 호출', async () => {
    const onFilterChange = jest.fn();
    renderFilterBar(defaultFilter, onFilterChange);
    await userEvent.click(screen.getByRole('button', { name: '이번주 업무' }));
    expect(onFilterChange).toHaveBeenCalledWith('thisWeek');
  });

  it('"일정이 초과된 업무" 클릭 → onFilterChange("overdue") 호출', async () => {
    const onFilterChange = jest.fn();
    renderFilterBar(defaultFilter, onFilterChange);
    await userEvent.click(screen.getByRole('button', { name: '일정이 초과된 업무' }));
    expect(onFilterChange).toHaveBeenCalledWith('overdue');
  });

  it('활성 thisWeek 버튼에 강조 클래스 존재 (DS §1.2 Medium bg)', () => {
    renderFilterBar({ ...defaultFilter, thisWeek: true });
    expect(screen.getByRole('button', { name: '이번주 업무' })).toHaveClass('bg-[#DEEBFF]');
  });

  it('비활성 thisWeek 버튼에 강조 클래스 없음', () => {
    renderFilterBar({ ...defaultFilter, thisWeek: false });
    expect(screen.getByRole('button', { name: '이번주 업무' })).not.toHaveClass('bg-[#DEEBFF]');
  });

  it('두 버튼 동시 활성 가능 (독립 토글, PRD §4-3)', () => {
    renderFilterBar({ overdue: true, thisWeek: true });
    expect(screen.getByRole('button', { name: '이번주 업무' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '일정이 초과된 업무' })).toHaveAttribute('aria-pressed', 'true');
  });
});
