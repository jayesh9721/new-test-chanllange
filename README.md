# ContentAI Studio

An AI content studio for brands. You set up a brand profile once (industry, audience, tone, goals, platforms), and the studio generates a full content system from it. The generation runs in n8n workflows, and results are written back to Supabase and appear in the app as they finish.

## What it generates
| Page | Output |
|---|---|
| **Strategy** | Content pillars, storytelling angle, audience pain points, CTA strategy, posting frequency |
| **Blog** | SEO blog posts rendered from Markdown |
| **Social** | Platform-specific social posts, with retry per post |
| **Video** | Video scripts |
| **Repurpose** | Turns one piece of content into multiple formats |
| **Calendar** | Content calendar view |

Every generation job has a status (`pending` → `completed` / `failed`), and the UI polls until it's ready.

## Architecture
```
Next.js app ──(brand profile)──▶ n8n webhook ──▶ LLM workflows
     ▲                                              │
     └──────── Supabase (polling for status) ◀──────┘
```

## Tech stack
Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Supabase (Auth + Postgres) · n8n · react-markdown

## Run locally
1. Create the tables: run `scripts/schema.sql` in the Supabase SQL editor.
2. Add `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # server-side only
   ```
3. Start it:
   ```bash
   npm install
   npm run dev      # http://localhost:3000
   ```

## License
MIT, see [LICENSE](LICENSE).
