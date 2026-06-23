'use client';

import type { Priority } from '@/shared/constants/status';

/* DS §1.2 Status & Priority Colors */
const STYLE: Record<Priority, string> = {
  Low:    'bg-[#DFE1E6] text-[#42526E]',
  Medium: 'bg-[#DEEBFF] text-[#0747A6]',
  High:   'bg-[#FFEBE6] text-[#BF2600]',
};

type PriorityBadgeProps = { priority: Priority };

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  /* DS §2 Badge Text: 11px Semi-Bold */
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold ${STYLE[priority]}`}>
      {priority}
    </span>
  );
}
