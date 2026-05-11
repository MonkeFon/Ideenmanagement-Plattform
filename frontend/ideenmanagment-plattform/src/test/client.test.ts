import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { __resetRefreshState, http as client } from '@/api/client';
import { useAuthStore } from '@/stores/authStore';
import { env } from '@/lib/env';

describe('axios client', () => {
  it('unwraps the API envelope', async () => {
    server.use(
      http.get(`${env.API_BASE_URL}/api/test-envelope`, () =>
        HttpResponse.json({ success: true, data: { hello: 'world' } }),
      ),
    );
    const res = await client.get('/api/test-envelope');
    expect(res.data).toEqual({ hello: 'world' });
  });

  it('refresh single-flight: parallel 401s trigger only one refresh', async () => {
    __resetRefreshState();
    useAuthStore.setState({
      accessToken: 'expired',
      refreshToken: 'r',
      user: null,
      permissions: [],
      expiresAt: null,
    });

    let refreshCalls = 0;
    let getCalls = 0;
    server.use(
      http.post(`${env.API_BASE_URL}/api/auth/refresh`, () => {
        refreshCalls++;
        return HttpResponse.json({
          success: true,
          data: {
            accessToken: 'new-token',
            refreshToken: 'r2',
            expiresAt: new Date(Date.now() + 60_000).toISOString(),
            user: {
              id: 'u', email: 'a@b.de', userName: 'a', firstName: 'A', lastName: 'B',
              isActive: true, createdAt: new Date().toISOString(), lastLoginAt: null, roles: [],
            },
          },
        });
      }),
      http.get(`${env.API_BASE_URL}/api/secured`, ({ request }) => {
        getCalls++;
        const auth = request.headers.get('Authorization');
        if (auth === 'Bearer new-token') {
          return HttpResponse.json({ success: true, data: { ok: true } });
        }
        return HttpResponse.json({ title: 'Unauthorized', status: 401 }, { status: 401 });
      }),
    );

    const results = await Promise.all([
      client.get('/api/secured'),
      client.get('/api/secured'),
      client.get('/api/secured'),
    ]);

    expect(refreshCalls).toBe(1);
    expect(getCalls).toBeGreaterThanOrEqual(6); // 3 initial 401 + 3 retries
    results.forEach((r) => expect(r.data).toEqual({ ok: true }));
    expect(useAuthStore.getState().accessToken).toBe('new-token');
  });
});

