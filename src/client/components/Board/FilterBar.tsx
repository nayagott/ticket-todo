'use client';

type FilterState = {
  overdue:  boolean;
  thisWeek: boolean;
};

type FilterBarProps = {
  filter:         FilterState;
  onFilterChange: (key: keyof FilterState) => void;
  onClearFilter:  () => void;
};

type FilterButtonProps = {
  label:       string;
  active:      boolean;
  activeClass: string;
  onClick:     () => void;
};

function FilterButton({ label, active, activeClass, onClick }: FilterButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={[
        /* DS §3.1 Filter Pill: Surface White, border #DFE1E6, radius 16px+, Text Secondary */
        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-1',
        active
          ? activeClass
          : 'border-[#DFE1E6] bg-white text-[#5E6C84] hover:bg-[#F4F5F7] focus:ring-[#DFE1E6]',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

export function FilterBar({ filter, onFilterChange, onClearFilter }: FilterBarProps) {
  const isAll = !filter.overdue && !filter.thisWeek;

  return (
    <div
      className="flex items-center gap-2 border-b border-[#DFE1E6] bg-white px-4"
      style={{ height: 'var(--filterbar-h)' }}
    >
      <FilterButton
        label="전체 업무"
        active={isAll}
        activeClass="border-[#5E6C84] bg-[#F4F5F7] text-[#172B4D] focus:ring-[#5E6C84]"
        onClick={onClearFilter}
      />
      <FilterButton
        label="이번주 업무"
        active={filter.thisWeek}
        activeClass="border-[#0052CC] bg-[#DEEBFF] text-[#0747A6] focus:ring-[#0052CC]"
        onClick={() => onFilterChange('thisWeek')}
      />
      <FilterButton
        label="일정이 초과된 업무"
        active={filter.overdue}
        activeClass="border-[#FF5630] bg-[#FFEBE6] text-[#BF2600] focus:ring-[#FF5630]"
        onClick={() => onFilterChange('overdue')}
      />
    </div>
  );
}
