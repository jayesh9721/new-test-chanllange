'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { BrandProfile } from '@/lib/supabase/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  User, Building2, Target, MessageSquare, Flag,
  Share2, Globe, Save, CheckCircle2, Sparkles
} from 'lucide-react'

const TONES = ['Professional', 'Casual', 'Friendly', 'Authoritative']
const GOALS = ['Grow audience', 'Drive sales', 'Build trust', 'Increase engagement', 'Generate leads', 'Educate audience']
const PLATFORMS = ['LinkedIn', 'Instagram', 'Twitter', 'YouTube', 'Blog', 'TikTok']

const toneDescriptions: Record<string, string> = {
  Professional: 'Formal, expert-level communication',
  Casual: 'Relaxed, conversational style',
  Friendly: 'Warm, approachable tone',
  Authoritative: 'Confident, industry-leading voice',
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    brand_name: '',
    industry: '',
    target_audience: '',
    tone: 'Professional',
    main_goals: [] as string[],
    platforms: [] as string[],
    brand_description: '',
  })

  const [existingRowId, setExistingRowId] = useState<string | null>(null)

  useEffect(() => {
    // Always load the first existing row — single source of truth
    getSupabaseClient()
      .from('brand_profiles')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .single()
      .then(({ data: profile }) => {
        if (profile) {
          const d = profile as BrandProfile
          setExistingRowId(d.id)
          setForm({
            brand_name: d.brand_name ?? '',
            industry: d.industry ?? '',
            target_audience: d.target_audience ?? '',
            tone: d.tone ?? 'Professional',
            main_goals: d.main_goals ?? [],
            platforms: d.platforms ?? [],
            brand_description: d.brand_description ?? '',
          })
        }
        setLoading(false)
      })
  }, [])

  const toggleItem = (field: 'main_goals' | 'platforms', value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value],
    }))
  }

  const handleSave = async () => {
    if (!form.brand_name.trim()) {
      toast.error('Brand name is required')
      return
    }
    setSaving(true)

    // Save via API route — pass existing row ID so it always updates the same row
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, existingRowId }),
    })
    const json = await res.json()

    if (!res.ok) {
      setSaving(false)
      toast.error('Failed to save profile: ' + (json.error ?? res.statusText))
      return
    }

    const savedId = json.data?.id

    // Trigger n8n webhook with full profile data
    try {
      await fetch('https://n8n.srv997749.hstgr.cloud/webhook/78fc4a33-50a8-4ca9-b282-8efb4ec300ae', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, id: savedId }),
      })
    } catch {
      toast('Profile saved — n8n notification failed', { description: 'Strategy will not auto-generate until n8n is reachable.' })
    }

    setSaving(false)
    setSaved(true)
    toast.success('Brand profile saved & strategy generation triggered!')
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64 mb-8" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Brand Profile</h1>
            <p className="text-sm text-gray-500">Your AI will use this to generate all content</p>
          </div>
        </div>
        <div className="mt-4 p-3 rounded-lg bg-violet-50 border border-violet-100 flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
          <p className="text-sm text-violet-700">
            Fill in your brand details once. AI uses this as context for every piece of content — strategy, social posts, blogs, videos, and more.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-violet-500" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="brand_name" className="text-xs font-medium text-gray-600">Brand Name *</Label>
                <Input
                  id="brand_name"
                  placeholder="e.g. Acme Corp"
                  value={form.brand_name}
                  onChange={e => setForm(p => ({ ...p, brand_name: e.target.value }))}
                  className="bg-gray-50 border-gray-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="industry" className="text-xs font-medium text-gray-600">Industry</Label>
                <Input
                  id="industry"
                  placeholder="e.g. SaaS, Fitness, Fashion"
                  value={form.industry}
                  onChange={e => setForm(p => ({ ...p, industry: e.target.value }))}
                  className="bg-gray-50 border-gray-200"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="target_audience" className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5" />
                Target Audience
              </Label>
              <Input
                id="target_audience"
                placeholder="e.g. Startup founders aged 25-40 who want to grow their business"
                value={form.target_audience}
                onChange={e => setForm(p => ({ ...p, target_audience: e.target.value }))}
                className="bg-gray-50 border-gray-200"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tone */}
        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-pink-500" />
              Brand Tone
            </CardTitle>
            <CardDescription className="text-xs">How should your brand sound?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {TONES.map(tone => (
                <button
                  key={tone}
                  onClick={() => setForm(p => ({ ...p, tone }))}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    form.tone === tone
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <p className={`text-sm font-semibold ${form.tone === tone ? 'text-violet-700' : 'text-gray-700'}`}>
                    {tone}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{toneDescriptions[tone]}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Goals */}
        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Flag className="h-4 w-4 text-amber-500" />
              Main Goals
            </CardTitle>
            <CardDescription className="text-xs">Select all that apply</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {GOALS.map(goal => (
                <button
                  key={goal}
                  onClick={() => toggleItem('main_goals', goal)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    form.main_goals.includes(goal)
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'
                  }`}
                >
                  {goal}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Platforms */}
        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Share2 className="h-4 w-4 text-blue-500" />
              Platforms
            </CardTitle>
            <CardDescription className="text-xs">Where do you publish content?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(platform => (
                <button
                  key={platform}
                  onClick={() => toggleItem('platforms', platform)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    form.platforms.includes(platform)
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {platform}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Globe className="h-4 w-4 text-teal-500" />
              Brand Description
            </CardTitle>
            <CardDescription className="text-xs">Describe your brand, values, and what makes you unique</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="We help startup founders scale their business using AI-powered tools. Our brand voice is approachable yet expert, focusing on practical advice and real results..."
              value={form.brand_description}
              onChange={e => setForm(p => ({ ...p, brand_description: e.target.value }))}
              className="min-h-[120px] bg-gray-50 border-gray-200 resize-none"
            />
            <p className="text-xs text-gray-400 mt-2">{form.brand_description.length} characters</p>
          </CardContent>
        </Card>

        <Separator />

        {/* Save Button */}
        <div className="flex items-center justify-between">
          <div>
            {form.main_goals.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {form.main_goals.map(g => (
                  <Badge key={g} variant="secondary" className="text-xs">{g}</Badge>
                ))}
              </div>
            )}
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-200 px-6"
          >
            {saved ? (
              <><CheckCircle2 className="h-4 w-4" /> Saved!</>
            ) : saving ? (
              <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
            ) : (
              <><Save className="h-4 w-4" /> Save Profile</>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
