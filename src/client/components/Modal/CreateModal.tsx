'use client';

import { useEffect, useState } from 'react';
import { ticketApi } from '@/client/api/ticketApi';
import { createTicketSchema } from '@/shared/schemas/ticketSchema';
import type { CreateTicketInput } from '@/shared/schemas/ticketSchema';
import type { TicketDto } from '@/shared/types/ticket';

type CreateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (ticket: TicketDto) => void;
};

type FormState = {
  title: string;
  description: string;
  priority: string;
  startedAt: string;
  dueDate: string;
};

type FormErrors = Partial<Record<keyof CreateTicketInput, string>>;

const INITIAL_FORM: FormState = {
  title: '',
  description: '',
  priority: '',
  startedAt: '',
  dueDate: '',
};

function buildInput(form: FormState): CreateTicketInput {
  const input: CreateTicketInput = { title: form.title };
  if (form.description) input.description = form.description;
  if (form.priority) input.priority = form.priority as CreateTicketInput['priority'];
  if (form.startedAt) input.startedAt = new Date(form.startedAt + 'T00:00:00.000Z').toISOString();
  if (form.dueDate) input.dueDate = new Date(form.dueDate + 'T00:00:00.000Z').toISOString();
  return input;
}

export function CreateModal({ isOpen, onClose, onCreated }: CreateModalProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input = buildInput(form);
    const parsed = createTicketSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors(
        Object.fromEntries(
          Object.entries(fieldErrors).map(([k, v]) => [k, (v as string[])?.[0]])
        ) as FormErrors,
      );
      return;
    }
    setIsSubmitting(true);
    try {
      const created = await ticketApi.create(parsed.data);
      onCreated(created);
      setForm(INITIAL_FORM);
      setErrors({});
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="create-modal-title" className="mb-4 text-lg font-semibold">
          새 티켓 만들기
        </h2>
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label htmlFor="ticket-title" className="mb-1 block text-sm font-medium text-gray-700">
              제목 <span aria-hidden="true">*</span>
            </label>
            <input
              id="ticket-title"
              type="text"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="티켓 제목을 입력하세요"
              autoFocus
            />
            {errors.title && (
              <p role="alert" className="mt-1 text-xs text-red-600">
                {errors.title}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="ticket-description"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              설명
            </label>
            <textarea
              id="ticket-description"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="티켓 설명을 입력하세요 (선택)"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="ticket-priority"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              우선순위
            </label>
            <select
              id="ticket-priority"
              value={form.priority}
              onChange={(e) => setField('priority', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">선택 안 함</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div className="mb-6 flex gap-3">
            <div className="flex-1">
              <label
                htmlFor="ticket-started-at"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                시작일
              </label>
              <input
                id="ticket-started-at"
                type="date"
                value={form.startedAt}
                onChange={(e) => setField('startedAt', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="ticket-due-date"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                마감일
              </label>
              <input
                id="ticket-due-date"
                type="date"
                value={form.dueDate}
                onChange={(e) => setField('dueDate', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting || form.title.trim() === ''}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? '저장 중…' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
