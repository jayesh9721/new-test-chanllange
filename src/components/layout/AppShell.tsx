'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'

const NO_SIDEBAR_ROUTES = ['/login', '/auth']

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showSidebar = !NO_SIDEBAR_ROUTES.some(r => pathname.startsWith(r))

  if (!showSidebar) return <>{children}</>

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
