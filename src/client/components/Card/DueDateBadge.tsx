'use client';

type DueDateBadgeProps = { dueDate: string };

export function DueDateBadge({ dueDate }: DueDateBadgeProps) {
  const date = new Date(dueDate);
  const label = isNaN(date.getTime())
    ? '-'
    : `${date.getUTCMonth() + 1}월 ${date.getUTCDate()}일`;

  /* DS §2 Badge Text: 11px Semi-Bold / DS §1.2 Low 색상(Gray 계열) */
  return (
    <span className="inline-flex items-center rounded bg-[#DFE1E6] px-2 py-0.5 text-[11px] font-semibold text-[#42526E]">
      {label}
    </span>
  );
}
