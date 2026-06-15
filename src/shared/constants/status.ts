export const COLUMN_STATUSES = ['Backlog', 'TODO', 'In Progress', 'Done'] as const;
export const PRIORITIES      = ['Low', 'Medium', 'High'] as const;

export type ColumnStatus = (typeof COLUMN_STATUSES)[number];
// 'Backlog' | 'TODO' | 'In Progress' | 'Done'

export type Priority = (typeof PRIORITIES)[number];
// 'Low' | 'Medium' | 'High'

export const DUE_WARNING_DAYS = 3; // D-3 임박 기준 (FR-012)

export function getDeadlineStyle(dueDate: string | null, status: ColumnStatus): string {
  if (!dueDate || status === 'Done') return 'border-gray-200'; // FR-014
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate); // ISO 8601 문자열 → Date
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0)                 return 'border-red-500';    // 기한 초과 (FR-013)
  if (diffDays <= DUE_WARNING_DAYS) return 'border-orange-400'; // D-3 이내 (FR-012)
  return 'border-gray-200';                                      // 기본 (FR-014)
}
// diffDays === 0 (당일)은 초과가 아니므로 orange 처리 — WCAG AA 4.5:1 준수 (NFR-012)
