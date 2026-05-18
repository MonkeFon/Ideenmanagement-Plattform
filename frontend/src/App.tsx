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
import { useAuth } from '@/store/auth'
import { Toaster } from '@/components/ui/sonner'

function RequireAuth({ children }: { children: JSX.Element }) {
  const token = useAuth((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
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
          <Route path="workflow" element={<Workflow />} />
          <Route path="settings" element={<Settings />} />
          <Route path="admin" element={<Admin />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </>
  )
}
