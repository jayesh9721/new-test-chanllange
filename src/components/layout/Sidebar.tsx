'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { useEffect, useState } from 'react'
import {
  User, Lightbulb, Share2, FileText, Video,
  RefreshCw, Calendar, Zap, LogOut, ChevronDown,
} from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

const navItems = [
  { href: '/profile',   label: 'Brand Profile',    icon: User,      color: 'text-violet-600' },
  { href: '/strategy',  label: 'Content Strategy', icon: Lightbulb, color: 'text-amber-500' },
  { href: '/social',    label: 'Social Content',   icon: Share2,    color: 'text-pink-500' },
  { href: '/blog',      label: 'SEO Blog',         icon: FileText,  color: 'text-blue-500' },
  { href: '/video',     label: 'Video Script',     icon: Video,     color: 'text-red-500' },
  { href: '/repurpose', label: 'Repurposer',       icon: RefreshCw, color: 'text-teal-500' },
  { href: '/calendar',  label: 'Content Calendar', icon: Calendar,  color: 'text-green-500' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    setSigningOut(true)
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-gray-100 h-screen flex flex-col sticky top-0">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 leading-tight">ContentAI</p>
            <p className="text-xs text-gray-400">AI Content Studio</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon, color }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', active ? color : 'text-gray-400')} />
              {label}
              {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-purple-500" />}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      {user && (
        <div className="px-3 py-4 border-t border-gray-100">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-gray-50">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-white">
                {user.email?.[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">{user.email}</p>
              <p className="text-xs text-gray-400">Free plan</p>
            </div>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              title="Sign out"
              className="text-gray-400 hover:text-red-500 transition-colors ml-1 shrink-0"
            >
              {signingOut
                ? <div className="h-3.5 w-3.5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                : <LogOut className="h-3.5 w-3.5" />
              }
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
