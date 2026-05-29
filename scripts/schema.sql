-- 1. brand_profiles
CREATE TABLE IF NOT EXISTS brand_profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           TEXT NOT NULL DEFAULT 'default',
  brand_name        TEXT NOT NULL,
  industry          TEXT NOT NULL,
  target_audience   TEXT NOT NULL,
  tone              TEXT NOT NULL,
  main_goals        TEXT[] NOT NULL DEFAULT '{}',
  platforms         TEXT[] NOT NULL DEFAULT '{}',
  brand_description TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS brand_profiles_user_id_idx ON brand_profiles (user_id);

-- 2. content_strategy
CREATE TABLE IF NOT EXISTS content_strategy (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_profile_id     UUID REFERENCES brand_profiles(id) ON DELETE CASCADE,
  status               TEXT NOT NULL DEFAULT 'pending',
  content_pillars      TEXT[],
  storytelling_angle   TEXT,
  audience_pain_points TEXT[],
  cta_strategy         TEXT,
  posting_frequency    TEXT,
  error_message        TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. social_content
CREATE TABLE IF NOT EXISTS social_content (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_profile_id UUID REFERENCES brand_profiles(id) ON DELETE CASCADE,
  platform         TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending',
  hook             TEXT,
  post_body        TEXT,
  hashtags         TEXT[],
  generated_date   DATE,
  error_message    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. seo_blogs
CREATE TABLE IF NOT EXISTS seo_blogs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_profile_id UUID REFERENCES brand_profiles(id) ON DELETE CASCADE,
  keyword_topic    TEXT,
  status           TEXT NOT NULL DEFAULT 'pending',
  seo_title        TEXT,
  meta_description TEXT,
  keywords         TEXT[],
  blog_outline     TEXT,
  full_blog        TEXT,
  generated_date   DATE,
  error_message    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. video_scripts
CREATE TABLE IF NOT EXISTS video_scripts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_profile_id UUID REFERENCES brand_profiles(id) ON DELETE CASCADE,
  video_topic      TEXT,
  status           TEXT NOT NULL DEFAULT 'pending',
  hook             TEXT,
  scene_breakdown  JSONB,
  voiceover_script TEXT,
  cta              TEXT,
  generated_date   DATE,
  error_message    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. repurposed_content
CREATE TABLE IF NOT EXISTS repurposed_content (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_profile_id  UUID REFERENCES brand_profiles(id) ON DELETE SET NULL,
  source_type       TEXT,
  target_format     TEXT,
  source_content_id UUID,
  status            TEXT NOT NULL DEFAULT 'pending',
  repurposed_output TEXT,
  generated_date    DATE,
  error_message     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. content_calendars
CREATE TABLE IF NOT EXISTS content_calendars (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_profile_id UUID REFERENCES brand_profiles(id) ON DELETE CASCADE,
  duration_days    INT,
  platforms        TEXT[] DEFAULT '{}',
  status           TEXT NOT NULL DEFAULT 'pending',
  calendar_entries JSONB,
  generated_date   DATE,
  error_message    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_strategy ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE repurposed_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendars ENABLE ROW LEVEL SECURITY;

-- brand_profiles: each user owns their own row
CREATE POLICY IF NOT EXISTS "brand_profiles_owner"
  ON brand_profiles FOR ALL
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- content tables: user accesses rows linked to their brand profile
CREATE POLICY IF NOT EXISTS "content_strategy_owner"
  ON content_strategy FOR ALL
  USING (brand_profile_id IN (SELECT id FROM brand_profiles WHERE user_id = auth.uid()::text))
  WITH CHECK (brand_profile_id IN (SELECT id FROM brand_profiles WHERE user_id = auth.uid()::text));

CREATE POLICY IF NOT EXISTS "social_content_owner"
  ON social_content FOR ALL
  USING (brand_profile_id IN (SELECT id FROM brand_profiles WHERE user_id = auth.uid()::text))
  WITH CHECK (brand_profile_id IN (SELECT id FROM brand_profiles WHERE user_id = auth.uid()::text));

CREATE POLICY IF NOT EXISTS "seo_blogs_owner"
  ON seo_blogs FOR ALL
  USING (brand_profile_id IN (SELECT id FROM brand_profiles WHERE user_id = auth.uid()::text))
  WITH CHECK (brand_profile_id IN (SELECT id FROM brand_profiles WHERE user_id = auth.uid()::text));

CREATE POLICY IF NOT EXISTS "video_scripts_owner"
  ON video_scripts FOR ALL
  USING (brand_profile_id IN (SELECT id FROM brand_profiles WHERE user_id = auth.uid()::text))
  WITH CHECK (brand_profile_id IN (SELECT id FROM brand_profiles WHERE user_id = auth.uid()::text));

CREATE POLICY IF NOT EXISTS "repurposed_content_owner"
  ON repurposed_content FOR ALL
  USING (brand_profile_id IN (SELECT id FROM brand_profiles WHERE user_id = auth.uid()::text))
  WITH CHECK (brand_profile_id IN (SELECT id FROM brand_profiles WHERE user_id = auth.uid()::text));

CREATE POLICY IF NOT EXISTS "content_calendars_owner"
  ON content_calendars FOR ALL
  USING (brand_profile_id IN (SELECT id FROM brand_profiles WHERE user_id = auth.uid()::text))
  WITH CHECK (brand_profile_id IN (SELECT id FROM brand_profiles WHERE user_id = auth.uid()::text));

-- Allow service role (n8n) full access — bypasses RLS automatically
