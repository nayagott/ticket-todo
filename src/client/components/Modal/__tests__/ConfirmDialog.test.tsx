import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from '../ConfirmDialog';

const defaultProps = {
  isOpen:    true,
  message:   '정말 삭제하시겠습니까?',
  onConfirm: jest.fn(),
  onCancel:  jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

describe('ConfirmDialog', () => {
  it('isOpen=false → DOM에 렌더링되지 않음', () => {
    render(<ConfirmDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('isOpen=true → role="alertdialog" 존재', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('isOpen=true → aria-modal="true"', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByRole('alertdialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('message props가 화면에 렌더링됨', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('정말 삭제하시겠습니까?')).toBeInTheDocument();
  });

  it('삭제(확인) 버튼 클릭 → onConfirm 호출', async () => {
    const onConfirm = jest.fn();
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);
    await userEvent.click(screen.getByRole('button', { name: '삭제' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('취소 버튼 클릭 → onCancel 호출', async () => {
    const onCancel = jest.fn();
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('확인·취소 둘 다 <button> 태그 (NFR-011)', () => {
    render(<ConfirmDialog {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
    buttons.forEach(btn => expect(btn.tagName).toBe('BUTTON'));
  });

  it('확인·취소 둘 다 포커스 가능 (NFR-008)', () => {
    render(<ConfirmDialog {...defaultProps} />);
    screen.getAllByRole('button').forEach(btn => {
      expect(btn).not.toHaveAttribute('tabindex', '-1');
    });
  });

  it('ESC 키 → onCancel 호출 (NFR-008)', async () => {
    const onCancel = jest.fn();
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);
    await userEvent.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
