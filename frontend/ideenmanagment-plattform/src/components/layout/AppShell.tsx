import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useUiStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/api/auth';
import { QK } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

export function AppShell() {
  const mobileOpen = useUiStore((s) => s.mobileDrawerOpen);
  const setMobile = useUiStore((s) => s.setMobileDrawer);
  const setUser = useAuthStore((s) => s.setUser);
  const accessToken = useAuthStore((s) => s.accessToken);

  // /me beim Mount holen, um permissions zu rehydrieren
  const meQuery = useQuery({
    queryKey: QK.me,
    queryFn: () => authApi.me(),
    enabled: !!accessToken,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (meQuery.data) {
      setUser(
        {
          id: meQuery.data.id,
          email: meQuery.data.email,
          userName: meQuery.data.userName,
          firstName: meQuery.data.firstName,
          lastName: meQuery.data.lastName,
          isActive: meQuery.data.isActive,
          createdAt: meQuery.data.createdAt,
          lastLoginAt: meQuery.data.lastLoginAt,
          roles: meQuery.data.roles,
        },
        meQuery.data.permissions,
      );
    }
  }, [meQuery.data, setUser]);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <Dialog open={mobileOpen} onOpenChange={setMobile}>
        <DialogContent className="left-0 top-0 h-full w-72 max-w-none translate-x-0 translate-y-0 p-0 sm:rounded-none">
          <DialogTitle className="sr-only">Navigation</DialogTitle>
          <Sidebar mobile onNavigate={() => setMobile(false)} />
        </DialogContent>
      </Dialog>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="container flex-1 overflow-y-auto py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

