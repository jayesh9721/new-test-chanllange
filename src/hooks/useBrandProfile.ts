'use client'

import { useEffect, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { BrandProfile } from '@/lib/supabase/types'

export function useBrandProfile() {
  const [profile, setProfile] = useState<BrandProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = () => {
    getSupabaseClient()
      .from('brand_profiles')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .single()
      .then(({ data }) => {
        setProfile(data as BrandProfile | null)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  return { profile, loading, refresh: fetchProfile }
}
