'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useBrandProfile } from '@/hooks/useBrandProfile'
import { AlertTriangle, Building2 } from 'lucide-react'

const toneColors: Record<string, string> = {
  Professional: 'bg-blue-100 text-blue-700',
  Casual: 'bg-orange-100 text-orange-700',
  Friendly: 'bg-green-100 text-green-700',
  Authoritative: 'bg-purple-100 text-purple-700',
}

export function BrandContextBar() {
  const { profile, loading } = useBrandProfile()

  if (loading) {
    return (
      <div className="mb-6 rounded-xl border bg-white p-4 flex items-center gap-4">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
        <p className="text-sm text-amber-800">
          No brand profile found.{' '}
          <Link href="/profile" className="font-semibold underline hover:no-underline">
            Set up your profile first
          </Link>{' '}
          to enable AI content generation.
        </p>
      </div>
    )
  }

  return (
    <div className="mb-6 rounded-xl border border-gray-100 bg-white shadow-sm p-4 flex items-center gap-4 flex-wrap">
      <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
        <Building2 className="h-4 w-4 text-purple-600" />
      </div>
      <div>
        <p className="font-semibold text-gray-900 text-sm leading-tight">{profile.brand_name}</p>
        <p className="text-xs text-gray-500">{profile.industry}</p>
      </div>
      <Badge className={`text-xs font-medium ${toneColors[profile.tone] ?? 'bg-gray-100 text-gray-600'}`} variant="secondary">
        {profile.tone}
      </Badge>
      <span className="text-sm text-gray-500 hidden sm:block">→ {profile.target_audience}</span>
      <div className="ml-auto flex gap-1.5 flex-wrap">
        {profile.platforms?.slice(0, 3).map(p => (
          <Badge key={p} variant="outline" className="text-xs text-gray-600">
            {p}
          </Badge>
        ))}
        {(profile.platforms?.length ?? 0) > 3 && (
          <Badge variant="outline" className="text-xs text-gray-500">
            +{profile.platforms.length - 3}
          </Badge>
        )}
      </div>
    </div>
  )
}
