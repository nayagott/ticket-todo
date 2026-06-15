import type { ColumnStatus, Priority } from '@/shared/constants/status';

/**
 * DB 모델: Drizzle $inferSelect와 동일한 형태 (날짜 = Date 객체)
 * ticketService 내부에서만 사용한다.
 */
export type TicketRow = {
  id:          string;
  title:       string;
  description: string | null;
  status:      string;        // varchar — Zod 통과 후 ColumnStatus로 단언
  priority:    string | null; // varchar — Zod 통과 후 Priority로 단언
  order:       number;
  startedAt:   Date | null;
  dueDate:     Date | null;
  createdAt:   Date;
  updatedAt:   Date;
};

/**
 * API 응답 DTO: 날짜를 ISO 8601 문자열로 직렬화
 * Route Handler가 클라이언트에 반환하는 형태다.
 */
export type TicketDto = {
  id:          string;
  title:       string;
  description: string | null;
  status:      ColumnStatus;
  priority:    Priority | null;
  order:       number;
  startedAt:   string | null; // ISO 8601
  dueDate:     string | null; // ISO 8601
  createdAt:   string;        // ISO 8601
  updatedAt:   string;        // ISO 8601
};

/** TicketRow → TicketDto 변환 헬퍼 */
export function toTicketDto(row: TicketRow): TicketDto {
  return {
    id:          row.id,
    title:       row.title,
    description: row.description,
    status:      row.status   as ColumnStatus,
    priority:    row.priority as Priority | null,
    order:       row.order,
    startedAt:   row.startedAt?.toISOString() ?? null,
    dueDate:     row.dueDate?.toISOString()   ?? null,
    createdAt:   row.createdAt.toISOString(),
    updatedAt:   row.updatedAt.toISOString(),
  };
}
