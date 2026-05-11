import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RequirePermission } from '@/components/auth/RequirePermission';
import { useAuthStore } from '@/stores/authStore';

function setup(perms: string[]) {
  useAuthStore.setState({
    accessToken: 'x',
    refreshToken: 'r',
    expiresAt: null,
    user: {
      id: 'u', email: 'a@b.de', userName: 'a', firstName: 'A', lastName: 'B',
      isActive: true, createdAt: '', lastLoginAt: null, roles: [],
    },
    permissions: perms,
  });
}

describe('<RequirePermission>', () => {
  beforeEach(() => useAuthStore.getState().clear());

  it('renders children if permission present', () => {
    setup(['ideas.read']);
    render(
      <MemoryRouter initialEntries={['/secret']}>
        <Routes>
          <Route
            path="/secret"
            element={
              <RequirePermission permission="ideas.read">
                <div>geheim</div>
              </RequirePermission>
            }
          />
          <Route path="/forbidden" element={<div>403</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('geheim')).toBeInTheDocument();
  });

  it('redirects to /forbidden if permission missing', () => {
    setup([]);
    render(
      <MemoryRouter initialEntries={['/secret']}>
        <Routes>
          <Route
            path="/secret"
            element={
              <RequirePermission permission="users.manage">
                <div>geheim</div>
              </RequirePermission>
            }
          />
          <Route path="/forbidden" element={<div>403</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('403')).toBeInTheDocument();
  });
});

