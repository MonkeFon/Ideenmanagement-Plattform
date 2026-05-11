import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VoteButtons } from '@/components/ideas/VoteButtons';
import { useAuthStore } from '@/stores/authStore';
import type { VoteSummaryResponse } from '@/types/api';

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('<VoteButtons>', () => {
  it('zeigt aktuelle Score und reagiert auf Klick (optimistic)', async () => {
    useAuthStore.setState({
      accessToken: 'x', refreshToken: 'r', expiresAt: null,
      user: { id: 'u', email: '', userName: '', firstName: '', lastName: '', isActive: true, createdAt: '', lastLoginAt: null, roles: [] },
      permissions: ['votes.cast'],
    });
    const summary: VoteSummaryResponse = { ideaId: 'i1', up: 2, down: 1, score: 1, currentUserVote: null };
    wrap(<VoteButtons ideaId="i1" summary={summary} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    const upBtn = screen.getByRole('button', { name: /hochstimmen/i });
    await userEvent.click(upBtn);
    // Optimistic: Score muss sich sofort um +1 erhöht zeigen
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('deaktiviert Buttons ohne Permission', () => {
    useAuthStore.setState({
      accessToken: 'x', refreshToken: 'r', expiresAt: null,
      user: { id: 'u', email: '', userName: '', firstName: '', lastName: '', isActive: true, createdAt: '', lastLoginAt: null, roles: [] },
      permissions: [],
    });
    const summary: VoteSummaryResponse = { ideaId: 'i1', up: 0, down: 0, score: 0, currentUserVote: null };
    wrap(<VoteButtons ideaId="i1" summary={summary} />);
    expect(screen.getByRole('button', { name: /hochstimmen/i })).toBeDisabled();
  });
});

