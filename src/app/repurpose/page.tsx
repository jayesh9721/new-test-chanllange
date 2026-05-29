'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useBrandProfile } from '@/hooks/useBrandProfile'
import { BrandContextBar } from '@/components/layout/BrandContextBar'
import { CopyButton } from '@/components/shared/CopyButton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import type { RepurposedContent } from '@/lib/supabase/types'
import {
  RefreshCw, Sparkles, ArrowRight, Clock,
  ChevronDown, Eye, LayoutList, Camera,
  MessageCircle, FileText, Video, Globe,
  Users, Mail, Link2,
} from 'lucide-react'

/* ── Config ─────────────────────────────────────────── */
const SOURCE_PLATFORMS = [
  { value: 'LinkedIn Post',   icon: LayoutList,    color: 'text-blue-600',   bg: 'bg-blue-50',    placeholder: 'https://linkedin.com/posts/...' },
  { value: 'Instagram Post',  icon: Camera,        color: 'text-pink-600',   bg: 'bg-pink-50',    placeholder: 'https://instagram.com/p/...' },
  { value: 'YouTube Video',   icon: Video,         color: 'text-red-600',    bg: 'bg-red-50',     placeholder: 'https://youtube.com/watch?v=...' },
  { value: 'Twitter/X Post',  icon: MessageCircle, color: 'text-sky-600',    bg: 'bg-sky-50',     placeholder: 'https://twitter.com/user/status/...' },
  { value: 'Facebook Post',   icon: Users,         color: 'text-indigo-600', bg: 'bg-indigo-50',  placeholder: 'https://facebook.com/...' },
  { value: 'Blog / Article',  icon: FileText,      color: 'text-violet-600', bg: 'bg-violet-50',  placeholder: 'https://yourblog.com/article/...' },
  { value: 'Website Page',    icon: Globe,         color: 'text-teal-600',   bg: 'bg-teal-50',    placeholder: 'https://yoursite.com/page' },
]

const OUTPUT_PLATFORMS = [
  { value: 'LinkedIn Post',      icon: LayoutList,    color: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-200' },
  { value: 'Instagram Caption',  icon: Camera,        color: 'text-pink-700',   bg: 'bg-pink-50',    border: 'border-pink-200' },
  { value: 'Twitter Thread',     icon: MessageCircle, color: 'text-sky-700',    bg: 'bg-sky-50',     border: 'border-sky-200' },
  { value: 'Facebook Post',      icon: Users,         color: 'text-indigo-700', bg: 'bg-indigo-50',  border: 'border-indigo-200' },
  { value: 'YouTube Script',     icon: Video,         color: 'text-red-700',    bg: 'bg-red-50',     border: 'border-red-200' },
  { value: 'Blog Article',       icon: FileText,      color: 'text-violet-700', bg: 'bg-violet-50',  border: 'border-violet-200' },
  { value: 'Email Newsletter',   icon: Mail,          color: 'text-teal-700',   bg: 'bg-teal-50',    border: 'border-teal-200' },
]

/* ── Preview Panel ──────────────────────────────────── */
function Preview({ item, generating }: { item: RepurposedContent | null; generating: boolean }) {
  if (generating) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
        <div className="h-12 w-12 rounded-full border-4 border-teal-200 border-t-teal-600 animate-spin" />
        <div className="text-center">
          <p className="font-semibold text-gray-800">Repurposing your content…</p>
          <p className="text-sm text-gray-400 mt-1">This may take 10–20 seconds</p>
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center px-8">
        <div className="h-16 w-16 rounded-2xl bg-teal-50 flex items-center justify-center mb-4">
          <Eye className="h-7 w-7 text-teal-400" />
        </div>
        <p className="font-semibold text-gray-700">Repurposed output will appear here</p>
        <p className="text-sm text-gray-400 mt-1">Select a source, choose output format, click Repurpose</p>
      </div>
    )
  }

  const src = SOURCE_PLATFORMS.find(p => p.value === item.source_type)
  const out = OUTPUT_PLATFORMS.find(p => p.value === item.target_format)
  const SrcIcon = src?.icon ?? Link2
  const OutIcon = out?.icon ?? FileText

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-6 py-3 bg-white border-b border-gray-100 flex items-center gap-3">
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${src?.bg} ${src?.color}`}>
          <SrcIcon className="h-3 w-3" />{item.source_type}
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${out?.bg} ${out?.color} ${out?.border}`}>
          <OutIcon className="h-3 w-3" />{item.target_format}
        </div>
        <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {new Date(item.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
        </span>
        {item.repurposed_output && <CopyButton text={item.repurposed_output} />}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {item.repurposed_output ? (
          <div className="prose prose-sm max-w-none prose-p:text-gray-700 prose-p:leading-relaxed prose-headings:text-gray-900">
            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{item.repurposed_output}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">No output yet.</p>
        )}
      </div>
    </div>
  )
}

/* ── Page ───────────────────────────────────────────── */
export default function RepurposePage() {
  const { profile } = useBrandProfile()

  const [sourceType,    setSourceType]    = useState(SOURCE_PLATFORMS[0].value)
  const [sourceUrl,     setSourceUrl]     = useState('')
  const [targetFormat,  setTargetFormat]  = useState(OUTPUT_PLATFORMS[0].value)
  const [generating,    setGenerating]    = useState(false)
  const [selected,      setSelected]      = useState<RepurposedContent | null>(null)
  const [history,       setHistory]       = useState<RepurposedContent[]>([])
  const [loading,       setLoading]       = useState(true)

  const srcConfig = SOURCE_PLATFORMS.find(p => p.value === sourceType)!

  const loadHistory = useCallback(async () => {
    const { data } = await getSupabaseClient()
      .from('repurposed_content')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    const all = (data ?? []) as RepurposedContent[]
    setHistory(all)
    setLoading(false)
    if (!selected && all.length > 0) setSelected(all[0])
  }, [selected])

  useEffect(() => { loadHistory() }, [loadHistory])

  const handleRepurpose = async () => {
    if (!sourceUrl.trim()) { toast.error('Enter a source URL'); return }
    setGenerating(true)
    setSelected(null)

    try {
      const res = await fetch(
        'https://n8n.srv997749.hstgr.cloud/webhook/repurpose',  // replace with real webhook
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source_type:    sourceType,
            source_url:     sourceUrl,
            target_format:  targetFormat,
            brand_name:     profile?.brand_name ?? '',
            industry:       profile?.industry ?? '',
            tone:           profile?.tone ?? '',
            target_audience: profile?.target_audience ?? '',
          }),
        }
      )

      if (res.ok) {
        const json = await res.json()
        const row: RepurposedContent = Array.isArray(json) ? json[0] : json
        if (row?.repurposed_output || row?.id) {
          setSelected(row)
          setHistory(prev => [row, ...prev.filter(h => h.id !== row.id)])
          toast.success('Content repurposed!')
        } else {
          toast.error('Empty response from n8n')
        }
      } else {
        // Mock fallback for demo
        toast.info('Webhook not yet connected — showing mock output')
        const mock: RepurposedContent = {
          id: Date.now().toString(),
          brand_profile_id: null,
          source_type: sourceType,
          target_format: targetFormat,
          source_content_id: null,
          status: 'done',
          repurposed_output: `[Mock Output for ${targetFormat}]\n\nThis is where your repurposed content from "${sourceType}" will appear.\n\nConnect your n8n webhook to see live AI-generated output here.`,
          generated_date: new Date().toISOString().split('T')[0],
          error_message: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setSelected(mock)
      }
    } catch {
      toast.error('Failed to reach webhook')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-gray-100 bg-white shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-md">
            <RefreshCw className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Content Repurposer</h1>
            <p className="text-xs text-gray-500">Transform any content for a new platform</p>
          </div>
          {history.length > 0 && (
            <Badge className="ml-auto bg-teal-100 text-teal-700 border-0">{history.length} repurposed</Badge>
          )}
        </div>
        <BrandContextBar />
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* LEFT — Input */}
        <div className="w-72 shrink-0 border-r border-gray-100 bg-white flex flex-col overflow-y-auto">
          <div className="p-5 flex-1 space-y-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Source Content</p>

            {/* Source platform */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-600">Source Platform</Label>
              <div className="relative">
                <select
                  value={sourceType}
                  onChange={e => { setSourceType(e.target.value); setSourceUrl('') }}
                  className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm
                    text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-300 pr-8 cursor-pointer"
                >
                  {SOURCE_PLATFORMS.map(p => <option key={p.value}>{p.value}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Source URL */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5 text-gray-400" />
                Source URL *
              </Label>
              <div className="relative">
                <div className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded flex items-center justify-center ${srcConfig.bg}`}>
                  <srcConfig.icon className={`h-3 w-3 ${srcConfig.color}`} />
                </div>
                <Input
                  placeholder={srcConfig.placeholder}
                  value={sourceUrl}
                  onChange={e => setSourceUrl(e.target.value)}
                  className="bg-gray-50 border-gray-200 text-sm pl-10"
                  onKeyDown={e => e.key === 'Enter' && handleRepurpose()}
                />
              </div>
            </div>

            <div className="h-px bg-gray-100" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Output Format</p>

            {/* Output platform grid */}
            <div className="grid grid-cols-1 gap-2">
              {OUTPUT_PLATFORMS.map(p => {
                const Icon = p.icon
                const active = targetFormat === p.value
                return (
                  <button
                    key={p.value}
                    onClick={() => setTargetFormat(p.value)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all ${
                      active
                        ? `${p.bg} ${p.border} ${p.color} font-semibold`
                        : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${active ? p.color : 'text-gray-400'}`} />
                    <span className="text-sm">{p.value}</span>
                    {active && <div className="ml-auto h-2 w-2 rounded-full bg-current" />}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="p-5 border-t border-gray-100 shrink-0">
            <Button
              onClick={handleRepurpose}
              disabled={generating}
              className="w-full gap-2 bg-gradient-to-r from-teal-500 to-emerald-500
                hover:from-teal-600 hover:to-emerald-600 text-white h-11 shadow-lg shadow-teal-100"
            >
              {generating
                ? <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Repurposing…</>
                : <><Sparkles className="h-4 w-4" /> Repurpose Content</>
              }
            </Button>
          </div>
        </div>

        {/* MIDDLE — History list */}
        {history.length > 0 && (
          <div className="w-52 shrink-0 border-r border-gray-100 bg-white overflow-y-auto">
            <div className="p-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">History</p>
              <div className="space-y-1">
                {history.map(item => {
                  const src = SOURCE_PLATFORMS.find(p => p.value === item.source_type)
                  const out = OUTPUT_PLATFORMS.find(p => p.value === item.target_format)
                  const SrcIcon = src?.icon ?? Link2
                  const OutIcon = out?.icon ?? FileText
                  return (
                    <button key={item.id}
                      onClick={() => setSelected(item)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all
                        ${selected?.id === item.id ? 'bg-teal-50' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <SrcIcon className={`h-3 w-3 ${src?.color ?? 'text-gray-400'}`} />
                        <ArrowRight className="h-2.5 w-2.5 text-gray-300" />
                        <OutIcon className={`h-3 w-3 ${out?.color ?? 'text-gray-400'}`} />
                      </div>
                      <p className="font-medium text-gray-700 line-clamp-1">{item.target_format}</p>
                      <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{item.source_type}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* RIGHT — Preview */}
        <div className="flex-1 overflow-hidden bg-white">
          {loading
            ? <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}</div>
            : <Preview item={selected} generating={generating} />
          }
        </div>
      </div>
    </div>
  )
}
