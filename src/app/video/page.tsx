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
import type { VideoScript, Json } from '@/lib/supabase/types'
import {
  Video, Sparkles, Zap, Film, Mic, Target as TargetIcon,
  ChevronDown, Clock, Users, Globe, Play,
  ChevronLeft, ChevronRight,
} from 'lucide-react'

/* ── Helpers ────────────────────────────────────────── */
interface Scene { scene_number: number; description: string }

function parseScenes(raw: Json | null): Scene[] {
  if (!raw || !Array.isArray(raw)) return []
  return raw as unknown as Scene[]
}

/* ── Raw output renderer ────────────────────────────── */
function RawScriptOutput({ text, topic }: { text: string; topic: string }) {
  // Split into sections by detecting time markers or section headers
  const lines = text.split('\n')

  const renderLine = (line: string, i: number) => {
    const trimmed = line.trim()
    if (!trimmed) return <div key={i} className="h-2" />

    // Time marker lines like "0:00–0:03 — Hook ..."
    if (/^\d+:\d+[–-]/.test(trimmed)) {
      return (
        <div key={i} className="mt-5 mb-2 flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-bold font-mono shrink-0">
            {trimmed.split('—')[0].trim()}
          </div>
          <p className="text-sm font-bold text-gray-900">
            {trimmed.split('—').slice(1).join('—').trim()}
          </p>
        </div>
      )
    }

    // Section headers (all caps or bold-like patterns)
    if (/^#{1,3}\s/.test(trimmed) || (trimmed === trimmed.toUpperCase() && trimmed.length < 60 && trimmed.length > 3 && !/[0-9:]/.test(trimmed))) {
      return (
        <p key={i} className="mt-4 mb-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
          {trimmed.replace(/^#+\s/, '')}
        </p>
      )
    }

    // Bullet points
    if (/^[-•*]\s/.test(trimmed)) {
      const content = trimmed.replace(/^[-•*]\s/, '')
      // Bold the part before colon
      const colonIdx = content.indexOf(':')
      return (
        <div key={i} className="flex items-start gap-2 text-sm text-gray-700 leading-relaxed">
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
          {colonIdx > 0 && colonIdx < 40 ? (
            <p>
              <span className="font-semibold text-gray-900">{content.slice(0, colonIdx + 1)}</span>
              {content.slice(colonIdx + 1)}
            </p>
          ) : <p>{content}</p>}
        </div>
      )
    }

    // Numbered sections
    if (/^\d+\.\s/.test(trimmed)) {
      return (
        <p key={i} className="text-sm text-gray-700 leading-relaxed ml-2">
          <span className="font-semibold text-gray-900">{trimmed.split(' ')[0]}</span>
          {' ' + trimmed.split(' ').slice(1).join(' ')}
        </p>
      )
    }

    // Hashtags line
    if (trimmed.startsWith('#') && trimmed.includes(' #')) {
      return (
        <div key={i} className="flex flex-wrap gap-1.5 mt-2">
          {trimmed.split(' ').map((tag, ti) => (
            <span key={ti} className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-medium border border-red-100">{tag}</span>
          ))}
        </div>
      )
    }

    // Regular paragraph
    return <p key={i} className="text-sm text-gray-700 leading-relaxed">{trimmed}</p>
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="shrink-0 px-6 py-3 bg-white border-b border-gray-100 flex items-center gap-3">
        <div className="h-7 w-7 rounded-lg bg-red-100 flex items-center justify-center">
          <Play className="h-3.5 w-3.5 text-red-600 ml-0.5" />
        </div>
        <p className="font-semibold text-gray-900 text-sm flex-1 line-clamp-1">{topic || 'Video Script'}</p>
        <Badge className="bg-green-100 text-green-700 border-0 text-xs">Done</Badge>
        <CopyButton text={text} />
      </div>

      {/* Rendered output */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="space-y-1.5 max-w-2xl">
          {lines.map((line, i) => renderLine(line, i))}
        </div>
      </div>
    </div>
  )
}

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
          className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm
            text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 pr-9 cursor-pointer shadow-sm">
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
      </div>
    </div>
  )
}

/* ── Loader ─────────────────────────────────────────── */
function VideoLoader() {
  const [step, setStep] = useState(0)
  const steps = ['Writing your hook…', 'Planning scenes…', 'Crafting voiceover…', 'Adding CTAs…', 'Finishing up…']

  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % steps.length), 2000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center h-full py-20 gap-6">
      <div className="relative h-20 w-20">
        <div className="absolute inset-0 rounded-full border-4 border-red-100" />
        <div className="absolute inset-0 rounded-full border-4 border-t-red-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        <div className="absolute inset-2 rounded-full border-4 border-t-transparent border-r-orange-400 border-b-transparent border-l-transparent animate-spin"
          style={{ animationDuration: '1.4s', animationDirection: 'reverse' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <Video className="h-6 w-6 text-red-500" />
        </div>
      </div>

      <div className="text-center space-y-2">
        <p className="text-lg font-bold text-gray-900">Generating your video script</p>
        <p className="text-sm text-red-500 font-medium min-h-[1.25rem]">{steps[step]}</p>
        <p className="text-xs text-gray-400">Usually takes 15–30 seconds</p>
      </div>

      <div className="w-64 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-red-400 to-orange-500 rounded-full animate-pulse" style={{ width: '65%' }} />
      </div>
    </div>
  )
}

/* ── Script Output ──────────────────────────────────── */
function ScriptOutput({ script }: { script: VideoScript }) {
  const scenes = parseScenes(script.scene_breakdown)
  const fullScript = [
    script.hook && `HOOK:\n${script.hook}`,
    scenes.length > 0 && `SCENES:\n${scenes.map(s => `${s.scene_number}. ${s.description}`).join('\n')}`,
    script.voiceover_script && `VOICEOVER:\n${script.voiceover_script}`,
    script.cta && `CTA:\n${script.cta}`,
  ].filter(Boolean).join('\n\n')

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="shrink-0 px-6 py-3 bg-white border-b border-gray-100 flex items-center gap-3">
        <div className="h-7 w-7 rounded-lg bg-red-100 flex items-center justify-center">
          <Play className="h-3.5 w-3.5 text-red-600 ml-0.5" />
        </div>
        <p className="font-semibold text-gray-900 text-sm flex-1 line-clamp-1">{script.video_topic ?? 'Video Script'}</p>
        <Badge className="bg-green-100 text-green-700 border-0 text-xs">Done</Badge>
        <CopyButton text={fullScript} />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Hook */}
        {script.hook && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wide flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" /> Hook
              </p>
              <CopyButton text={script.hook} />
            </div>
            <p className="text-base font-semibold text-gray-900 leading-relaxed">"{script.hook}"</p>
          </div>
        )}

        {/* Scene breakdown */}
        {scenes.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Film className="h-4 w-4 text-red-500" />
              <p className="text-sm font-bold text-gray-800">Scene Breakdown</p>
              <Badge variant="outline" className="text-xs ml-auto">{scenes.length} scenes</Badge>
            </div>
            <div className="space-y-2">
              {scenes.map((scene, i) => (
                <div key={i} className="flex gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="h-6 w-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {scene.scene_number}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{scene.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Voiceover */}
        {script.voiceover_script && (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wide flex items-center gap-1.5">
                <Mic className="h-3.5 w-3.5" /> Voiceover Script
              </p>
              <CopyButton text={script.voiceover_script} />
            </div>
            <pre className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed font-sans">{script.voiceover_script}</pre>
          </div>
        )}

        {/* CTA */}
        {script.cta && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-green-600 uppercase tracking-wide flex items-center gap-1.5">
                <TargetIcon className="h-3.5 w-3.5" /> Call to Action
              </p>
              <CopyButton text={script.cta} />
            </div>
            <p className="text-sm font-semibold text-gray-800">{script.cta}</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Page ───────────────────────────────────────────── */
export default function VideoPage() {
  const { profile } = useBrandProfile()

  const [topic,     setTopic]     = useState('')
  const [character, setCharacter] = useState('Male')
  const [language,  setLanguage]  = useState('English')
  const [style,     setStyle]     = useState('YouTube Long-form')
  const [duration,  setDuration]  = useState('3–5 minutes')
  const [tone,      setTone]      = useState('Energetic')

  const [scripts,    setScripts]    = useState<VideoScript[]>([])
  const [selected,   setSelected]   = useState<VideoScript | null>(null)
  const [rawOutput,  setRawOutput]  = useState<{ text: string; topic: string } | null>(null)
  const [generating, setGenerating] = useState(false)
  const [loading,    setLoading]    = useState(true)

  const loadScripts = useCallback(async () => {
    const { data } = await getSupabaseClient()
      .from('video_scripts').select('*').order('created_at', { ascending: false }).limit(20)
    const all = (data ?? []) as VideoScript[]
    setScripts(all)
    setLoading(false)
    if (!selected) setSelected(all.find(s => s.status === 'done') ?? null)
  }, [selected])

  useEffect(() => { loadScripts() }, [loadScripts])

  const handleGenerate = async () => {
    if (!topic.trim()) { toast.error('Enter a video topic'); return }
    setGenerating(true)
    setSelected(null)

    try {
      const res = await fetch(
        'https://n8n.srv997749.hstgr.cloud/webhook/c7683854-71de-48ab-a1c4-0ac34d1d1b59',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            video_topic:   topic,
            character,
            language,
            style,
            duration,
            tone,
            brand_name:        profile?.brand_name ?? '',
            industry:          profile?.industry ?? '',
            target_audience:   profile?.target_audience ?? '',
            brand_description: profile?.brand_description ?? '',
          }),
        }
      )

      if (!res.ok) throw new Error(`Webhook error ${res.status}`)

      const json = await res.json()
      const item = Array.isArray(json) ? json[0] : json

      // Handle plain-text output field (n8n "Respond to Webhook" format)
      if (item?.output && typeof item.output === 'string') {
        setRawOutput({ text: item.output, topic })
        setSelected(null)
        toast.success('Video script generated!')
      } else if (item?.id || item?.hook || item?.voiceover_script) {
        // Structured DB row
        const row = item as VideoScript
        setSelected(row)
        setRawOutput(null)
        setScripts(prev => [row, ...prev.filter(s => s.id !== row.id)])
        toast.success('Video script generated!')
      } else {
        toast.error('Empty response from n8n')
      }
    } catch {
      toast.error('Failed to reach n8n webhook')
    } finally {
      setGenerating(false)
    }
  }

  // Show centered form when no script yet
  const showForm = !generating && !selected

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-gray-100 bg-white shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-md">
            <Video className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Video Script Generator</h1>
            <p className="text-xs text-gray-500">AI-written hooks, scenes, voiceover &amp; CTAs</p>
          </div>
          {scripts.filter(s => s.status === 'done').length > 0 && (
            <Badge className="ml-auto bg-red-100 text-red-700 border-0">
              {scripts.filter(s => s.status === 'done').length} scripts
            </Badge>
          )}
        </div>
        <BrandContextBar />
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* History sidebar — only show when we have scripts */}
        {scripts.filter(s => s.status === 'done').length > 0 && (
          <div className="w-52 shrink-0 border-r border-gray-100 bg-white overflow-y-auto">
            <div className="p-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Previous Scripts</p>
              {/* New script button */}
              <button
                onClick={() => { setSelected(null); setRawOutput(null) }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium mb-2 transition-all
                  ${!selected && !rawOutput ? 'bg-red-50 text-red-700 border border-red-200' : 'text-gray-500 hover:bg-gray-50 border border-dashed border-gray-200'}`}
              >
                <Sparkles className="h-3.5 w-3.5" /> New Script
              </button>
              <div className="space-y-1">
                {scripts.filter(s => s.status === 'done').map(s => (
                  <button key={s.id} onClick={() => setSelected(s)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all
                      ${selected?.id === s.id ? 'bg-red-50 text-red-800' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <p className={`font-medium leading-snug line-clamp-2 mb-1 ${selected?.id === s.id ? 'text-red-800' : ''}`}>
                      {s.video_topic ?? 'Untitled'}
                    </p>
                    <p className="text-gray-400 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {new Date(s.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main content area */}
        <div className="flex-1 overflow-y-auto bg-gray-50 flex items-start justify-center">

          {/* Generating loader */}
          {generating && (
            <div className="w-full">
              <VideoLoader />
            </div>
          )}

          {/* Raw text output (from n8n "output" field) */}
          {!generating && rawOutput && (
            <div className="w-full h-full bg-white self-stretch">
              <RawScriptOutput text={rawOutput.text} topic={rawOutput.topic} />
            </div>
          )}

          {/* Structured script output (from DB row) */}
          {!generating && !rawOutput && selected && (
            <div className="w-full h-full bg-white self-stretch">
              <ScriptOutput script={selected} />
            </div>
          )}

          {/* Centered input form */}
          {!generating && !selected && !rawOutput && (
            <div className="w-full max-w-xl px-6 py-10 mt-4">
              <div className="text-center mb-8">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-200">
                  <Video className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Create a Video Script</h2>
                <p className="text-sm text-gray-500 mt-1">Fill in the details and AI will write your complete script</p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                {/* Topic */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                    <TargetIcon className="h-3.5 w-3.5 text-gray-400" /> Video Topic *
                  </Label>
                  <Input
                    placeholder="e.g. How to automate your business in 2025"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                    className="bg-gray-50 border-gray-200 text-sm h-11 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Select label="Character Voice" icon={Users} value={character} onChange={setCharacter}
                    options={['Male', 'Female', 'Neutral / No Character']} />
                  <Select label="Language" icon={Globe} value={language} onChange={setLanguage}
                    options={['English', 'Hindi', 'Spanish', 'French', 'German', 'Portuguese', 'Arabic']} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Select label="Video Style" icon={Film} value={style} onChange={setStyle}
                    options={['YouTube Long-form', 'Short-form Reel', 'TikTok', 'Tutorial / How-to', 'Documentary', 'Explainer']} />
                  <Select label="Duration" icon={Clock} value={duration} onChange={setDuration}
                    options={['30 seconds', '60 seconds', '2–3 minutes', '3–5 minutes', '8–10 minutes', '15+ minutes']} />
                </div>

                <Select label="Tone" icon={Mic} value={tone} onChange={setTone}
                  options={['Energetic', 'Calm & Professional', 'Inspirational', 'Educational', 'Conversational', 'Storytelling', 'Humorous']} />

                <Button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full h-12 gap-2 bg-gradient-to-r from-red-500 to-orange-500
                    hover:from-red-600 hover:to-orange-600 text-white shadow-lg shadow-red-200 rounded-xl text-base font-semibold mt-2"
                >
                  <Sparkles className="h-5 w-5" />
                  Generate Video Script
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
