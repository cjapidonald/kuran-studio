# Kurani.studio — Design Spec

## Overview

Kurani.studio is a web platform for reading and studying the Quran in Albanian (shqip). It uses the same visual design language as Piktor.studio — dark landing page, TiltCards, FlickeringGrid, theme switcher — adapted with an emerald green accent for Islamic aesthetics.

The MVP delivers: a polished landing page, Google authentication via Supabase, and a simple Quran reader that fetches Albanian translations from the QuranEnc API.

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui (base-nova style) + CVA
- **Animations**: Motion (framer-motion) + tw-animate-css
- **Icons**: Lucide React
- **Auth & DB**: Supabase (Google OAuth + future DB needs)
- **Data Source**: QuranEnc API (`quranenc.com/api/v1/translation`)
- **Deployment**: Vercel
- **Repo**: GitHub

## Color System

### Accent Color: Emerald Green
- Primary: `#10b981` (emerald-500)
- Hover: `#059669` (emerald-600)
- Glow/bg: `rgba(16, 185, 129, 0.15)`
- Text accent: `#10b981`

### Supporting Colors (for feature cards)
- Blue: `#60a5fa` — search/discovery features
- Purple: `#a78bfa` — bookmarks/progress features
- Pink: `#f472b6` — community features (future)
- Cyan: `#38bdf8` — audio features (future)

### Neutral Palette
- Same gray-50 to gray-950 scale as Piktor
- Dark mode default on landing page (`bg-gray-950`)
- Light/dark theme toggle inside the app

## Landing Page

Mirrors Piktor's landing page structure:

### 1. Navigation (`LandingNav`)
- Logo: "Q" icon (emerald bg, rounded) + "Kurani.studio" text
- Links: Features, About
- CTA: "Hyr" (Sign In) button — emerald green

### 2. Hero Section
- **FlickeringGrid** animated background (emerald-tinted)
- Radial gradient glow (emerald, `blur-120px`)
- Heading: `text-7xl` — "Lexo Kuranin **ne shqip**" (green accent on "ne shqip")
- Subtitle: "Platforma e pare dixhitale per te lexuar dhe studiuar Kuranin Fisnik ne gjuhen shqipe."
- Two CTAs:
  - Primary: "Fillo Leximin" (emerald bg)
  - Secondary: "Meso Me Shume" (outline)
- `FadeIn` scroll animation wrapper

### 3. Browser Mockup
- Shows a preview of the Quran reader interface
- Dark gray-900 frame with reader UI inside
- Displays Surah Al-Fatiha as sample content (arabic + albanian)

### 4. Features Grid (TiltCards)
- 6 cards in a responsive grid (3 cols on desktop, 1 on mobile)
- Each card has:
  - Colored top border (emerald, blue, purple, pink, cyan, amber)
  - Icon + title + description
  - TiltCard 3D hover effect with color-specific glow
  - Shimmer animation on hover
- Features:
  1. **Lexues i Thjeshte** (Simple Reader) — green
  2. **Kerkim i Avancuar** (Advanced Search) — blue
  3. **Ruaj Progresin** (Save Progress/Bookmarks) — purple
  4. **Tema Dite/Nate** (Light/Dark Theme) — amber
  5. **Perkthim Shqip** (Albanian Translation) — cyan
  6. **Shenim & Reflektime** (Notes & Reflections) — pink

### 5. How It Works (3 steps)
- Step 1: "Regjistrohu" (Sign up) — Create account with Google
- Step 2: "Zgjidh Suren" (Choose a Surah) — Browse 114 surahs
- Step 3: "Fillo Leximin" (Start Reading) — Read ayahs with translation

### 6. Final CTA Section
- "Fillo udhetimin tend" (Start your journey)
- Sign up button

### 7. Footer (`LandingFooter`)
- Brand column: Kurani.studio + description
- Links: Features, About, Contact
- Legal: Privacy, Terms

## Authentication

### Google OAuth via Supabase
- Single sign-in method: Google
- Supabase handles the OAuth flow
- After sign-in, redirect to `/reader` (the main app)
- User session managed by Supabase client SDK
- Protected routes: `/reader/*` requires authentication
- Middleware checks auth state and redirects unauthenticated users to landing

## App Shell (Post-Login)

### Layout
- Minimal top bar with:
  - Logo (Kurani.studio)
  - Theme toggle (sun/moon icons)
  - User avatar/menu (from Google profile)
- Main content area below
- No sidebar for MVP (reader is full-width)

### Theme Switcher
- Same implementation as Piktor:
  - localStorage key: `kurani-theme`
  - `.dark` class toggle on `[data-app-main]`
  - Dark: `bg-gray-950 text-gray-200`
  - Light: `bg-white text-gray-900`
- Default: dark mode

## Quran Reader

### Data Source
- **API**: `https://quranenc.com/api/v1/translation/sura/albanian_nahi/{sura_number}`
- **Translation**: Albanian by Hasan Efendi Nahi (`albanian_nahi`)
- **Response fields**: `id`, `sura`, `aya`, `arabic_text`, `translation`, `footnotes`

### Surah List View (`/reader`)
- Grid of 114 surah cards (same card design as landing page feature cards)
- Each card shows:
  - Surah number (in a circle/badge)
  - Surah name (Arabic + transliterated)
  - Number of ayahs
  - Revelation type (Mekke/Medine)
- Cards use the base Card component with hover effects
- Static surah metadata (names, ayah counts) stored as local JSON

### Surah Reading View (`/reader/[surah]`)
- Clean reading layout, centered content
- Surah header: name (Arabic + Albanian) + bismillah
- Each ayah displayed as:
  - Arabic text (right-to-left, larger font, distinct Arabic typeface)
  - Albanian translation below
  - Ayah number badge
  - Footnotes expandable (if present)
- Data fetched from QuranEnc API on page load
- Loading skeleton while fetching

### Surah Metadata
- Static JSON file with 114 entries containing:
  - `number`, `name` (Arabic), `transliteration`, `translation` (Albanian name)
  - `ayah_count`, `revelation_type` (Mekke/Medine)
- Used for the surah list and headers without API calls

## File Structure

```
kurani.studio/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout (fonts, metadata)
│   ├── globals.css                 # Tailwind + theme variables
│   ├── reader/
│   │   ├── layout.tsx              # App shell (nav, theme, auth guard)
│   │   ├── page.tsx                # Surah list grid
│   │   └── [surah]/
│   │       └── page.tsx            # Surah reading view
│   └── auth/
│       └── callback/
│           └── route.ts            # Supabase OAuth callback
├── components/
│   ├── landing/
│   │   ├── nav.tsx
│   │   ├── footer.tsx
│   │   └── fade-in.tsx
│   ├── ui/
│   │   ├── card.tsx                # shadcn card
│   │   ├── tilt-card.tsx           # 3D interactive card
│   │   ├── button.tsx              # shadcn button
│   │   ├── flickering-grid.tsx     # Animated pixel background
│   │   └── badge.tsx
│   ├── layout/
│   │   ├── app-shell.tsx           # App layout with theme
│   │   ├── theme-toggle.tsx        # Light/dark switcher
│   │   └── user-menu.tsx           # Profile dropdown
│   └── reader/
│       ├── surah-card.tsx          # Surah list card
│       └── ayah-display.tsx        # Single ayah component
├── lib/
│   ├── utils.ts                    # cn() utility
│   ├── supabase/
│   │   ├── client.ts               # Browser Supabase client
│   │   ├── server.ts               # Server Supabase client
│   │   └── middleware.ts            # Auth middleware helper
│   └── quran/
│       ├── api.ts                   # QuranEnc API functions
│       └── surahs.ts               # Static surah metadata
├── middleware.ts                    # Next.js middleware (auth redirect)
├── CLAUDE.md
└── package.json
```

## Non-Goals (Future Features, Not MVP)

- Audio recitation
- Arabic-only reading mode
- Tafsir (detailed commentary)
- User bookmarks/progress tracking in DB
- Search across all surahs
- Social/community features
- Multiple Albanian translations
- Offline support
