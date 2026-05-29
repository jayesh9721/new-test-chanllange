export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface BrandProfile {
  id: string
  user_id: string
  brand_name: string
  industry: string
  target_audience: string
  tone: string
  main_goals: string[]
  platforms: string[]
  brand_description: string
  created_at: string
  updated_at: string
}

export interface ContentStrategy {
  id: string
  brand_profile_id: string | null
  status: string
  content_pillars: string[] | null
  storytelling_angle: string | null
  audience_pain_points: string[] | null
  cta_strategy: string | null
  posting_frequency: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface SocialContent {
  id: string
  brand_profile_id: string | null
  platform: string
  status: string
  hook: string | null
  post_body: string | null
  hashtags: string[] | null
  generated_date: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface SeoBlog {
  id: string
  status: string
  title: string | null
  blog: string | null
  created_at: string
  updated_at: string
}

export interface VideoScript {
  id: string
  brand_profile_id: string | null
  video_topic: string | null
  status: string
  hook: string | null
  scene_breakdown: Json | null
  voiceover_script: string | null
  cta: string | null
  generated_date: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface RepurposedContent {
  id: string
  brand_profile_id: string | null
  source_type: string | null
  target_format: string | null
  source_content_id: string | null
  status: string
  repurposed_output: string | null
  generated_date: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface ContentCalendar {
  id: string
  brand_profile_id: string | null
  duration_days: number | null
  platforms: string[] | null
  status: string
  calendar_entries: Json | null
  generated_date: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}

// Minimal Database type for Supabase client
export type Database = Record<string, never>
