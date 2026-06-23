'use client';

type HeaderProps = {
  onNewTicket: () => void;
};

export function Header({ onNewTicket }: HeaderProps) {
  return (
    <header
      className="flex items-center justify-between border-b border-[#DFE1E6] bg-white px-6"
      style={{ height: 'var(--header-h)' }}
    >
      {/* DS §2 Header: 24px Bold */}
      <h1 className="text-2xl font-bold text-[#172B4D]">TicketTodo</h1>
      {/* DS §3.1 Primary Button: Primary Blue, radius 4px~8px */}
      <button
        type="button"
        onClick={onNewTicket}
        className="rounded-md bg-[#0052CC] px-4 py-2 text-sm font-medium text-white hover:bg-[#0747A6] focus:outline-none focus:ring-2 focus:ring-[#0052CC] focus:ring-offset-1"
      >
        + 새 업무
      </button>
    </header>
  );
}
