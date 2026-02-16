# Ball Info Page Implementation

## Overview
Implemented a ball info page feature that allows users to view ball information and admin users to edit it with rich text formatting capabilities.

## Changes Made

### 1. Translations Added
Updated `lib/translations.ts` with new translation keys:
- `ballInfoLink`: Link text shown on ball page
  - German: "Bitte lesen Sie die Regeln für den Besuch des Balls"
  - Russian: "Пожалуйста, прочитайте правила посещения бала"
- `ballInfo`: "Ball-Informationen" / "Информация о бале"
- `editBallInfo`: "Informationen bearbeiten" / "Редактировать информацию"
- `saveBallInfo`: "Informationen speichern" / "Сохранить информацию"
- `ballInfoSaved`: Success message for save
- `ballInfoSaveFailed`: Error message for failed save

### 2. Ball Detail Page Updated
Updated `components/ball-detail-content.tsx`:
- Added a link above the ball sections list
- Link redirects to `/balls/[id]/info` route
- Link text is translated based on current language

### 3. New Route Created
Created `app/balls/[id]/info/page.tsx`:
- Server-side page that fetches ball data
- Renders the BallInfoContent component

### 4. Rich Text Editor Component
Created `components/rich-text-editor.tsx`:
- Built with Tiptap editor framework
- Features:
  - Bold and italic text formatting
  - Headings (H1, H2, H3)
  - Bullet and ordered lists
  - Image insertion via file upload or URL
  - **Image resizing capabilities:**
    - Drag corner handles to resize proportionally
    - Width input field with manual control (px or %)
    - Quick size buttons (Full, 50%, 300px)
    - Visual resize handles appear on selected images
  - Undo/redo functionality
- Toolbar with visual buttons for all formatting options
- Image upload integration with Vercel Blob (10MB limit)
- Responsive design with Tailwind CSS
- Custom CSS styles for proper rendering of headings and lists
- Interactive image selection with visual feedback

### 5. Ball Info Content Component
Created `components/ball-info-content.tsx`:
- Displays ball information
- Edit mode (visible only to admin users):
  - Shows RichTextEditor component
  - Save and Cancel buttons
  - Loading state during save
- View mode:
  - Renders HTML content with proper styling
  - Shows formatted text with images

### 6. Server Actions and API
Updated `app/actions/ball.ts`:
- Added `updateBallInfo(id, infoText)` function
- Checks for user authentication
- Updates `info_text` column in balls table
- Revalidates paths after update
- Added `info_text` field to `getBallById` query

Updated `app/api/upload/route.ts`:
- Added support for image file uploads
- Image file size limit: 10MB
- Images stored in Supabase `images` bucket
- Returns signed upload URL for secure uploads

### 7. Database Migrations
Created `scripts/013_add_ball_info_text.sql`:
- Adds `info_text` TEXT column to balls table
- Uses `IF NOT EXISTS` for safe execution

Created `scripts/014_create_images_bucket.sql`:
- Creates `images` storage bucket in Supabase
- Sets up RLS policies for public read and authenticated upload
- Required for image upload functionality

### 8. Dependencies Installed
Added Tiptap packages for rich text editing:
- `@tiptap/react`
- `@tiptap/starter-kit`
- `@tiptap/extension-image`
- `@tiptap/extension-link`

## How to Complete Setup

### 1. Run the Database Migrations
Execute the migration scripts in Supabase SQL Editor:

**Migration 1: Add info_text column**
```sql
ALTER TABLE balls ADD COLUMN IF NOT EXISTS info_text TEXT;
```
Or copy and run the entire contents of `scripts/013_add_ball_info_text.sql`

**Migration 2: Create images storage bucket**
```sql
-- Create storage bucket for image uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable public access to images bucket
CREATE POLICY "Public Read Images" ON storage.objects FOR SELECT
  USING (bucket_id = 'images');

CREATE POLICY "Public Upload Images" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'images' AND auth.role() IS NOT NULL);

CREATE POLICY "Authenticated Delete Images" ON storage.objects FOR DELETE
  USING (bucket_id = 'images' AND auth.role() = 'authenticated');
```
Or copy and run the entire contents of `scripts/014_create_images_bucket.sql`

### 2. Test the Feature
1. Navigate to any ball page (e.g., `/balls/[id]`)
2. Click on the link "Bitte lesen Sie die Regeln für den Besuch des Balls" (German) or "Пожалуйста, прочитайте правила посещения бала" (Russian)
3. You'll be redirected to the ball info page
4. If logged in as admin, click "Edit" button
5. Use the rich text editor to format content and add images
6. Click "Save" to persist changes

## Features
- ✅ Link on ball page redirects to ball info page
- ✅ Bilingual support (German/Russian)
- ✅ Rich text editing with formatting toolbar
- ✅ Bold, italic, headings, lists support
- ✅ Image upload via file selection (10MB limit)
- ✅ Image insertion via URL (alternative method)
- ✅ Images stored in Supabase Storage
- ✅ **Image resizing in editor:**
  - Drag corner handles to resize
  - Manual width input (supports px and %)
  - Quick size presets (Full width, 50%, 300px)
  - Maintains aspect ratio
  - Visual feedback when selected
- ✅ Admin-only edit functionality
- ✅ Content saved to database
- ✅ Proper error handling and loading states

## Technical Notes
- The `info_text` column stores HTML content generated by the Tiptap editor
- Content is rendered using `dangerouslySetInnerHTML` (safe because content is admin-controlled)
- The editor uses Tailwind's prose classes for consistent typography
- Authentication checks prevent unauthorized edits
