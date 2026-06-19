'use client';

type HeaderProps = {
  onNewTicket: () => void;
};

export function Header({ onNewTicket }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
      <h1 className="text-xl font-bold text-gray-900">TicketTodo</h1>
      <button
        type="button"
        onClick={onNewTicket}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        + 새 업무
      </button>
    </header>
  );
}
