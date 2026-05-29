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
import type { SeoBlog } from '@/lib/supabase/types'
import {
  FileText, Sparkles, BookOpen, Clock,
  ChevronDown, Eye, Globe, Mic, Target,
  Users, Layers, Search, Send, CheckCircle2,
} from 'lucide-react'

/* ── Dropdown ───────────────────────────────────────── */
function Select({ label: lbl, icon: Icon, value, onChange, options }: {
  label: string; icon: React.ElementType; value: string
  onChange: (v: string) => void; options: string[]
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-gray-400" />{lbl}
      </Label>
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)}
          className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm
            text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 pr-8 cursor-pointer">
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
      </div>
    </div>
  )
}

/* ── Blog Preview ───────────────────────────────────── */
function BlogPreview({
  blog, generating, onPublish, published,
}: {
  blog: SeoBlog | null
  generating: boolean
  onPublish: () => void
  published: boolean
}) {
  if (generating) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-800">AI is writing your blog…</p>
          <p className="text-sm text-gray-400 mt-1">This may take 15–30 seconds</p>
        </div>
        <div className="flex gap-1 mt-2">
          {[0,1,2].map(i => (
            <div key={i} className="h-1.5 w-8 rounded-full bg-violet-200 overflow-hidden">
              <div className="h-full w-full bg-violet-500 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!blog) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center px-8">
        <div className="h-16 w-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
          <Eye className="h-7 w-7 text-blue-400" />
        </div>
        <p className="font-semibold text-gray-700">Preview will appear here</p>
        <p className="text-sm text-gray-400 mt-1">Fill in the form and click Generate</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Sticky header */}
      <div className="shrink-0 sticky top-0 z-10 px-6 py-3 bg-white border-b border-gray-100 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-gray-900 text-sm leading-snug line-clamp-1">
            {blog.title ?? 'Untitled Blog'}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(blog.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {published
            ? <Badge className="bg-green-100 text-green-700 border-0 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Published</Badge>
            : <Badge className="bg-amber-100 text-amber-700 border-0">Draft</Badge>
          }
          {blog.blog && <CopyButton text={blog.blog.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()} />}
        </div>
      </div>

      {/* Blog HTML content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {blog.blog ? (
          <div
            className="blog-content max-w-none"
            dangerouslySetInnerHTML={{ __html: blog.blog }}
          />
        ) : (
          <p className="text-sm text-gray-400 italic">No content yet.</p>
        )}
      </div>

      {/* Publish button pinned to bottom */}
      <div className="shrink-0 border-t border-gray-100 bg-white px-6 py-4">
        {published ? (
          <div className="flex items-center justify-center gap-2 py-2 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-semibold">Blog Published Successfully!</span>
          </div>
        ) : (
          <Button
            onClick={onPublish}
            className="w-full h-11 gap-2 bg-gradient-to-r from-green-500 to-emerald-600
              hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-100 font-semibold"
          >
            <Send className="h-4 w-4" />
            Publish Blog
          </Button>
        )}
      </div>
    </div>
  )
}

/* ── Page ───────────────────────────────────────────── */
export default function BlogPage() {
  const { profile } = useBrandProfile()

  const [topic,    setTopic]    = useState('')
  const [language, setLanguage] = useState('English')
  const [tone,     setTone]     = useState('Professional')
  const [length,   setLength]   = useState('Medium (1000 words)')
  const [audience, setAudience] = useState('Business Owners')
  const [seoFocus, setSeoFocus] = useState('Informational')
  const [style,    setStyle]    = useState('How-to Guide')

  const [blogs,      setBlogs]      = useState<SeoBlog[]>([])
  const [selected,   setSelected]   = useState<SeoBlog | null>(null)
  const [generating, setGenerating] = useState(false)
  const [loading,    setLoading]    = useState(true)
  const [published,  setPublished]  = useState(false)

  const loadBlogs = useCallback(async () => {
    const { data } = await getSupabaseClient()
      .from('seo_blogs').select('*').order('created_at', { ascending: false }).limit(20)
    const all = (data ?? []) as SeoBlog[]
    setBlogs(all)
    setLoading(false)
    if (!selected) setSelected(all.find(b => b.blog) ?? null)
  }, [selected])

  useEffect(() => { loadBlogs() }, [loadBlogs])

  const handleGenerate = async () => {
    if (!topic.trim()) { toast.error('Enter a topic first'); return }
    setGenerating(true)
    setPublished(false)
    setSelected(null)

    try {
      const res = await fetch(
        'https://n8n.srv997749.hstgr.cloud/webhook/15757ff2-f8ea-417b-b7fc-4c9d6b422f50',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic, language, tone, length, audience,
            seo_focus: seoFocus, style,
            brand_name:        profile?.brand_name ?? '',
            industry:          profile?.industry ?? '',
            target_audience:   profile?.target_audience ?? '',
            brand_description: profile?.brand_description ?? '',
          }),
        }
      )

      if (!res.ok) throw new Error(`Webhook returned ${res.status}`)

      // n8n responds directly with the blog row(s)
      const json = await res.json()
      // Response is an array [ { id, status, title, blog, ... } ]
      const row: SeoBlog = Array.isArray(json) ? json[0] : json

      if (row?.title || row?.blog) {
        setSelected(row)
        setBlogs(prev => [row, ...prev.filter(b => b.id !== row.id)])
        toast.success('Blog generated!')
      } else {
        toast.error('Received empty response from n8n')
      }
    } catch (err) {
      toast.error('Failed to generate blog — check n8n is running')
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  const handlePublish = async () => {
    if (!selected?.id) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (getSupabaseClient().from('seo_blogs') as any)
      .update({ status: 'published' })
      .eq('id', selected.id)
    setPublished(true)
    setBlogs(prev => prev.map(b => b.id === selected.id ? { ...b, status: 'published' } : b))
    toast.success('Blog published!')
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Blog content styles */}
      <style>{`
        .blog-content h1 { font-size: 1.5rem; font-weight: 800; color: #111827; margin: 0 0 1rem; line-height: 1.3; }
        .blog-content h2 { font-size: 1.2rem; font-weight: 700; color: #1f2937; margin: 1.75rem 0 0.75rem; }
        .blog-content h3 { font-size: 1rem; font-weight: 700; color: #374151; margin: 1.25rem 0 0.5rem; }
        .blog-content p  { font-size: 0.9rem; color: #374151; line-height: 1.75; margin: 0.75rem 0; }
        .blog-content ul, .blog-content ol { padding-left: 1.5rem; margin: 0.75rem 0; }
        .blog-content li { font-size: 0.9rem; color: #374151; line-height: 1.7; margin: 0.3rem 0; }
        .blog-content strong { font-weight: 700; color: #111827; }
        .blog-content blockquote { border-left: 3px solid #8b5cf6; padding: 0.75rem 1rem; background: #f5f3ff; border-radius: 0 0.5rem 0.5rem 0; margin: 1rem 0; }
        .blog-content blockquote p { color: #4b5563; font-style: italic; margin: 0; }
        .blog-content a.cta { display: inline-block; margin: 0.2rem 0.3rem; padding: 0.3rem 0.75rem; background: #ede9fe; color: #7c3aed; border-radius: 0.375rem; font-size: 0.8rem; font-weight: 600; text-decoration: none; }
        .blog-content a.cta:hover { background: #ddd6fe; }
        .blog-content a:not(.cta) { color: #2563eb; text-decoration: underline; }
      `}</style>

      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-gray-100 bg-white shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">SEO Blog Generator</h1>
            <p className="text-xs text-gray-500">AI-written, brand-aligned blogs</p>
          </div>
          {blogs.filter(b => b.blog).length > 0 && (
            <Badge className="ml-auto bg-blue-100 text-blue-700 border-0">
              {blogs.filter(b => b.blog).length} blogs
            </Badge>
          )}
        </div>
        <BrandContextBar />
      </div>

      {/* Split body */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT — Input */}
        <div className="w-72 shrink-0 border-r border-gray-100 bg-white flex flex-col overflow-y-auto">
          <div className="p-5 space-y-4 flex-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">New Blog</p>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-gray-400" /> Topic *
              </Label>
              <Input
                placeholder="e.g. How to automate your business"
                value={topic} onChange={e => setTopic(e.target.value)}
                className="bg-gray-50 border-gray-200 text-sm"
                onKeyDown={e => e.key === 'Enter' && handleGenerate()}
              />
            </div>

            <Select label="Language"        icon={Globe}     value={language} onChange={setLanguage}
              options={['English','Hindi','Spanish','French','German','Portuguese','Arabic','Japanese']} />
            <Select label="Tone"            icon={Mic}       value={tone}     onChange={setTone}
              options={['Professional','Casual','Friendly','Authoritative','Persuasive','Educational','Storytelling']} />
            <Select label="Content Length"  icon={Layers}    value={length}   onChange={setLength}
              options={['Short (500 words)','Medium (1000 words)','Long (2000 words)','Detailed (3000+ words)']} />
            <Select label="Target Audience" icon={Users}     value={audience} onChange={setAudience}
              options={['Business Owners','Founders','Marketers','Developers','General Audience','Students','Executives']} />
            <Select label="SEO Focus"       icon={Search}    value={seoFocus} onChange={setSeoFocus}
              options={['Informational','Commercial','Navigational','Transactional','Comparison','Listicle']} />
            <Select label="Content Style"   icon={BookOpen}  value={style}    onChange={setStyle}
              options={['How-to Guide','Thought Leadership','Case Study','Listicle','Tutorial','Problem-Solution']} />
          </div>

          <div className="p-5 border-t border-gray-100 shrink-0">
            <Button onClick={handleGenerate} disabled={generating}
              className="w-full gap-2 bg-gradient-to-r from-violet-600 to-blue-600
                hover:from-violet-700 hover:to-blue-700 text-white h-11 shadow-lg shadow-violet-100">
              {generating
                ? <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating…</>
                : <><Sparkles className="h-4 w-4" /> Generate Blog</>}
            </Button>
          </div>
        </div>

        {/* MIDDLE — Blog list */}
        {blogs.filter(b => b.blog).length > 0 && (
          <div className="w-52 shrink-0 border-r border-gray-100 bg-white overflow-y-auto">
            <div className="p-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">All Blogs</p>
              <div className="space-y-1">
                {blogs.filter(b => b.blog).map(b => (
                  <button key={b.id} onClick={() => { setSelected(b); setPublished(b.status === 'published') }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all
                      ${selected?.id === b.id ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <p className={`font-medium leading-snug line-clamp-2 mb-1 ${selected?.id === b.id ? 'text-blue-800' : ''}`}>
                      {b.title ?? 'Untitled'}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-2.5 w-2.5 text-gray-300" />
                      <span className="text-gray-400">
                        {new Date(b.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                      </span>
                      {b.status === 'published' && (
                        <Badge className="text-xs bg-green-100 text-green-600 border-0 py-0 px-1.5 ml-auto">Live</Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* RIGHT — Preview */}
        <div className="flex-1 overflow-hidden bg-white">
          {loading
            ? <div className="p-6 space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}</div>
            : <BlogPreview
                blog={selected}
                generating={generating}
                onPublish={handlePublish}
                published={published}
              />
          }
        </div>
      </div>
    </div>
  )
}
