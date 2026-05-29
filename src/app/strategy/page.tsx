'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { BrandContextBar } from '@/components/layout/BrandContextBar'
import { ContentCard } from '@/components/shared/ContentCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { CopyButton } from '@/components/shared/CopyButton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { ContentStrategy } from '@/lib/supabase/types'
import {
  Lightbulb, BarChart3, Users, Megaphone, Clock,
  BookOpen, TrendingUp, RefreshCw,
} from 'lucide-react'

/* ── Full-page loader ───────────────────────────────── */
function GeneratingStrategy() {
  const [dots, setDots] = useState(0)
  const steps = [
    'Analysing your brand profile…',
    'Identifying content pillars…',
    'Mapping audience pain points…',
    'Building your CTA strategy…',
    'Finalising posting frequency…',
  ]

  useEffect(() => {
    const t = setInterval(() => setDots(d => (d + 1) % steps.length), 2200)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      {/* Animated rings */}
      <div className="relative h-20 w-20">
        <div className="absolute inset-0 rounded-full border-4 border-amber-100" />
        <div className="absolute inset-0 rounded-full border-4 border-t-amber-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        <div className="absolute inset-2 rounded-full border-4 border-t-transparent border-r-orange-400 border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <Lightbulb className="h-6 w-6 text-amber-500" />
        </div>
      </div>

      <div className="text-center space-y-2">
        <p className="text-lg font-bold text-gray-900">AI is crafting your strategy</p>
        <p className="text-sm text-amber-600 font-medium min-h-[1.25rem] transition-all">
          {steps[dots]}
        </p>
        <p className="text-xs text-gray-400">This usually takes 15–30 seconds</p>
      </div>

      {/* Progress bar */}
      <div className="w-64 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full animate-pulse" style={{ width: '60%' }} />
      </div>
    </div>
  )
}

/* ── Strategy output ────────────────────────────────── */
function StrategyOutput({ data }: { data: ContentStrategy }) {
  const fullText = [
    data.content_pillars?.join(', '),
    data.storytelling_angle,
    data.audience_pain_points?.join(', '),
    data.cta_strategy,
    data.posting_frequency,
  ].filter(Boolean).join('\n\n')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <StatusBadge status={data.status} />
        <CopyButton text={fullText} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.content_pillars && data.content_pillars.length > 0 && (
          <ContentCard title="Content Pillars" icon={<BarChart3 className="h-4 w-4 text-violet-500" />}
            copyText={data.content_pillars.join(', ')} className="md:col-span-2">
            <div className="flex flex-wrap gap-2">
              {data.content_pillars.map((p, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 border border-violet-100">
                  <span className="h-5 w-5 rounded-full bg-violet-500 text-white text-xs flex items-center justify-center font-bold">{i + 1}</span>
                  <span className="text-sm font-medium text-violet-700">{p}</span>
                </div>
              ))}
            </div>
          </ContentCard>
        )}

        {data.storytelling_angle && (
          <ContentCard title="Storytelling Angle" icon={<BookOpen className="h-4 w-4 text-pink-500" />} copyText={data.storytelling_angle}>
            <p className="text-sm text-gray-700 leading-relaxed">{data.storytelling_angle}</p>
          </ContentCard>
        )}

        {data.posting_frequency && (
          <ContentCard title="Posting Frequency" icon={<Clock className="h-4 w-4 text-green-500" />} copyText={data.posting_frequency}>
            <p className="text-sm text-gray-700">{data.posting_frequency}</p>
          </ContentCard>
        )}

        {data.audience_pain_points && data.audience_pain_points.length > 0 && (
          <ContentCard title="Audience Pain Points" icon={<Users className="h-4 w-4 text-amber-500" />}
            copyText={data.audience_pain_points.join('\n')}>
            <ul className="space-y-2">
              {data.audience_pain_points.map((pt, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />{pt}
                </li>
              ))}
            </ul>
          </ContentCard>
        )}

        {data.cta_strategy && (
          <ContentCard title="CTA Strategy" icon={<Megaphone className="h-4 w-4 text-blue-500" />} copyText={data.cta_strategy}>
            <p className="text-sm text-gray-700 leading-relaxed">{data.cta_strategy}</p>
          </ContentCard>
        )}
      </div>
    </div>
  )
}

/* ── Page ───────────────────────────────────────────── */
export default function StrategyPage() {
  const [pageLoading,  setPageLoading]  = useState(true)   // initial DB fetch
  const [generating,   setGenerating]   = useState(false)  // waiting for n8n
  const [refreshing,   setRefreshing]   = useState(false)
  const [doneRow,      setDoneRow]      = useState<ContentStrategy | null>(null)
  const [lastDoneId,   setLastDoneId]   = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchLatest = useCallback(async (silent = false) => {
    if (!silent) setPageLoading(true)

    const { data } = await getSupabaseClient()
      .from('content_strategy')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    const rows = (data ?? []) as ContentStrategy[]
    const done    = rows.find(r => r.status === 'done')
    const pending = rows.some(r => r.status === 'pending' || r.status === 'processing')

    if (!silent) setPageLoading(false)
    return { done: done ?? null, pending }
  }, [])

  // Initial load
  useEffect(() => {
    fetchLatest().then(({ done, pending }) => {
      setDoneRow(done)
      if (done) setLastDoneId(done.id)
      if (pending && !done) setGenerating(true)
    })
  }, [fetchLatest])

  // Poll while generating — stop when a NEW done row appears
  useEffect(() => {
    if (!generating) return

    const poll = async () => {
      const { done, pending } = await fetchLatest(true)

      if (done && done.id !== lastDoneId) {
        // New done row arrived
        setDoneRow(done)
        setLastDoneId(done.id)
        setGenerating(false)
        return
      }

      if (!pending && !done) {
        // Nothing in the queue anymore
        setGenerating(false)
        return
      }

      // Still pending — poll again
      pollRef.current = setTimeout(poll, 3000)
    }

    pollRef.current = setTimeout(poll, 3000)
    return () => { if (pollRef.current) clearTimeout(pollRef.current) }
  }, [generating, lastDoneId, fetchLatest])

  const handleRefresh = async () => {
    setRefreshing(true)
    const { done, pending } = await fetchLatest(true)
    setDoneRow(done)
    if (done) setLastDoneId(done.id)
    if (pending && !done) setGenerating(true)
    setRefreshing(false)
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
            <Lightbulb className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Content Strategy</h1>
            <p className="text-sm text-gray-500">AI-generated strategy based on your brand profile</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing || generating}
              className="gap-1.5">
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <TrendingUp className="h-5 w-5 text-gray-300" />
          </div>
        </div>
      </div>

      <BrandContextBar />

      {/* States */}
      {pageLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      ) : generating ? (
        <GeneratingStrategy />
      ) : doneRow ? (
        <StrategyOutput data={doneRow} />
      ) : (
        <EmptyState
          title="No strategy generated yet"
          description="Save your brand profile to trigger automatic strategy generation. The result will appear here automatically."
        />
      )}
    </div>
  )
}
