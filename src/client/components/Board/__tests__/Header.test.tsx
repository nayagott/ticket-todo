import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '../Header';

describe('Header', () => {
  it('TC-COMP-005: "새 업무" 버튼을 <button> 태그로 렌더링 (NFR-011)', () => {
    render(<Header onNewTicket={jest.fn()} />);
    const btn = screen.getByRole('button', { name: /새 업무/ });
    expect(btn).toBeInTheDocument();
    expect(btn.tagName).toBe('BUTTON');
  });

  it('TC-COMP-006: "새 업무" 버튼 클릭 → onNewTicket 1회 호출', async () => {
    const onNewTicket = jest.fn();
    render(<Header onNewTicket={onNewTicket} />);
    await userEvent.click(screen.getByRole('button', { name: /새 업무/ }));
    expect(onNewTicket).toHaveBeenCalledTimes(1);
  });
});
