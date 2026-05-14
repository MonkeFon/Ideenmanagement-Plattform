import type { Role } from '@/types/api'
import { useAuth } from '@/store/auth'
import { ReactNode } from 'react'

export default function RoleGate({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const role = useAuth((s) => s.user?.role)
  if (!role || !allow.includes(role)) return null
  return <>{children}</>
}
