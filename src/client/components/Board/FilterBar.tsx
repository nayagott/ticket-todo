'use client';

type FilterState = {
  overdue:  boolean;
  thisWeek: boolean;
};

type FilterBarProps = {
  filter:         FilterState;
  onFilterChange: (key: keyof FilterState) => void;
};

type FilterButtonProps = {
  label:     string;
  active:    boolean;
  activeClass: string;
  onClick:   () => void;
};

function FilterButton({ label, active, activeClass, onClick }: FilterButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={[
        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-1',
        active
          ? activeClass
          : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50 focus:ring-gray-300',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

export function FilterBar({ filter, onFilterChange }: FilterBarProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <FilterButton
        label="이번주 업무"
        active={filter.thisWeek}
        activeClass="border-blue-500 bg-blue-50 text-blue-700 focus:ring-blue-400"
        onClick={() => onFilterChange('thisWeek')}
      />
      <FilterButton
        label="일정이 초과된 업무"
        active={filter.overdue}
        activeClass="border-red-500 bg-red-50 text-red-700 focus:ring-red-400"
        onClick={() => onFilterChange('overdue')}
      />
    </div>
  );
}
