# Kuran.studio

## About
Kuran.studio is a web platform for reading and studying the Quran in Albanian (shqip). It uses the Albanian translation by Hasan Efendi Nahi from the QuranEnc API. Domain: kuran.studio
- GitHub: github.com/cjapidonald/kuran-studio

## Tech Stack
- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui (base-nova style)
- Motion (framer-motion) for animations
- Supabase (Google OAuth authentication)
- Deployed on Vercel

## Design System
- Accent color: Emerald green (#10b981)
- Dark mode landing page (bg-gray-950)
- Same UI patterns as Piktor.studio: FlickeringGrid, TiltCards, FadeIn animations
- Theme switcher (light/dark) inside the app, stored in localStorage as "kurani-theme"

## Data Source
- QuranEnc API: `https://quranenc.com/api/v1/translation/sura/albanian_nahi/{sura_number}`
- Returns: `{ result: [{ id, sura, aya, arabic_text, translation, footnotes }] }`
- 114 surahs, translation key: `albanian_nahi`

## Commands
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — run ESLint

## Project Structure
- `app/page.tsx` — Landing page
- `app/reader/` — Authenticated reader app
- `app/reader/[surah]/` — Individual surah reading view
- `components/ui/` — Shared UI components (card, button, tilt-card, flickering-grid)
- `components/landing/` — Landing page components (nav, footer, fade-in)
- `components/layout/` — App shell, user menu
- `components/reader/` — Reader-specific components
- `lib/quran/` — Quran API client and surah metadata
- `lib/supabase/` — Supabase client helpers
