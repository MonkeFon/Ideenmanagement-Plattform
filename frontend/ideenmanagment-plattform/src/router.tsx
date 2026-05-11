import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { AnonymousOnly } from '@/components/auth/AnonymousOnly';
import { RequirePermission } from '@/components/auth/RequirePermission';
import { PageLoading } from '@/components/common/LoadingSpinner';
import { PERMISSIONS } from '@/lib/permissions';
import NotFoundPage from '@/pages/NotFoundPage';
import ForbiddenPage from '@/pages/ForbiddenPage';

const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const IdeasListPage = lazy(() => import('@/pages/IdeasListPage'));
const IdeaCreatePage = lazy(() => import('@/pages/IdeaCreatePage'));
const IdeaDetailPage = lazy(() => import('@/pages/IdeaDetailPage'));
const IdeaEditPage = lazy(() => import('@/pages/IdeaEditPage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const ModerationPage = lazy(() => import('@/pages/ModerationPage'));
const UsersPage = lazy(() => import('@/pages/admin/UsersPage'));
const UserDetailPage = lazy(() => import('@/pages/admin/UserDetailPage'));
const RolesPage = lazy(() => import('@/pages/admin/RolesPage'));
const CategoriesPage = lazy(() => import('@/pages/admin/CategoriesPage'));
const AuditLogsPage = lazy(() => import('@/pages/admin/AuditLogsPage'));

const S = (el: React.ReactNode) => <Suspense fallback={<PageLoading />}>{el}</Suspense>;

export const router = createBrowserRouter([
  {
    element: <AnonymousOnly />,
    children: [
      { path: '/login', element: S(<LoginPage />) },
      { path: '/register', element: S(<RegisterPage />) },
      { path: '/forgot-password', element: S(<ForgotPasswordPage />) },
      { path: '/reset-password', element: S(<ResetPasswordPage />) },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: S(<DashboardPage />) },
          { path: '/ideas', element: S(<IdeasListPage />) },
          {
            path: '/ideas/new',
            element: <RequirePermission permission={PERMISSIONS.IdeasCreate}>{S(<IdeaCreatePage />)}</RequirePermission>,
          },
          { path: '/ideas/:id', element: S(<IdeaDetailPage />) },
          { path: '/ideas/:id/edit', element: S(<IdeaEditPage />) },
          { path: '/notifications', element: S(<NotificationsPage />) },
          { path: '/profile', element: S(<ProfilePage />) },
          {
            path: '/moderation',
            element: <RequirePermission permission={PERMISSIONS.IdeasModerate}>{S(<ModerationPage />)}</RequirePermission>,
          },
          {
            path: '/admin/users',
            element: <RequirePermission permission={PERMISSIONS.UsersRead}>{S(<UsersPage />)}</RequirePermission>,
          },
          {
            path: '/admin/users/:id',
            element: <RequirePermission permission={PERMISSIONS.UsersManage}>{S(<UserDetailPage />)}</RequirePermission>,
          },
          {
            path: '/admin/roles',
            element: <RequirePermission permission={PERMISSIONS.RolesManage}>{S(<RolesPage />)}</RequirePermission>,
          },
          {
            path: '/admin/categories',
            element: <RequirePermission permission={PERMISSIONS.CategoriesManage}>{S(<CategoriesPage />)}</RequirePermission>,
          },
          {
            path: '/admin/audit-logs',
            element: <RequirePermission permission={PERMISSIONS.AuditRead}>{S(<AuditLogsPage />)}</RequirePermission>,
          },
          { path: '/forbidden', element: <ForbiddenPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);

