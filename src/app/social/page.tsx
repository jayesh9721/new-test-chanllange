'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getSupabaseClient } from '@/lib/supabase/client'
import { BrandContextBar } from '@/components/layout/BrandContextBar'
import { GeneratingState } from '@/components/shared/GeneratingState'
import { EmptyState } from '@/components/shared/EmptyState'
import { CopyButton } from '@/components/shared/CopyButton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import type { SocialContent } from '@/lib/supabase/types'
import {
  Share2, Hash, Zap, LayoutList, Camera, MessageCircle,
  Clock, ImageIcon, CheckCircle2, RefreshCw, ChevronDown,
  Send, X,
} from 'lucide-react'

/* ── Platform config ─────────────────────────────────── */
const PLATFORMS = ['All', 'LinkedIn', 'Instagram', 'Twitter']

const P_CONFIG: Record<string, {
  icon: React.ElementType; accent: string; bg: string; border: string; badge: string; limit: string; limitNote: string
}> = {
  LinkedIn:  { icon: LayoutList,    accent: 'text-blue-600',  bg: 'bg-blue-50',  border: 'border-blue-100',  badge: 'bg-blue-100 text-blue-700',  limit: '~300 words',      limitNote: 'Professional · Long-form' },
  Instagram: { icon: Camera,        accent: 'text-pink-600',  bg: 'bg-pink-50',  border: 'border-pink-100',  badge: 'bg-pink-100 text-pink-700',  limit: '≤150 words',      limitNote: 'Visual · Casual · Emojis' },
  Twitter:   { icon: MessageCircle, accent: 'text-sky-500',   bg: 'bg-sky-50',   border: 'border-sky-100',   badge: 'bg-sky-100 text-sky-700',    limit: '≤280 chars/tweet', limitNote: 'Short · Punchy · Thread' },
}

const RETRY_TONES = ['Same tone', 'More casual', 'More professional', 'More persuasive', 'Shorter', 'Longer', 'Add more emojis']

/* ── Retry Dialog ───────────────────────────────────── */
function RetryDialog({
  post,
  open,
  onClose,
  onRetrying,
}: {
  post: SocialContent
  open: boolean
  onClose: () => void
  onRetrying: (id: string) => void
}) {
  const [instructions, setInstructions] = useState('')
  const [tone,         setTone]         = useState('Same tone')
  const [sending,      setSending]      = useState(false)

  const handleRetry = async () => {
    setSending(true)
    try {
      // Mock webhook — replace with real URL when ready
      await fetch('https://n8n.srv997749.hstgr.cloud/webhook/social-retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_id:    post.id,
          platform:       post.platform,
          original_hook:  post.hook,
          original_body:  post.post_body,
          hashtags:       post.hashtags,
          instructions:   instructions.trim() || 'Regenerate with improvements',
          tone_adjustment: tone,
        }),
      }).catch(() => null) // graceful fail for mock

      // Mark row as pending in Supabase so UI shows retrying state
      await getSupabaseClient()
        .from('social_content')
        .update({ status: 'pending' } as never)
        .eq('id', post.id)

      onRetrying(post.id)
      toast.info(`Retry sent for ${post.platform} post`)
      onClose()
    } catch {
      toast.error('Failed to send retry request')
    } finally {
      setSending(false)
      setInstructions('')
      setTone('Same tone')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-orange-500" />
            Retry — {post.platform} Post
          </DialogTitle>
        </DialogHeader>

        {/* Original hook preview */}
        {post.hook && (
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-600 italic">
            "{post.hook}"
          </div>
        )}

        <div className="space-y-4 mt-1">
          {/* Tone adjustment */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600">Tone Adjustment</Label>
            <div className="flex flex-wrap gap-2">
              {RETRY_TONES.map(t => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    tone === t
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Custom instructions */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600">
              Specific Instructions <span className="text-gray-400 font-normal">(optional)</span>
            </Label>
            <Textarea
              placeholder={`e.g. "Add a specific stat", "Make the hook more punchy", "Focus on ROI instead of time saving"`}
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              className="min-h-[90px] text-sm bg-gray-50 border-gray-200 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            <X className="h-3.5 w-3.5 mr-1.5" /> Cancel
          </Button>
          <Button
            onClick={handleRetry}
            disabled={sending}
            className="flex-1 gap-1.5 bg-orange-500 hover:bg-orange-600 text-white"
          >
            {sending
              ? <><div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending…</>
              : <><Send className="h-3.5 w-3.5" /> Send Retry</>
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ── Single post card ────────────────────────────────── */
function SocialCard({
  post,
  onAccept,
  onRetry,
  accepted,
}: {
  post: SocialContent & { image_url?: string }
  onAccept: (id: string) => void
  onRetry:  (post: SocialContent) => void
  accepted: boolean
}) {
  const cfg = P_CONFIG[post.platform]
  const [expanded, setExpanded] = useState(false)

  if (!cfg) return null

  if (post.status === 'pending' || post.status === 'processing') {
    return (
      <div className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-6`}>
        <GeneratingState message={`Generating ${post.platform} post…`} />
      </div>
    )
  }

  const PIcon = cfg.icon
  const copyAll = [post.hook, post.post_body, post.hashtags?.map(h => `#${h}`).join(' ')].filter(Boolean).join('\n\n')
  const isLong = post.post_body && post.post_body.split('\n').length > 6
  const wordCount = post.post_body?.trim().split(/\s+/).filter(Boolean).length ?? 0

  return (
    <div className={`rounded-2xl border ${cfg.border} bg-white shadow-sm hover:shadow-md transition-all overflow-hidden`}>
      {/* Platform header */}
      <div className={`${cfg.bg} px-5 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-white flex items-center justify-center shadow-sm">
            <PIcon className={`h-3.5 w-3.5 ${cfg.accent}`} />
          </div>
          <span className={`text-sm font-semibold ${cfg.accent}`}>{post.platform}</span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-500">{cfg.limitNote}</span>
        </div>
        <div className="flex items-center gap-2">
          {post.generated_date && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(post.generated_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            </span>
          )}
          <Badge className={`text-xs border-0 ${cfg.badge}`}>{cfg.limit}</Badge>
        </div>
      </div>

      <div className="flex gap-0">
        {/* Image */}
        {post.image_url && (
          <div className="w-48 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.image_url} alt="" className="w-full h-full object-cover" style={{ minHeight: '180px', maxHeight: '280px' }} />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-5 space-y-3 min-w-0 flex flex-col">
          {/* Hook */}
          {post.hook && (
            <div className="flex items-start gap-2">
              <Zap className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-sm font-semibold text-gray-900 leading-snug">{post.hook}</p>
            </div>
          )}

          {/* Body */}
          {post.post_body && (
            <div>
              <div className={`text-sm text-gray-700 leading-relaxed whitespace-pre-wrap ${!expanded && isLong ? 'line-clamp-5' : ''}`}>
                {post.post_body}
              </div>
              {isLong && (
                <button onClick={() => setExpanded(!expanded)}
                  className={`text-xs font-medium mt-1 ${cfg.accent}`}>
                  {expanded ? 'Show less' : 'Read more…'}
                </button>
              )}
              <span className="text-xs text-gray-400 mt-1 block">{wordCount} words</span>
            </div>
          )}

          {/* Hashtags */}
          {post.hashtags && post.hashtags.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-1.5">
                <Hash className="h-3 w-3 text-gray-400" />
                <span className="text-xs font-medium text-gray-500">Hashtags</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {post.hashtags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className={`text-xs ${cfg.accent} ${cfg.bg} border-0`}>#{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* ── Action bar ── */}
          <div className="flex items-center gap-2 pt-2 mt-auto border-t border-gray-100">
            <CopyButton text={copyAll} />

            <div className="flex-1" />

            {/* Retry */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRetry(post)}
              className="gap-1.5 text-orange-600 border-orange-200 hover:bg-orange-50 hover:border-orange-300"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </Button>

            {/* Accept */}
            {accepted ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-xs font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Accepted
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => onAccept(post.id)}
                className="gap-1.5 bg-green-500 hover:bg-green-600 text-white border-0"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Accept
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Page ────────────────────────────────────────────── */
export default function SocialPage() {
  const [posts,        setPosts]        = useState<(SocialContent & { image_url?: string })[]>([])
  const [loading,      setLoading]      = useState(true)
  const [activeFilter, setActiveFilter] = useState('All')
  const [acceptedIds,  setAcceptedIds]  = useState<Set<string>>(new Set())
  const [retryPost,    setRetryPost]    = useState<SocialContent | null>(null)

  const loadPosts = () => {
    getSupabaseClient()
      .from('social_content')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => {
        setPosts((data ?? []) as (SocialContent & { image_url?: string })[])
        setLoading(false)
      })
  }

  useEffect(() => {
    loadPosts()
    const interval = setInterval(() => {
      const hasPending = posts.some(p => p.status === 'pending' || p.status === 'processing')
      if (hasPending) loadPosts()
    }, 4000)
    return () => clearInterval(interval)
  }, [posts])

  const handleAccept = async (id: string) => {
    setAcceptedIds(prev => new Set([...prev, id]))
    await getSupabaseClient()
      .from('social_content')
      .update({ status: 'accepted' } as never)
      .eq('id', id)
    toast.success('Post accepted!')
  }

  const handleRetrying = (id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, status: 'pending' } : p))
  }

  const filtered = activeFilter === 'All' ? posts : posts.filter(p => p.platform === activeFilter)

  const grouped = PLATFORMS.slice(1).reduce<Record<string, typeof filtered>>((acc, p) => {
    acc[p] = filtered.filter(post => post.platform === p)
    return acc
  }, {})

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg">
            <Share2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Social Content</h1>
            <p className="text-sm text-gray-500">Auto-generated daily posts for all platforms</p>
          </div>
          {posts.length > 0 && (
            <Badge className="ml-auto bg-pink-100 text-pink-700 border-0">{posts.length} posts</Badge>
          )}
        </div>
      </div>

      <BrandContextBar />

      {/* Platform legend */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        {Object.entries(P_CONFIG).map(([platform, cfg]) => {
          const Icon = cfg.icon
          return (
            <div key={platform} className={`rounded-xl border ${cfg.border} ${cfg.bg} px-4 py-3`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`h-3.5 w-3.5 ${cfg.accent}`} />
                <span className={`text-xs font-semibold ${cfg.accent}`}>{platform}</span>
              </div>
              <p className="text-xs text-gray-600 font-medium">{cfg.limit}</p>
              <p className="text-xs text-gray-400">{cfg.limitNote}</p>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {PLATFORMS.map(p => (
          <button key={p} onClick={() => setActiveFilter(p)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
              activeFilter === p ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}>
            {p}
          </button>
        ))}
        {filtered.length > 0 && (
          <span className="ml-auto text-xs text-gray-400 self-center">{filtered.length} posts</span>
        )}
      </div>

      {/* Accepted counter */}
      {acceptedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-50 border border-green-100">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-700">{acceptedIds.size} post{acceptedIds.size > 1 ? 's' : ''} accepted</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-52 w-full rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No social posts yet" description="n8n automatically generates posts daily based on your content strategy." />
      ) : activeFilter !== 'All' ? (
        <div className="space-y-4">
          {filtered.map(post => (
            <SocialCard key={post.id} post={post}
              accepted={acceptedIds.has(post.id) || post.status === 'accepted'}
              onAccept={handleAccept}
              onRetry={setRetryPost}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {PLATFORMS.slice(1).map(platform => {
            const platformPosts = grouped[platform]
            if (!platformPosts?.length) return null
            const cfg = P_CONFIG[platform]
            const Icon = cfg.icon
            return (
              <div key={platform}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`h-6 w-6 rounded-lg ${cfg.bg} flex items-center justify-center`}>
                    <Icon className={`h-3.5 w-3.5 ${cfg.accent}`} />
                  </div>
                  <h2 className="text-sm font-semibold text-gray-700">{platform}</h2>
                  <Badge variant="outline" className="text-xs">{platformPosts.length}</Badge>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                <div className="space-y-3">
                  {platformPosts.map(post => (
                    <SocialCard key={post.id} post={post}
                      accepted={acceptedIds.has(post.id) || post.status === 'accepted'}
                      onAccept={handleAccept}
                      onRetry={setRetryPost}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Retry dialog */}
      {retryPost && (
        <RetryDialog
          post={retryPost}
          open={!!retryPost}
          onClose={() => setRetryPost(null)}
          onRetrying={handleRetrying}
        />
      )}
    </div>
  )
}
