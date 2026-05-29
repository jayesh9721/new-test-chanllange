'use client'

import { useEffect, useState, useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { BrandContextBar } from '@/components/layout/BrandContextBar'
import { EmptyState } from '@/components/shared/EmptyState'
import { CopyButton } from '@/components/shared/CopyButton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { SocialContent, SeoBlog, VideoScript } from '@/lib/supabase/types'
import {
  Calendar, LayoutList, Camera, MessageCircle,
  FileText, Video as VideoIcon, RefreshCw,
  Zap, Hash, BookOpen, ExternalLink, CheckCircle2,
  Clock, Send,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/* ── types ─────────────────────────────────────────── */
type AnyContent =
  | { kind: 'social'; data: SocialContent & { image_url?: string } }
  | { kind: 'blog';   data: SeoBlog }
  | { kind: 'video';  data: VideoScript }

interface CalItem {
  date: string   // YYYY-MM-DD — the day this is scheduled
  content: AnyContent
}

/* ── config ────────────────────────────────────────── */
const P: Record<string, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  LinkedIn:  { icon: LayoutList,    color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  Instagram: { icon: Camera,        color: 'text-pink-700',   bg: 'bg-pink-50',   border: 'border-pink-200' },
  Twitter:   { icon: MessageCircle, color: 'text-sky-700',    bg: 'bg-sky-50',    border: 'border-sky-200' },
  Blog:      { icon: FileText,      color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  Video:     { icon: VideoIcon,     color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200' },
}
const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

function getLabel(item: AnyContent) {
  if (item.kind === 'social') return item.data.platform
  if (item.kind === 'blog')   return 'Blog'
  return 'Video'
}
function getCfg(item: AnyContent) { return P[getLabel(item)] ?? P['Blog'] }

function getTitle(item: AnyContent) {
  if (item.kind === 'social') return item.data.hook ?? `${item.data.platform} Post`
  if (item.kind === 'blog')   return item.data.title ?? 'Blog Post'
  return item.data.video_topic ?? 'Video Script'
}

function getPreview(item: AnyContent) {
  if (item.kind === 'social') return item.data.post_body ?? ''
  if (item.kind === 'blog')   return item.data.blog?.slice(0, 120) ?? ''
  return item.data.hook ?? ''
}

/* ── publish status ─────────────────────────────────── */
function getPublishStatus(date: string, dbStatus: string) {
  if (dbStatus === 'pending' || dbStatus === 'processing') {
    return { label: 'Pending', icon: Clock, className: 'bg-yellow-100 text-yellow-700 border-yellow-200' }
  }
  const today = new Date().toISOString().split('T')[0]
  if (date < today) return { label: 'Published',           icon: CheckCircle2, className: 'bg-green-100 text-green-700 border-green-200' }
  if (date === today) return { label: 'Ready to Publish',  icon: Send,         className: 'bg-blue-100 text-blue-700 border-blue-200' }
  return { label: 'Scheduled',                             icon: Calendar,     className: 'bg-violet-100 text-violet-700 border-violet-200' }
}

/* ── Modal ──────────────────────────────────────────── */
function Modal({ item, date, onClose }: { item: AnyContent; date: string; onClose: () => void }) {
  const c = getCfg(item)
  const Icon = c.icon
  const ps = getPublishStatus(date, item.kind === 'social' ? item.data.status : item.kind === 'blog' ? item.data.status : item.data.status)
  const PSIcon = ps.icon

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className={`h-9 w-9 rounded-xl ${c.bg} flex items-center justify-center shrink-0 mt-0.5`}>
              <Icon className={`h-4 w-4 ${c.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base leading-snug pr-6">{getTitle(item)}</DialogTitle>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Badge className={`text-xs border ${c.bg} ${c.color} ${c.border}`}>{getLabel(item)}</Badge>
                <Badge variant="outline" className={`text-xs flex items-center gap-1 ${ps.className}`}>
                  <PSIcon className="h-3 w-3" />{ps.label}
                </Badge>
                <span className="text-xs text-gray-400">
                  {new Date(date + 'T12:00:00').toLocaleDateString('en', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {item.kind === 'social' && (
            <>
              {item.data.image_url && (
                <img src={item.data.image_url} alt="" className="w-full h-52 object-cover rounded-xl" />
              )}
              {item.data.hook && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                  <p className="text-xs font-semibold text-amber-500 flex items-center gap-1 mb-1.5">
                    <Zap className="h-3 w-3" /> HOOK
                  </p>
                  <p className="font-semibold text-gray-900">{item.data.hook}</p>
                </div>
              )}
              {item.data.post_body && (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="text-xs font-semibold text-gray-500">POST BODY</p>
                    <CopyButton text={item.data.post_body} />
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{item.data.post_body}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{item.data.post_body.trim().split(/\s+/).length} words</p>
                </div>
              )}
              {item.data.hashtags && item.data.hashtags.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Hash className="h-3.5 w-3.5 text-gray-400" />
                    <p className="text-xs font-semibold text-gray-500">HASHTAGS</p>
                    <CopyButton text={item.data.hashtags.map(h => `#${h}`).join(' ')} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {item.data.hashtags.map((t, i) => (
                      <Badge key={i} variant="secondary" className={`text-xs border-0 ${c.color} ${c.bg}`}>#{t}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {item.kind === 'blog' && (
            <>
              {item.data.title && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <p className="text-xs font-semibold text-blue-400 mb-1">TITLE</p>
                  <p className="font-semibold text-gray-900">{item.data.title}</p>
                </div>
              )}
              {item.data.blog && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" /> BLOG
                    </p>
                    <CopyButton text={item.data.blog} />
                  </div>
                  <div className="prose prose-sm max-w-none bg-gray-50 p-4 rounded-xl max-h-64 overflow-y-auto">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.data.blog}</ReactMarkdown>
                  </div>
                </div>
              )}
            </>
          )}

          {item.kind === 'video' && (
            <>
              {item.data.hook && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                  <p className="text-xs font-semibold text-red-500 mb-1 flex items-center gap-1">
                    <Zap className="h-3 w-3" /> HOOK
                  </p>
                  <p className="font-semibold text-gray-900">"{item.data.hook}"</p>
                </div>
              )}
              {item.data.voiceover_script && (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="text-xs font-semibold text-gray-500">VOICEOVER SCRIPT</p>
                    <CopyButton text={item.data.voiceover_script} />
                  </div>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-xl font-sans max-h-48 overflow-y-auto">
                    {item.data.voiceover_script}
                  </pre>
                </div>
              )}
              {item.data.cta && (
                <div className="p-3 rounded-xl bg-green-50 border border-green-100">
                  <p className="text-xs font-semibold text-green-600 mb-1">CTA</p>
                  <p className="text-sm font-medium text-gray-800">{item.data.cta}</p>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ── Page ───────────────────────────────────────────── */
export default function CalendarPage() {
  const [items, setItems]       = useState<CalItem[]>([])
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selected, setSelected] = useState<CalItem | null>(null)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)

    const [social, blogs, videos] = await Promise.all([
      getSupabaseClient().from('social_content').select('*').eq('status', 'accepted').order('created_at'),
      getSupabaseClient().from('seo_blogs').select('*').eq('status', 'published').order('created_at'),
      getSupabaseClient().from('video_scripts').select('*').eq('status', 'done').order('created_at'),
    ])

    const all: { date: string; content: AnyContent }[] = []

    // Collect all content with their dates
    ;(social.data ?? []).forEach((r: SocialContent, idx: number) => {
      // Use generated_date if available, otherwise assign sequentially from today
      const base = r.generated_date
        ? r.generated_date.slice(0, 10)
        : addDays(new Date(), all.length + idx)
      all.push({ date: base, content: { kind: 'social', data: r as SocialContent & { image_url?: string } } })
    })
    ;(blogs.data ?? []).forEach((r: SeoBlog, idx: number) => {
      const base = addDays(new Date(), all.length + idx)
      all.push({ date: base, content: { kind: 'blog', data: r } })
    })
    ;(videos.data ?? []).forEach((r: VideoScript, idx: number) => {
      const base = r.generated_date
        ? r.generated_date.slice(0, 10)
        : addDays(new Date(), all.length + idx)
      all.push({ date: base, content: { kind: 'video', data: r } })
    })

    // Sort by date, then spread: if same date, offset by index to give each its own day
    all.sort((a, b) => a.date.localeCompare(b.date))

    // Ensure one item per day — spread duplicates onto consecutive days
    const used = new Set<string>()
    const spread: CalItem[] = all.map(item => {
      let d = item.date
      while (used.has(d)) d = addDays(new Date(d + 'T12:00:00'), 1)
      used.add(d)
      return { date: d, content: item.content }
    })

    setItems(spread)
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { load() }, [load])

  function addDays(d: Date, n: number) {
    const r = new Date(d)
    r.setDate(r.getDate() + n)
    return r.toISOString().split('T')[0]
  }

  const today = new Date().toISOString().split('T')[0]
  const published  = items.filter(i => i.date < today && i.content.kind === 'social' ? (i.content.data as SocialContent).status === 'done' : true).length
  const readyCount = items.filter(i => i.date === today).length
  const scheduled  = items.filter(i => i.date > today).length

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center shadow-lg">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Content Calendar</h1>
            <p className="text-sm text-gray-500">One post per day — click any card to view full content</p>
          </div>
        </div>
        <Button variant="outline" size="sm"
          onClick={() => { setRefreshing(true); load(true) }}
          disabled={refreshing} className="gap-1.5">
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <BrandContextBar />

      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No accepted content yet"
          description="Accept social posts from the Social Content page to see them scheduled here."
        />
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Published',        count: published,  icon: CheckCircle2, cls: 'text-green-600 bg-green-50 border-green-100' },
              { label: 'Ready to Publish', count: readyCount, icon: Send,         cls: 'text-blue-600 bg-blue-50 border-blue-100' },
              { label: 'Scheduled',        count: scheduled,  icon: Clock,        cls: 'text-violet-600 bg-violet-50 border-violet-100' },
            ].map(s => (
              <div key={s.label} className={`rounded-xl border p-4 flex items-center gap-3 ${s.cls}`}>
                <s.icon className="h-5 w-5 shrink-0" />
                <div>
                  <p className="text-xl font-bold leading-tight">{s.count}</p>
                  <p className="text-xs opacity-75">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* One item per day list */}
          <div className="space-y-3">
            {items.map((item, idx) => {
              const c   = getCfg(item.content)
              const Icon = c.icon
              const ps  = getPublishStatus(item.date, 'done')
              const PSIcon = ps.icon
              const dateObj = new Date(item.date + 'T12:00:00')
              const isToday = item.date === today
              const title   = getTitle(item.content)
              const preview = getPreview(item.content)

              return (
                <div
                  key={idx}
                  onClick={() => setSelected(item)}
                  className={`rounded-2xl border bg-white p-4 cursor-pointer transition-all hover:shadow-md flex items-center gap-4
                    ${isToday ? 'ring-2 ring-violet-400 ring-offset-1 border-transparent' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  {/* Date column */}
                  <div className={`shrink-0 w-16 text-center rounded-xl py-2.5 ${isToday ? 'bg-gradient-to-br from-violet-500 to-purple-600' : 'bg-gray-50'}`}>
                    <p className={`text-xs font-semibold uppercase ${isToday ? 'text-violet-100' : 'text-gray-400'}`}>
                      {DAY_NAMES[dateObj.getDay()].slice(0, 3)}
                    </p>
                    <p className={`text-xl font-bold leading-tight ${isToday ? 'text-white' : 'text-gray-800'}`}>
                      {dateObj.getDate()}
                    </p>
                    <p className={`text-xs ${isToday ? 'text-violet-200' : 'text-gray-400'}`}>
                      {dateObj.toLocaleDateString('en', { month: 'short' })}
                    </p>
                  </div>

                  {/* Platform icon */}
                  <div className={`h-10 w-10 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-5 w-5 ${c.color}`} />
                  </div>

                  {/* Content info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs font-semibold ${c.color}`}>{getLabel(item.content)}</span>
                      <Badge variant="outline" className={`text-xs flex items-center gap-1 py-0 ${ps.className}`}>
                        <PSIcon className="h-2.5 w-2.5" />
                        {ps.label}
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-1">{title}</p>
                    {preview && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{preview}</p>
                    )}
                  </div>

                  {/* View button */}
                  <div className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                    ${c.bg} ${c.color} ${c.border} hover:brightness-95`}>
                    <ExternalLink className="h-3 w-3" />
                    View
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {selected && (
        <Modal item={selected.content} date={selected.date} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
