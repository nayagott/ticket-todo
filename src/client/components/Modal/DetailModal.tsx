'use client';

import { useEffect, useState } from 'react';
import { updateTicketSchema } from '@/shared/schemas/ticketSchema';
import { COLUMN_STATUSES, PRIORITIES } from '@/shared/constants/status';
import { ConfirmDialog } from './ConfirmDialog';
import type { TicketDto } from '@/shared/types/ticket';
import type { UpdateTicketInput } from '@/shared/schemas/ticketSchema';

type EditableField = keyof UpdateTicketInput;

type DetailModalProps = {
  ticket:       TicketDto | null;
  onClose:      () => void;
  updateTicket: (id: string, input: UpdateTicketInput) => Promise<TicketDto>;
  deleteTicket: (id: string) => Promise<void>;
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '—' : `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

export function DetailModal({ ticket, onClose, updateTicket, deleteTicket }: DetailModalProps) {
  const [editField, setEditField] = useState<EditableField | null>(null);
  const [form, setForm]           = useState<UpdateTicketInput>({});
  const [confirmOpen, setConfirmOpen]   = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticket) { setEditField(null); return; }
    setForm({
      title:       ticket.title,
      description: ticket.description,
      priority:    ticket.priority,
      status:      ticket.status,
      startedAt:   ticket.startedAt,
      dueDate:     ticket.dueDate,
    });
    setEditField(null);
    setError(null);
  }, [ticket]);

  useEffect(() => {
    if (!ticket) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (editField) {
        // 편집 취소 — 원래 값으로 복원
        setForm({
          title:       ticket!.title,
          description: ticket!.description,
          priority:    ticket!.priority,
          status:      ticket!.status,
          startedAt:   ticket!.startedAt,
          dueDate:     ticket!.dueDate,
        });
        setEditField(null);
      } else {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [ticket, editField, onClose]);

  if (!ticket) return null;

  async function saveField(field: EditableField) {
    const result = updateTicketSchema.safeParse({ [field]: form[field] });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? '입력값이 유효하지 않습니다.');
      return;
    }
    setIsSubmitting(true);
    try {
      await updateTicket(ticket!.id, { [field]: form[field] });
      setError(null);
    } catch {
      setError('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
      setEditField(null);
    }
  }

  async function handleDelete() {
    setIsSubmitting(true);
    try {
      await deleteTicket(ticket!.id);
      onClose();
    } catch {
      setError('삭제에 실패했습니다. 다시 시도해주세요.');
      setIsSubmitting(false);
      setConfirmOpen(false);
    }
  }

  // 필드 공통 컨테이너
  function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div className="grid grid-cols-[7rem_1fr] items-start gap-2 border-b border-gray-100 py-2.5 last:border-0">
        <span className="mt-0.5 text-xs font-medium text-gray-400">{label}</span>
        <div className="text-sm text-gray-900">{children}</div>
      </div>
    );
  }

  const inputClass =
    'w-full rounded border border-blue-400 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-300';
  const viewClass  =
    'cursor-pointer rounded px-1 py-0.5 hover:bg-gray-100 min-h-[1.5rem]';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
      className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto pt-16"
    >
      <div data-testid="modal-backdrop" className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 id="detail-modal-title" className="text-base font-semibold text-gray-900">
            티켓 상세
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="모달 닫기"
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            ✕
          </button>
        </div>

        {/* Fields */}
        <div className="rounded-lg bg-gray-50 px-3 py-1">
          {/* title */}
          <FieldRow label="제목">
            {editField === 'title' ? (
              <input
                autoFocus
                value={form.title ?? ''}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                onBlur={() => saveField('title')}
                className={inputClass}
              />
            ) : (
              <span className={viewClass} onClick={() => setEditField('title')}>
                {ticket.title}
              </span>
            )}
          </FieldRow>

          {/* description */}
          <FieldRow label="설명">
            {editField === 'description' ? (
              <textarea
                autoFocus
                rows={3}
                value={form.description ?? ''}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                onBlur={() => saveField('description')}
                className={`${inputClass} resize-none`}
              />
            ) : (
              <span className={`${viewClass} whitespace-pre-wrap`} onClick={() => setEditField('description')}>
                {ticket.description ?? <span className="text-gray-400">클릭하여 추가</span>}
              </span>
            )}
          </FieldRow>

          {/* priority */}
          <FieldRow label="우선순위">
            {editField === 'priority' ? (
              <select
                autoFocus
                value={form.priority ?? ''}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value as TicketDto['priority'] || null }))}
                onBlur={() => saveField('priority')}
                className={inputClass}
              >
                <option value="">없음</option>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            ) : (
              <span className={viewClass} onClick={() => setEditField('priority')}>
                {ticket.priority ?? <span className="text-gray-400">없음</span>}
              </span>
            )}
          </FieldRow>

          {/* status */}
          <FieldRow label="상태">
            {editField === 'status' ? (
              <select
                autoFocus
                value={form.status ?? ticket.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as TicketDto['status'] }))}
                onBlur={() => saveField('status')}
                className={inputClass}
              >
                {COLUMN_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            ) : (
              <span className={viewClass} onClick={() => setEditField('status')}>
                {ticket.status}
              </span>
            )}
          </FieldRow>

          {/* startedAt */}
          <FieldRow label="시작예정일">
            {editField === 'startedAt' ? (
              <input
                type="date"
                autoFocus
                value={formatDate(form.startedAt ?? null)}
                onChange={e => setForm(f => ({ ...f, startedAt: e.target.value ? `${e.target.value}T00:00:00.000Z` : null }))}
                onBlur={() => saveField('startedAt')}
                className={inputClass}
              />
            ) : (
              <span className={viewClass} onClick={() => setEditField('startedAt')}>
                {formatDate(ticket.startedAt)}
              </span>
            )}
          </FieldRow>

          {/* dueDate */}
          <FieldRow label="종료예정일">
            {editField === 'dueDate' ? (
              <input
                type="date"
                autoFocus
                value={formatDate(form.dueDate ?? null)}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value ? `${e.target.value}T00:00:00.000Z` : null }))}
                onBlur={() => saveField('dueDate')}
                className={inputClass}
              />
            ) : (
              <span className={viewClass} onClick={() => setEditField('dueDate')}>
                {formatDate(ticket.dueDate)}
              </span>
            )}
          </FieldRow>

          {/* createdAt — 읽기 전용 */}
          <FieldRow label="생성일">
            <span className="text-gray-500">{formatDate(ticket.createdAt)}</span>
          </FieldRow>
        </div>

        {/* Error toast */}
        {error && (
          <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </p>
        )}

        {/* Footer */}
        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={isSubmitting}
            className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50"
          >
            삭제
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            닫기
          </button>
        </div>

        <ConfirmDialog
          isOpen={confirmOpen}
          message="정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
          onConfirm={handleDelete}
          onCancel={() => setConfirmOpen(false)}
        />
      </div>
    </div>
  );
}
