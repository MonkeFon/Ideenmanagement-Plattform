import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import IdeaList from './pages/IdeaList'
import IdeaDetail from './pages/IdeaDetail'
import IdeaGraph from './pages/IdeaGraph'
import SubmitIdea from './pages/SubmitIdea'
import Admin from './pages/Admin'
import Workflow from './pages/Workflow'
import Leaderboard from './pages/Leaderboard'
import Campaigns from './pages/Campaigns'
import CampaignDetail from './pages/CampaignDetail'
import Settings from './pages/Settings'
import DevData from './pages/DevData'
import MockJira from './pages/MockJira'
import Impressum from './pages/Impressum'
import Datenschutz from './pages/Datenschutz'
import { useAuth } from '@/store/auth'
import { Toaster } from '@/components/ui/sonner'
import { WORKFLOW_ROLES, ADMIN_ROLES, hasRole } from '@/lib/permissions'
import type { Role } from '@/types/api'

function RequireAuth({ children }: { children: JSX.Element }) {
  const token = useAuth((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return children
}

function RequireRole({ roles, children }: { roles: Role[]; children: JSX.Element }) {
  const user = useAuth((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  if (!hasRole(user.role, roles)) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/impressum" element={<Impressum />} />
        <Route path="/datenschutz" element={<Datenschutz />} />

        <Route
          path="/jira/:id"
          element={
            <RequireAuth>
              <MockJira />
            </RequireAuth>
          }
        />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="ideas" element={<IdeaList />} />
          <Route path="ideas/:id" element={<IdeaDetail />} />
          <Route path="graph" element={<IdeaGraph />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="campaigns/:id" element={<CampaignDetail />} />
          <Route path="submit" element={<SubmitIdea />} />
          <Route
            path="workflow"
            element={<RequireRole roles={WORKFLOW_ROLES}><Workflow /></RequireRole>}
          />
          <Route path="settings" element={<Settings />} />
          <Route
            path="admin"
            element={<RequireRole roles={ADMIN_ROLES}><Admin /></RequireRole>}
          />

          <Route path="dev" element={<DevData />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </>
  )
}
