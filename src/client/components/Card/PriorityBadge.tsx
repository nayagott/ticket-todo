'use client';

import type { Priority } from '@/shared/constants/status';

const STYLE: Record<Priority, string> = {
  Low:    'bg-slate-100 text-slate-600',
  Medium: 'bg-blue-100 text-blue-700',
  High:   'bg-red-100 text-red-700',
};

type PriorityBadgeProps = { priority: Priority };

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${STYLE[priority]}`}>
      {priority}
    </span>
  );
}
