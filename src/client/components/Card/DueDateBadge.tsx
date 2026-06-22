'use client';

type DueDateBadgeProps = { dueDate: string };

export function DueDateBadge({ dueDate }: DueDateBadgeProps) {
  const date = new Date(dueDate);
  const label = isNaN(date.getTime())
    ? '-'
    : `${date.getUTCMonth() + 1}월 ${date.getUTCDate()}일`;

  return (
    <span className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
      {label}
    </span>
  );
}
