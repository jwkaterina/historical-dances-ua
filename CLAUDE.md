# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a bilingual (Ukrainian/Russian) historical dance management application built with Next.js 16, Supabase, and TypeScript. Users can create and manage dances with music, organize balls with sections and playlists, and access content in both languages.

## Development Commands

```bash
npm run dev       # Start development server on localhost:3000
npm run build     # Build production bundle
npm run start     # Start production server
npm run lint      # Run ESLint
```

## Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Database/Auth**: Supabase with Row Level Security (RLS)
- **Storage**: Vercel Blob for audio/video files
- **UI**: Radix UI components + Tailwind CSS
- **Forms**: React Hook Form + Zod validation
- **i18n**: Custom client-side language provider with localStorage

### Directory Structure

```
app/
├── actions/          # Server Actions for data mutations (dance.ts, ball.ts)
├── api/             # API routes (upload route for Vercel Blob)
├── auth/            # Authentication pages (login, sign-up, error)
├── balls/           # Ball management pages
├── dance/[id]/      # Individual dance detail pages
├── music/           # Music library page
├── layout.tsx       # Root layout with LanguageProvider
└── page.tsx         # Home page

components/
├── ui/              # Reusable Radix UI components
├── *-content.tsx    # Page-specific content components
├── *-form.tsx       # Form components for creating/editing entities
└── language-*.tsx   # Language switching components

lib/
├── supabase/        # Supabase client utilities
│   ├── client.ts    # Browser client
│   ├── server.ts    # Server client with cookie handling
│   └── proxy.ts     # Session management middleware
├── translations.ts  # Bilingual translation keys
└── utils.ts         # Utility functions

scripts/             # SQL migration scripts (numbered sequentially)
```

## Database Schema

### Core Tables
- **dances**: Dance records with multilingual fields (name, description, scheme)
  - Fields: `name`, `name_ua`, `name_ru`, `description`, `description_ua`, `description_ru`, `scheme`, `scheme_ua`, `scheme_ru`, `difficulty`, `origin`, `youtube_url`, `video_url`

- **music**: Music tracks with audio files
  - Fields: `title`, `artist`, `tempo`, `genre`, `audio_url`

- **dance_music**: Junction table linking dances to music tracks

- **balls**: Ball events with dates and locations
  - Fields: `name`, `name_ua`, `name_ru`, `date`, `place`, `place_ua`, `place_ru`, `info_ua`, `info_ru`, `user_id`

- **ball_sections**: Sections within a ball (e.g., "Opening", "Main Part")
  - Fields: `ball_id`, `name`, `name_ua`, `name_ru`, `order_index`

- **section_dances**: Dances within a ball section with specific music selections
  - Fields: `section_id`, `dance_id`, `music_ids` (array), `order_index`

- **section_texts**: Text blocks within a ball section (announcements, breaks)
  - Fields: `section_id`, `content_ua`, `content_ru`, `order_index`

### Key Relationships
- Dances ↔ Music: Many-to-many via `dance_music`
- Balls → Sections: One-to-many with cascading delete
- Sections → Dances/Texts: Ordered entries via `section_dances` and `section_texts`
- Music can be selected per section_dance, allowing different tracks for the same dance in different balls

## Supabase Patterns

### Client Creation

**IMPORTANT**: Always create new Supabase clients - never cache them in global variables (especially for Vercel Fluid compute).

```typescript
// Server-side authenticated client (uses user's session from cookies)
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()

// Server-side admin client (bypasses RLS, use for admin operations)
import { createServiceClient } from '@/lib/supabase/server'
const supabase = await createServiceClient()

// Client-side browser client
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
```

### When to Use Service Role Client

Use `createServiceClient()` when you need to bypass RLS policies for:
- Batch operations after client-side authentication verification
- Admin-level data mutations where you've already confirmed user permissions
- Operations that need to modify data across user boundaries

**Always** verify authentication first before using service role client:
```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) throw new Error('Not authenticated')

// Now safe to use service client
const adminClient = await createServiceClient()
```

### RLS Policies

- Public read access on all tables (SELECT)
- Authenticated users can INSERT/UPDATE/DELETE on balls, dances, and music
- Service role client bypasses all RLS policies

## Server Actions Pattern

All data mutations use Next.js Server Actions in `app/actions/`:

```typescript
'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateDance(data: DanceData) {
  const supabase = await createServiceClient()

  // Perform database operations
  const { error } = await supabase.from('dances').update(data)

  if (error) throw error

  // Revalidate affected paths
  revalidatePath('/dance/[id]', 'page')
  revalidatePath('/')

  return { success: true }
}
```

**Key practices:**
- Use `withRetry()` helper for resilient database operations
- Check for `SUPABASE_SERVICE_ROLE_KEY` availability
- Revalidate paths after mutations to update cached pages
- Handle cascading deletes explicitly (check for references before deletion)

## Internationalization (i18n)

### Translation System

All user-facing text is defined in `lib/translations.ts` with keys for both German (`de`) and Russian (`ru`).

```typescript
// In components, use the useLanguage hook
import { useLanguage } from '@/components/language-provider'

const { language, setLanguage, t } = useLanguage()
const label = t('danceName') // Returns translated string
```

### Multilingual Database Fields

Database fields with language-specific content use suffixes:
- Base field (often German): `name`, `description`, `place`
- German variant: `name_de`, `description_de`, `place_de`
- Russian variant: `name_ru`, `description_ru`, `place_ru`

Display the appropriate field based on current language:
```typescript
const danceName = language === 'ru' ? dance.name_ru : dance.name_de
```

## File Upload

Audio and video files are stored in Vercel Blob storage via the API route:

```typescript
// POST /api/upload
// Body: FormData with 'file' field
// Returns: { url: string }
```

**Limits:**
- Audio files: 20MB max
- Video files: 100MB max

## SQL Migrations

Migration scripts in `scripts/` are numbered sequentially (001_, 002_, etc.). To apply migrations:

1. Copy SQL from the script file
2. Run in Supabase SQL Editor
3. Never modify existing migration files - create new ones for schema changes

## Common Workflows

### Creating a New Dance

1. Client calls Server Action `updateDance()` with dance data and music entries
2. Action updates `dances` table with multilingual fields
3. For each music entry:
   - Creates or updates `music` record
   - Creates link in `dance_music` junction table
4. Revalidates paths: `/`, `/dance/[id]`

### Organizing a Ball

1. User creates ball with basic info (name, date, place in both languages)
2. Adds sections (e.g., "Opening Dances", "Intermission")
3. Within each section, adds ordered entries:
   - Dances with specific music track selections (from `music_ids` array)
   - Text blocks for announcements or breaks
4. All entries have `order_index` for custom sequencing

### Deleting a Dance

1. Check if dance is referenced in any `section_dances` (ball usage)
2. If referenced, return error with ball names
3. If safe, delete:
   - `dance_music` links
   - Dance record (cascading delete)
   - Orphaned music records (if not used elsewhere)

## Environment Variables

Required in `.env` or `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=           # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # Public anon key
SUPABASE_SERVICE_ROLE_KEY=          # Service role key (server-side only)
```

## Deployment

The app is designed for Vercel deployment with:
- Vercel Analytics integrated
- Vercel Blob for file storage
- Environment variables configured in Vercel project settings
