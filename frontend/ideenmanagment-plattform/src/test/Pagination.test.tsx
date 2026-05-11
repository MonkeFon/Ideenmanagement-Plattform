import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from '@/components/common/Pagination';

describe('<Pagination>', () => {
  it('disables prev on first page', () => {
    render(
      <Pagination
        page={1} pageSize={10} total={30} totalPages={3}
        hasNext hasPrevious={false}
        onPageChange={() => {}}
      />,
    );
    const prev = screen.getByRole('button', { name: /vorherige/i });
    expect(prev).toBeDisabled();
  });

  it('triggers onPageChange when next clicked', async () => {
    const onChange = vi.fn();
    render(
      <Pagination
        page={1} pageSize={10} total={30} totalPages={3}
        hasNext hasPrevious={false}
        onPageChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /nächste/i }));
    expect(onChange).toHaveBeenCalledWith(2);
  });
});

