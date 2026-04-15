# Kurani.studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Quran reading platform in Albanian with Piktor-identical landing page design, Google auth via Supabase, and a simple reader fetching from QuranEnc API.

**Architecture:** Next.js 15 App Router with Tailwind CSS v4 and shadcn/ui. Landing page is a static marketing page with FlickeringGrid, TiltCards, and FadeIn animations. Auth uses Supabase Google OAuth with middleware-protected routes. The reader fetches Albanian Quran translations from `quranenc.com/api/v1/translation/sura/albanian_nahi/{sura}`.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, shadcn/ui (base-nova), Motion (framer-motion), Supabase (@supabase/ssr), Vercel

---

## File Structure

```
kurani.studio/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout (Inter font, metadata)
│   ├── globals.css                 # Tailwind + theme variables (from Piktor)
│   ├── login/
│   │   └── page.tsx                # Login page with Google button
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts            # Supabase OAuth callback
│   └── reader/
│       ├── layout.tsx              # App shell (nav, theme toggle, auth guard)
│       ├── page.tsx                # Surah list grid
│       └── [surah]/
│           └── page.tsx            # Surah reading view
├── components/
│   ├── landing/
│   │   ├── nav.tsx                 # Landing navigation bar
│   │   ├── footer.tsx              # Landing footer
│   │   └── fade-in.tsx             # Scroll-triggered fade animation
│   ├── ui/
│   │   ├── card.tsx                # shadcn card component
│   │   ├── tilt-card.tsx           # 3D tilt card with hover effects
│   │   ├── flickering-grid.tsx     # Canvas animated pixel background
│   │   └── button.tsx              # shadcn button with CVA variants
│   ├── layout/
│   │   ├── app-shell.tsx           # Reader layout with theme context
│   │   └── user-menu.tsx           # Profile dropdown with logout
│   └── reader/
│       ├── surah-card.tsx          # Card for surah list grid
│       └── ayah-display.tsx        # Single ayah component (arabic + albanian)
├── lib/
│   ├── utils.ts                    # cn() utility
│   ├── supabase/
│   │   ├── client.ts               # Browser Supabase client
│   │   └── server.ts               # Server Supabase client
│   └── quran/
│       ├── api.ts                  # QuranEnc API fetch functions
│       └── surahs.ts              # Static surah metadata (114 entries)
├── middleware.ts                    # Auth redirect middleware
├── .env.local                      # Supabase keys (not committed)
├── CLAUDE.md                       # Project documentation
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── components.json
└── package.json
```

---

### Task 1: Scaffold Next.js Project & Config Files

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `components.json`, `app/globals.css`, `.gitignore`, `CLAUDE.md`

- [ ] **Step 1: Initialize Next.js project**

Run:
```bash
cd /Users/donaldcjapi/Desktop/Apps/Kurani.studio && npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --turbopack --yes
```

Expected: Next.js project scaffolded with default files.

- [ ] **Step 2: Install dependencies**

Run:
```bash
cd /Users/donaldcjapi/Desktop/Apps/Kurani.studio && npm install @supabase/ssr @supabase/supabase-js class-variance-authority clsx tailwind-merge motion tw-animate-css lucide-react @base-ui/react && npm install -D @tailwindcss/postcss
```

- [ ] **Step 3: Replace postcss.config.mjs**

Write `postcss.config.mjs`:
```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

- [ ] **Step 4: Replace tsconfig.json**

Write `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", ".next/dev/types/**/*.ts", "**/*.mts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Write next.config.ts**

Write `next.config.ts`:
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.supabaseusercontent.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
```

- [ ] **Step 6: Write components.json (shadcn config)**

Write `components.json`:
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "base-nova",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "rtl": false,
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

- [ ] **Step 7: Write globals.css (same theme system as Piktor)**

Write `app/globals.css`:
```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-sans);
  --font-mono: var(--font-geist-mono);
  --font-heading: var(--font-sans);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
  --radius-3xl: calc(var(--radius) * 2.2);
  --radius-4xl: calc(var(--radius) * 2.6);
}

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.87 0 0);
  --chart-2: oklch(0.556 0 0);
  --chart-3: oklch(0.439 0 0);
  --chart-4: oklch(0.371 0 0);
  --chart-5: oklch(0.269 0 0);
  --radius: 0.625rem;
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --chart-1: oklch(0.87 0 0);
  --chart-2: oklch(0.556 0 0);
  --chart-3: oklch(0.439 0 0);
  --chart-4: oklch(0.371 0 0);
  --chart-5: oklch(0.269 0 0);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
  html {
    @apply font-sans;
  }
}
```

- [ ] **Step 8: Write .gitignore**

Write `.gitignore`:
```
node_modules/
.next/
.env.local
.env*.local
.superpowers/
*.tsbuildinfo
next-env.d.ts
```

- [ ] **Step 9: Write CLAUDE.md**

Write `CLAUDE.md`:
```markdown
# Kurani.studio

## About
Kurani.studio is a web platform for reading and studying the Quran in Albanian (shqip). It uses the Albanian translation by Hasan Efendi Nahi from the QuranEnc API.

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
```

- [ ] **Step 10: Commit scaffold**

Run:
```bash
cd /Users/donaldcjapi/Desktop/Apps/Kurani.studio && git init && git add -A && git commit -m "chore: scaffold Next.js project with Tailwind, Supabase, and shadcn config"
```

---

### Task 2: Core UI Components

**Files:**
- Create: `lib/utils.ts`, `components/ui/button.tsx`, `components/ui/card.tsx`, `components/ui/flickering-grid.tsx`, `components/ui/tilt-card.tsx`, `components/landing/fade-in.tsx`

- [ ] **Step 1: Write lib/utils.ts**

Write `lib/utils.ts`:
```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: Write components/ui/button.tsx**

Write `components/ui/button.tsx`:
```tsx
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
```

- [ ] **Step 3: Write components/ui/card.tsx**

Write `components/ui/card.tsx`:
```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

function Card({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex flex-col gap-4 overflow-hidden rounded-xl bg-card py-4 text-sm text-card-foreground ring-1 ring-foreground/10 has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:py-3 data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-4 group-data-[size=sm]/card:px-3 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-4 group-data-[size=sm]/card:[.border-b]:pb-3",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("font-heading text-base leading-snug font-medium group-data-[size=sm]/card:text-sm", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-4 group-data-[size=sm]/card:px-3", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center rounded-b-xl border-t bg-muted/50 p-4 group-data-[size=sm]/card:p-3", className)}
      {...props}
    />
  )
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent }
```

- [ ] **Step 4: Write components/ui/flickering-grid.tsx**

Write `components/ui/flickering-grid.tsx`:
```tsx
"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface FlickeringGridProps extends React.HTMLAttributes<HTMLDivElement> {
  squareSize?: number
  gridGap?: number
  flickerChance?: number
  color?: string
  width?: number
  height?: number
  className?: string
  maxOpacity?: number
}

export const FlickeringGrid: React.FC<FlickeringGridProps> = ({
  squareSize = 4,
  gridGap = 6,
  flickerChance = 0.3,
  color = "rgb(0, 0, 0)",
  width,
  height,
  className,
  maxOpacity = 0.3,
  ...props
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(false)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  const memoizedColor = useMemo(() => {
    const toRGBA = (color: string) => {
      if (typeof window === "undefined") {
        return `rgba(0, 0, 0,`
      }
      const canvas = document.createElement("canvas")
      canvas.width = canvas.height = 1
      const ctx = canvas.getContext("2d")
      if (!ctx) return "rgba(255, 0, 0,"
      ctx.fillStyle = color
      ctx.fillRect(0, 0, 1, 1)
      const [r, g, b] = Array.from(ctx.getImageData(0, 0, 1, 1).data)
      return `rgba(${r}, ${g}, ${b},`
    }
    return toRGBA(color)
  }, [color])

  const setupCanvas = useCallback(
    (canvas: HTMLCanvasElement, width: number, height: number) => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      const cols = Math.ceil(width / (squareSize + gridGap))
      const rows = Math.ceil(height / (squareSize + gridGap))
      const squares = new Float32Array(cols * rows)
      for (let i = 0; i < squares.length; i++) {
        squares[i] = Math.random() * maxOpacity
      }
      return { cols, rows, squares, dpr }
    },
    [squareSize, gridGap, maxOpacity]
  )

  const updateSquares = useCallback(
    (squares: Float32Array, deltaTime: number) => {
      for (let i = 0; i < squares.length; i++) {
        if (Math.random() < flickerChance * deltaTime) {
          squares[i] = Math.random() * maxOpacity
        }
      }
    },
    [flickerChance, maxOpacity]
  )

  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number, cols: number, rows: number, squares: Float32Array, dpr: number) => {
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = "transparent"
      ctx.fillRect(0, 0, width, height)
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const opacity = squares[i * rows + j]
          ctx.fillStyle = `${memoizedColor}${opacity})`
          ctx.fillRect(
            i * (squareSize + gridGap) * dpr,
            j * (squareSize + gridGap) * dpr,
            squareSize * dpr,
            squareSize * dpr
          )
        }
      }
    },
    [memoizedColor, squareSize, gridGap]
  )

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    const ctx = canvas?.getContext("2d") ?? null
    let animationFrameId: number | null = null
    let resizeObserver: ResizeObserver | null = null
    let intersectionObserver: IntersectionObserver | null = null
    let gridParams: ReturnType<typeof setupCanvas> | null = null

    if (canvas && container && ctx) {
      const updateCanvasSize = () => {
        const newWidth = width || container.clientWidth
        const newHeight = height || container.clientHeight
        setCanvasSize({ width: newWidth, height: newHeight })
        gridParams = setupCanvas(canvas, newWidth, newHeight)
      }
      updateCanvasSize()
      let lastTime = 0
      const animate = (time: number) => {
        if (!isInView || !gridParams) return
        const deltaTime = (time - lastTime) / 1000
        lastTime = time
        updateSquares(gridParams.squares, deltaTime)
        drawGrid(ctx, canvas.width, canvas.height, gridParams.cols, gridParams.rows, gridParams.squares, gridParams.dpr)
        animationFrameId = requestAnimationFrame(animate)
      }
      resizeObserver = new ResizeObserver(() => { updateCanvasSize() })
      resizeObserver.observe(container)
      intersectionObserver = new IntersectionObserver(
        ([entry]) => { setIsInView(entry.isIntersecting) },
        { threshold: 0 }
      )
      intersectionObserver.observe(canvas)
      if (isInView) { animationFrameId = requestAnimationFrame(animate) }
    }
    return () => {
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId)
      if (resizeObserver) resizeObserver.disconnect()
      if (intersectionObserver) intersectionObserver.disconnect()
    }
  }, [setupCanvas, updateSquares, drawGrid, width, height, isInView])

  return (
    <div ref={containerRef} className={cn(`h-full w-full ${className}`)} {...props}>
      <canvas
        ref={canvasRef}
        className="pointer-events-none"
        style={{ width: canvasSize.width, height: canvasSize.height }}
      />
    </div>
  )
}
```

- [ ] **Step 5: Write components/ui/tilt-card.tsx**

Write `components/ui/tilt-card.tsx`:
```tsx
"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useRef, createContext, useContext, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

const TILT_MAX = 9;
const TILT_SPRING = { stiffness: 300, damping: 28 } as const;
const GLOW_SPRING = { stiffness: 180, damping: 22 } as const;

type RowCtx = { hoveredId: string | null; setHoveredId: (id: string | null) => void };
const TiltRowContext = createContext<RowCtx>({ hoveredId: null, setHoveredId: () => {} });

export function TiltCardRow({ children, className }: { children: React.ReactNode; className?: string }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  return (
    <TiltRowContext.Provider value={{ hoveredId, setHoveredId }}>
      <div className={className}>{children}</div>
    </TiltRowContext.Provider>
  );
}

export interface TiltCardProps {
  id: string;
  color: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function TiltCard({ id, color, children, className, onClick }: TiltCardProps) {
  const { hoveredId, setHoveredId } = useContext(TiltRowContext);
  const cardRef = useRef<HTMLDivElement>(null);
  const dimmed = hoveredId !== null && hoveredId !== id;
  const normX = useMotionValue(0.5);
  const normY = useMotionValue(0.5);
  const rawRotateX = useTransform(normY, [0, 1], [TILT_MAX, -TILT_MAX]);
  const rawRotateY = useTransform(normX, [0, 1], [-TILT_MAX, TILT_MAX]);
  const rotateX = useSpring(rawRotateX, TILT_SPRING);
  const rotateY = useSpring(rawRotateY, TILT_SPRING);
  const glowOpacity = useSpring(0, GLOW_SPRING);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    normX.set((e.clientX - rect.left) / rect.width);
    normY.set((e.clientY - rect.top) / rect.height);
  }, [normX, normY]);

  const handleMouseEnter = useCallback(() => {
    glowOpacity.set(1);
    setHoveredId(id);
  }, [glowOpacity, setHoveredId, id]);

  const handleMouseLeave = useCallback(() => {
    normX.set(0.5);
    normY.set(0.5);
    glowOpacity.set(0);
    setHoveredId(null);
  }, [normX, normY, glowOpacity, setHoveredId]);

  return (
    <motion.div
      ref={cardRef}
      animate={{ scale: dimmed ? 0.96 : 1, opacity: dimmed ? 0.5 : 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={cn(
        "group/tilt relative overflow-hidden rounded-xl border",
        "border-zinc-200 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
        "dark:border-white/6 dark:bg-white/3 dark:shadow-none",
        "transition-[border-color] duration-300",
        "hover:border-zinc-300 dark:hover:border-white/14",
        className
      )}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onClick={onClick}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-xl"
        style={{ background: `radial-gradient(ellipse at 20% 20%, ${color}14, transparent 65%)` }} />
      <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-xl"
        style={{ opacity: glowOpacity, background: `radial-gradient(ellipse at 20% 20%, ${color}2e, transparent 65%)` }} />
      <div aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-[55%] -translate-x-full -skew-x-12 bg-linear-to-r from-transparent via-white/5 to-transparent transition-transform duration-700 ease-out group-hover/tilt:translate-x-[280%]" />
      <div className="relative z-10">{children}</div>
      <div aria-hidden="true" className="absolute bottom-0 left-0 h-[2px] w-0 rounded-full transition-all duration-500 group-hover/tilt:w-full"
        style={{ background: `linear-gradient(to right, ${color}80, transparent)` }} />
    </motion.div>
  );
}
```

- [ ] **Step 6: Write components/landing/fade-in.tsx**

Write `components/landing/fade-in.tsx`:
```tsx
"use client";

import { useEffect, useRef, useState } from "react";

export function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className="transition-all duration-700 ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
      }}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 7: Commit UI components**

Run:
```bash
cd /Users/donaldcjapi/Desktop/Apps/Kurani.studio && git add lib/utils.ts components/ && git commit -m "feat: add core UI components (card, button, tilt-card, flickering-grid, fade-in)"
```

---

### Task 3: Landing Page Components (Nav + Footer)

**Files:**
- Create: `components/landing/nav.tsx`, `components/landing/footer.tsx`

- [ ] **Step 1: Write components/landing/nav.tsx**

Write `components/landing/nav.tsx`:
```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Kryefaqja" },
  { href: "/#features", label: "Vecori" },
  { href: "/#about", label: "Rreth Nesh" },
];

export function LandingNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto relative z-10">
      <div className="flex items-center gap-8">
        <Link href="/" className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <span className="w-7 h-7 bg-emerald-500 rounded-md flex items-center justify-center text-sm text-gray-950 font-black">Q</span>
          Kurani<span className="text-emerald-400">.</span>
          <span className="text-[10px] text-gray-600 font-normal ml-0.5 tracking-widest">STUDIO</span>
        </Link>
        <div className="hidden sm:flex gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm transition",
                pathname === l.href
                  ? "text-white bg-white/10"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        <Link href="/login" className="px-4 py-2 text-sm text-gray-400 hover:text-white transition">Hyr</Link>
        <Link href="/login" className="px-4 py-2 text-sm bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-md transition">
          Fillo Leximin
        </Link>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Write components/landing/footer.tsx**

Write `components/landing/footer.tsx`:
```tsx
import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="border-t border-gray-800/50 py-10 px-6 bg-gray-950">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <p className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-500 rounded-md flex items-center justify-center text-xs text-gray-950 font-black">Q</span>
              Kurani<span className="text-emerald-400">.</span>
            </p>
            <p className="mt-2 text-sm text-gray-500 max-w-xs leading-relaxed">
              Platforma e pare dixhitale per te lexuar dhe studiuar Kuranin Fisnik ne gjuhen shqipe.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Platforma</p>
            <div className="space-y-2">
              <Link href="/#features" className="block text-sm text-gray-500 hover:text-white transition">Vecori</Link>
              <Link href="/#about" className="block text-sm text-gray-500 hover:text-white transition">Rreth Nesh</Link>
              <Link href="/login" className="block text-sm text-gray-500 hover:text-white transition">Hyr</Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Ligjore</p>
            <div className="space-y-2">
              <span className="block text-sm text-gray-500">Politika e Privatesise</span>
              <span className="block text-sm text-gray-500">Kushtet e Perdorimit</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800/50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
          <p>Krijuar nga <span className="text-gray-400">Donald Cjapi</span></p>
          <p>&copy; 2026 Kurani.studio. Te gjitha te drejtat te rezervuara.</p>
          <p className="font-mono">kurani.studio</p>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Commit landing components**

Run:
```bash
cd /Users/donaldcjapi/Desktop/Apps/Kurani.studio && git add components/landing/ && git commit -m "feat: add landing nav and footer components"
```

---

### Task 4: Landing Page

**Files:**
- Create: `app/layout.tsx`, `app/page.tsx`

- [ ] **Step 1: Write app/layout.tsx**

Write `app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Kurani.studio — Lexo Kuranin ne Shqip",
    template: "%s | Kurani.studio",
  },
  description: "Platforma e pare dixhitale per te lexuar dhe studiuar Kuranin Fisnik ne gjuhen shqipe. Perkthimi shqip nga Hasan Efendi Nahi.",
  keywords: [
    "kuran", "quran", "kurani", "shqip", "albanian", "lexo kuranin",
    "kurani ne shqip", "perkthim kurani", "hasan nahi", "quran albanian",
    "sure", "ajet", "ayah", "surah",
  ],
  authors: [{ name: "Donald Cjapi" }],
  creator: "Donald Cjapi",
  metadataBase: new URL("https://kurani.studio"),
  openGraph: {
    type: "website",
    locale: "sq_AL",
    url: "https://kurani.studio",
    siteName: "Kurani.studio",
    title: "Kurani.studio — Lexo Kuranin ne Shqip",
    description: "Lexo dhe studio Kuranin Fisnik ne gjuhen shqipe. Perkthimi nga Hasan Efendi Nahi.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sq" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50`}>{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Write app/page.tsx (full landing page)**

Write `app/page.tsx`:
```tsx
import Link from "next/link";
import { LandingNav } from "@/components/landing/nav";
import { LandingFooter } from "@/components/landing/footer";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { FadeIn } from "@/components/landing/fade-in";

function ReaderMockup() {
  return (
    <div className="rounded-lg border border-gray-700/50 bg-gray-900 overflow-hidden shadow-2xl shadow-black/50">
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/80 border-b border-gray-700/50">
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500/80" />
          <div className="w-2 h-2 rounded-full bg-yellow-500/80" />
          <div className="w-2 h-2 rounded-full bg-green-500/80" />
        </div>
        <div className="flex-1 mx-6">
          <div className="bg-gray-700/50 rounded px-2 py-0.5 text-[8px] text-gray-400 text-center font-mono">
            kurani.studio/reader/1
          </div>
        </div>
      </div>
      <div className="p-4 space-y-4">
        <div className="text-center">
          <p className="text-emerald-400 text-[10px] font-mono tracking-widest mb-1">SURJA 1</p>
          <p className="text-white font-semibold text-sm">El-Fatiha</p>
          <p className="text-gray-500 text-[10px]">Hapja &bull; 7 ajete &bull; Mekke</p>
        </div>
        <div className="space-y-3">
          {[
            { ar: "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ", sq: "Me emrin e Allahut, te Gjithemeshirshmit, Meshireplotit!", n: 1 },
            { ar: "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ", sq: "Falenderimi i takon Allahut, Zotit te boteve!", n: 2 },
            { ar: "ٱلرَّحْمَٰنِ ٱلرَّحِيمِ", sq: "Te Gjithemeshirshmit, Meshireplotit!", n: 3 },
          ].map((a) => (
            <div key={a.n} className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[8px] flex items-center justify-center font-mono">{a.n}</span>
                <div className="flex-1 space-y-1.5">
                  <p className="text-right text-white text-sm leading-loose font-serif" dir="rtl">{a.ar}</p>
                  <p className="text-gray-400 text-[11px] leading-relaxed">{a.sq}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      <LandingNav />

      {/* Hero */}
      <section className="relative py-16 px-6">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <FlickeringGrid
            className="relative inset-0 z-0 [mask-image:radial-gradient(500px_circle_at_center,white,transparent)]"
            squareSize={4}
            gridGap={6}
            color="#6B7280"
            maxOpacity={0.5}
            flickerChance={0.1}
          />
        </div>
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/5 blur-[120px] rounded-full" />

        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gray-800 bg-gray-900/50 text-xs text-gray-400 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Perkthimi shqip nga Hasan Efendi Nahi
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95]">
            Lexo Kuranin<br />
            <span className="text-emerald-400">ne shqip</span>
          </h1>
          <p className="mt-6 text-lg text-gray-400 max-w-lg mx-auto leading-relaxed">
            Platforma e pare dixhitale per te lexuar dhe studiuar Kuranin Fisnik ne gjuhen shqipe.
          </p>

          <div className="mt-8 flex gap-3 justify-center">
            <Link href="/login" className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg text-base transition shadow-lg shadow-emerald-500/20">
              Fillo Leximin
            </Link>
            <a href="#features" className="px-6 py-3 border border-gray-700 hover:border-gray-500 text-gray-300 rounded-lg transition">
              Meso Me Shume
            </a>
          </div>
        </div>
      </section>

      {/* Browser Mockup */}
      <section className="px-6 pb-20 max-w-5xl mx-auto relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <FlickeringGrid
            className="relative inset-0 z-0 [mask-image:radial-gradient(450px_circle_at_center,white,transparent)]"
            squareSize={4}
            gridGap={6}
            color="#10B981"
            maxOpacity={0.5}
            flickerChance={0.1}
          />
        </div>
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-emerald-500/5 blur-[100px] rounded-full" />
        <FadeIn>
          <div className="relative flex items-center gap-10">
            <div className="flex-1 min-w-[240px] hidden md:block">
              <p className="text-[10px] text-emerald-500 font-mono tracking-widest mb-3">LEXUESI KURANOR</p>
              <h3 className="text-2xl font-bold leading-tight">
                Kurani Fisnik<br />ne ekranin tend<span className="text-emerald-400">.</span>
              </h3>
              <p className="mt-4 text-sm text-gray-400 leading-relaxed">
                Lexo 114 suret me perkthimin shqip, tekst arabisht, dhe shenime. Pa reklama, pa pengesa.
              </p>
              <div className="mt-6 flex gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-xs text-gray-500">114 Sure</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span className="text-xs text-gray-500">6236 Ajete</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  <span className="text-xs text-gray-500">Shenime</span>
                </div>
              </div>
            </div>
            <div className="w-full md:w-[55%] shrink-0">
              <ReaderMockup />
              <p className="text-center text-[10px] text-gray-600 mt-2 font-mono">Kurani.studio &mdash; Lexuesi</p>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 relative">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <FlickeringGrid
            className="relative inset-0 z-0 [mask-image:radial-gradient(450px_circle_at_center,white,transparent)]"
            squareSize={4}
            gridGap={6}
            color="#60A5FA"
            maxOpacity={0.5}
            flickerChance={0.1}
          />
        </div>
        <div className="max-w-5xl mx-auto relative z-10">
          <FadeIn>
            <p className="text-center text-xs text-emerald-500 font-mono tracking-widest mb-2">VECORI</p>
            <h2 className="text-center text-3xl font-bold mb-12">Gjithcka ne nje vend</h2>
          </FadeIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: "01", color: "border-emerald-500/30 hover:border-emerald-500/60", title: "Lexues i Thjeshte", desc: "Lexo suret dhe ajetet me nderfaqe te paster dhe te qarte. Arabic dhe shqip krah per krah." },
              { icon: "02", color: "border-blue-500/30 hover:border-blue-500/60", title: "Kerkim i Avancuar", desc: "Gjej ajete dhe tema ne te gjithe Kuranin. Kerkoni ne shqip ose arabisht." },
              { icon: "03", color: "border-purple-500/30 hover:border-purple-500/60", title: "Ruaj Progresin", desc: "Ruaj faqeruajtesat tuaja dhe kthehu me vone aty ku e ke lene leximin." },
              { icon: "04", color: "border-amber-500/30 hover:border-amber-500/60", title: "Tema Dite / Nate", desc: "Kalo midis temes se drites dhe te erresires per lexim te rehatshem ne cdo kohe." },
              { icon: "05", color: "border-cyan-500/30 hover:border-cyan-500/60", title: "Perkthim Shqip", desc: "Perkthimi i plote nga Hasan Efendi Nahi me shenime dhe komente te detajuara." },
              { icon: "06", color: "border-pink-500/30 hover:border-pink-500/60", title: "Shenim & Reflektime", desc: "Shto shenimet tuaja personale per cdo ajet qe lexon." },
            ].map((f, i) => (
              <FadeIn key={f.icon} delay={i * 100}>
                <div className={`bg-gray-900/50 border ${f.color} rounded-xl p-5 transition-all`}>
                  <span className="text-[10px] font-mono text-gray-600">{f.icon}</span>
                  <h3 className="mt-2 font-semibold text-sm">{f.title}</h3>
                  <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <FlickeringGrid
            className="relative inset-0 z-0 [mask-image:radial-gradient(450px_circle_at_center,white,transparent)]"
            squareSize={4}
            gridGap={6}
            color="#34D399"
            maxOpacity={0.5}
            flickerChance={0.1}
          />
        </div>
        <div className="max-w-4xl mx-auto relative z-10">
          <FadeIn>
            <p className="text-center text-xs text-emerald-500 font-mono tracking-widest mb-2">SI FUNKSIONON</p>
            <h2 className="text-center text-3xl font-bold mb-12">Tri hapa per te filluar</h2>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Regjistrohu", desc: "Krijo nje llogari me Google. Falas dhe e shpejte.", color: "text-emerald-500" },
              { step: "02", title: "Zgjidh Suren", desc: "Shfleto 114 suret e Kuranit Fisnik dhe zgjidh cilen deshiron te lexosh.", color: "text-blue-500" },
              { step: "03", title: "Fillo Leximin", desc: "Lexo ajetet ne arabisht me perkthim shqip. Shto shenime dhe ruaj progresin.", color: "text-amber-500" },
            ].map((s, i) => (
              <FadeIn key={s.step} delay={i * 150}>
                <div className="relative">
                  <span className={`text-5xl font-black ${s.color} opacity-10`}>{s.step}</span>
                  <h3 className="mt-1 font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <FlickeringGrid
            className="relative inset-0 z-0 [mask-image:radial-gradient(450px_circle_at_center,white,transparent)]"
            squareSize={4}
            gridGap={6}
            color="#10B981"
            maxOpacity={0.5}
            flickerChance={0.1}
          />
        </div>
        <FadeIn>
          <div className="relative">
            <h2 className="text-4xl font-bold">Fillo udhetimin tend</h2>
            <p className="mt-3 text-gray-400 max-w-md mx-auto">
              Bashkohu me lexuesit e Kuranit ne shqip. Falas pergjithmone.
            </p>
            <Link href="/login" className="inline-block mt-8 px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg text-lg transition shadow-lg shadow-emerald-500/20">
              Regjistrohu falas
            </Link>
            <p className="mt-3 text-[10px] text-gray-600">Nuk kerkohet karte krediti</p>
          </div>
        </FadeIn>
      </section>

      <LandingFooter />
    </div>
  );
}
```

- [ ] **Step 3: Verify dev server starts**

Run:
```bash
cd /Users/donaldcjapi/Desktop/Apps/Kurani.studio && npm run dev
```

Expected: Dev server starts on localhost:3000, landing page renders.

- [ ] **Step 4: Commit landing page**

Run:
```bash
cd /Users/donaldcjapi/Desktop/Apps/Kurani.studio && git add app/layout.tsx app/page.tsx && git commit -m "feat: add landing page with hero, features, mockup, and CTA sections"
```

---

### Task 5: Supabase Auth Setup

**Files:**
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `middleware.ts`, `app/auth/callback/route.ts`, `app/login/page.tsx`, `.env.local`

- [ ] **Step 1: Create Supabase project via MCP**

Use the Supabase MCP tool to create a project named "kurani-studio" in the user's organization. Then enable Google OAuth in the Supabase dashboard.

- [ ] **Step 2: Write .env.local**

Write `.env.local` with the Supabase project URL and anon key:
```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

- [ ] **Step 3: Write lib/supabase/client.ts**

Write `lib/supabase/client.ts`:
```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 4: Write lib/supabase/server.ts**

Write `lib/supabase/server.ts`:
```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component — middleware handles refresh
          }
        },
      },
    }
  );
}
```

- [ ] **Step 5: Write middleware.ts**

Write `middleware.ts`:
```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  const publicPaths = ["/", "/login", "/auth"];
  const isPublic = publicPaths.some((p) =>
    request.nextUrl.pathname === p || request.nextUrl.pathname.startsWith("/auth")
  );

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (user && request.nextUrl.pathname === "/login") {
    const redirectTo = request.nextUrl.searchParams.get("redirect");
    const url = request.nextUrl.clone();
    url.pathname = redirectTo || "/reader";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

- [ ] **Step 6: Write app/auth/callback/route.ts**

Write `app/auth/callback/route.ts`:
```ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("redirect") || searchParams.get("next") || "/reader";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
```

- [ ] **Step 7: Write app/login/page.tsx**

Write `app/login/page.tsx`:
```tsx
"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { FlickeringGrid } from "@/components/ui/flickering-grid";

export default function LoginPage() {
  async function handleGoogleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center relative">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <FlickeringGrid
          className="relative inset-0 z-0 [mask-image:radial-gradient(400px_circle_at_center,white,transparent)]"
          squareSize={4}
          gridGap={6}
          color="#10B981"
          maxOpacity={0.5}
          flickerChance={0.1}
        />
      </div>
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-emerald-500/5 blur-[120px] rounded-full" />

      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold">
            <span className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-base text-gray-950 font-black">Q</span>
            Kurani<span className="text-emerald-400">.</span>
          </Link>
          <p className="mt-3 text-gray-400 text-sm">Hyr per te lexuar Kuranin ne shqip</p>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded-lg transition"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Vazhdo me Google
          </button>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Duke hyre, pranon kushtet e perdorimit
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Commit auth setup**

Run:
```bash
cd /Users/donaldcjapi/Desktop/Apps/Kurani.studio && git add lib/supabase/ middleware.ts app/auth/ app/login/ && git commit -m "feat: add Supabase Google OAuth with login page, middleware, and callback"
```

---

### Task 6: Quran Data Layer

**Files:**
- Create: `lib/quran/api.ts`, `lib/quran/surahs.ts`

- [ ] **Step 1: Write lib/quran/api.ts**

Write `lib/quran/api.ts`:
```ts
const BASE_URL = "https://quranenc.com/api/v1/translation";
const TRANSLATION_KEY = "albanian_nahi";

export interface Ayah {
  id: string;
  sura: string;
  aya: string;
  arabic_text: string;
  translation: string;
  footnotes: string;
}

interface ApiResponse {
  result: Ayah[];
}

export async function fetchSurah(surahNumber: number): Promise<Ayah[]> {
  const res = await fetch(
    `${BASE_URL}/sura/${TRANSLATION_KEY}/${surahNumber}`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) throw new Error(`Failed to fetch surah ${surahNumber}`);
  const data: ApiResponse = await res.json();
  return data.result;
}
```

- [ ] **Step 2: Write lib/quran/surahs.ts**

Write `lib/quran/surahs.ts`:
```ts
export interface SurahMeta {
  number: number;
  name: string;
  transliteration: string;
  translation: string;
  ayahCount: number;
  revelationType: "Mekke" | "Medine";
}

export const SURAHS: SurahMeta[] = [
  { number: 1, name: "الفاتحة", transliteration: "El-Fatiha", translation: "Hapja", ayahCount: 7, revelationType: "Mekke" },
  { number: 2, name: "البقرة", transliteration: "El-Bekare", translation: "Lopa", ayahCount: 286, revelationType: "Medine" },
  { number: 3, name: "آل عمران", transliteration: "Ali Imran", translation: "Familja e Imranit", ayahCount: 200, revelationType: "Medine" },
  { number: 4, name: "النساء", transliteration: "En-Nisa", translation: "Grate", ayahCount: 176, revelationType: "Medine" },
  { number: 5, name: "المائدة", transliteration: "El-Maide", translation: "Sofra", ayahCount: 120, revelationType: "Medine" },
  { number: 6, name: "الأنعام", transliteration: "El-En'am", translation: "Bagëtitë", ayahCount: 165, revelationType: "Mekke" },
  { number: 7, name: "الأعراف", transliteration: "El-A'raf", translation: "Vendet e Larta", ayahCount: 206, revelationType: "Mekke" },
  { number: 8, name: "الأنفال", transliteration: "El-Enfal", translation: "Preja e Luftës", ayahCount: 75, revelationType: "Medine" },
  { number: 9, name: "التوبة", transliteration: "Et-Teube", translation: "Pendimi", ayahCount: 129, revelationType: "Medine" },
  { number: 10, name: "يونس", transliteration: "Junus", translation: "Junusi", ayahCount: 109, revelationType: "Mekke" },
  { number: 11, name: "هود", transliteration: "Hud", translation: "Hudi", ayahCount: 123, revelationType: "Mekke" },
  { number: 12, name: "يوسف", transliteration: "Jusuf", translation: "Jusufi", ayahCount: 111, revelationType: "Mekke" },
  { number: 13, name: "الرعد", transliteration: "Er-Ra'd", translation: "Bubullima", ayahCount: 43, revelationType: "Medine" },
  { number: 14, name: "إبراهيم", transliteration: "Ibrahim", translation: "Ibrahimi", ayahCount: 52, revelationType: "Mekke" },
  { number: 15, name: "الحجر", transliteration: "El-Hixhr", translation: "Shkëmbi", ayahCount: 99, revelationType: "Mekke" },
  { number: 16, name: "النحل", transliteration: "En-Nahl", translation: "Bleta", ayahCount: 128, revelationType: "Mekke" },
  { number: 17, name: "الإسراء", transliteration: "El-Isra", translation: "Udhëtimi Natën", ayahCount: 111, revelationType: "Mekke" },
  { number: 18, name: "الكهف", transliteration: "El-Kehf", translation: "Shpella", ayahCount: 110, revelationType: "Mekke" },
  { number: 19, name: "مريم", transliteration: "Merjem", translation: "Merjemja", ayahCount: 98, revelationType: "Mekke" },
  { number: 20, name: "طه", transliteration: "Ta-Ha", translation: "Ta-Ha", ayahCount: 135, revelationType: "Mekke" },
  { number: 21, name: "الأنبياء", transliteration: "El-Enbija", translation: "Profetët", ayahCount: 112, revelationType: "Mekke" },
  { number: 22, name: "الحج", transliteration: "El-Haxhxh", translation: "Haxhi", ayahCount: 78, revelationType: "Medine" },
  { number: 23, name: "المؤمنون", transliteration: "El-Mu'minun", translation: "Besimtarët", ayahCount: 118, revelationType: "Mekke" },
  { number: 24, name: "النور", transliteration: "En-Nur", translation: "Drita", ayahCount: 64, revelationType: "Medine" },
  { number: 25, name: "الفرقان", transliteration: "El-Furkan", translation: "Dallimi", ayahCount: 77, revelationType: "Mekke" },
  { number: 26, name: "الشعراء", transliteration: "Esh-Shu'ara", translation: "Poetët", ayahCount: 227, revelationType: "Mekke" },
  { number: 27, name: "النمل", transliteration: "En-Neml", translation: "Milingona", ayahCount: 93, revelationType: "Mekke" },
  { number: 28, name: "القصص", transliteration: "El-Kasas", translation: "Tregimet", ayahCount: 88, revelationType: "Mekke" },
  { number: 29, name: "العنكبوت", transliteration: "El-Ankebut", translation: "Merimanga", ayahCount: 69, revelationType: "Mekke" },
  { number: 30, name: "الروم", transliteration: "Er-Rum", translation: "Romakët", ayahCount: 60, revelationType: "Mekke" },
  { number: 31, name: "لقمان", transliteration: "Llukman", translation: "Llukmani", ayahCount: 34, revelationType: "Mekke" },
  { number: 32, name: "السجدة", transliteration: "Es-Sexhde", translation: "Sexhdeja", ayahCount: 30, revelationType: "Mekke" },
  { number: 33, name: "الأحزاب", transliteration: "El-Ahzab", translation: "Aleatët", ayahCount: 73, revelationType: "Medine" },
  { number: 34, name: "سبأ", transliteration: "Sebe", translation: "Sabaja", ayahCount: 54, revelationType: "Mekke" },
  { number: 35, name: "فاطر", transliteration: "Fatir", translation: "Krijuesi", ayahCount: 45, revelationType: "Mekke" },
  { number: 36, name: "يس", transliteration: "Ja-Sin", translation: "Ja-Sin", ayahCount: 83, revelationType: "Mekke" },
  { number: 37, name: "الصافات", transliteration: "Es-Saffat", translation: "Të Radhiturit", ayahCount: 182, revelationType: "Mekke" },
  { number: 38, name: "ص", transliteration: "Sad", translation: "Sad", ayahCount: 88, revelationType: "Mekke" },
  { number: 39, name: "الزمر", transliteration: "Ez-Zumer", translation: "Grupet", ayahCount: 75, revelationType: "Mekke" },
  { number: 40, name: "غافر", transliteration: "Gafir", translation: "Falësi", ayahCount: 85, revelationType: "Mekke" },
  { number: 41, name: "فصلت", transliteration: "Fussilet", translation: "Të Shpjeguarat", ayahCount: 54, revelationType: "Mekke" },
  { number: 42, name: "الشورى", transliteration: "Esh-Shura", translation: "Konsultimi", ayahCount: 53, revelationType: "Mekke" },
  { number: 43, name: "الزخرف", transliteration: "Ez-Zuhruf", translation: "Zbukurimet", ayahCount: 89, revelationType: "Mekke" },
  { number: 44, name: "الدخان", transliteration: "Ed-Duhan", translation: "Tymi", ayahCount: 59, revelationType: "Mekke" },
  { number: 45, name: "الجاثية", transliteration: "El-Xhathije", translation: "Gjunjëzimi", ayahCount: 37, revelationType: "Mekke" },
  { number: 46, name: "الأحقاف", transliteration: "El-Ahkaf", translation: "Dunat e Rërës", ayahCount: 35, revelationType: "Mekke" },
  { number: 47, name: "محمد", transliteration: "Muhammed", translation: "Muhammedi", ayahCount: 38, revelationType: "Medine" },
  { number: 48, name: "الفتح", transliteration: "El-Fet'h", translation: "Çlirimi", ayahCount: 29, revelationType: "Medine" },
  { number: 49, name: "الحجرات", transliteration: "El-Huxhurat", translation: "Dhomat", ayahCount: 18, revelationType: "Medine" },
  { number: 50, name: "ق", transliteration: "Kaf", translation: "Kaf", ayahCount: 45, revelationType: "Mekke" },
  { number: 51, name: "الذاريات", transliteration: "Edh-Dharijat", translation: "Erërat Shpërndarëse", ayahCount: 60, revelationType: "Mekke" },
  { number: 52, name: "الطور", transliteration: "Et-Tur", translation: "Mali", ayahCount: 49, revelationType: "Mekke" },
  { number: 53, name: "النجم", transliteration: "En-Nexhm", translation: "Ylli", ayahCount: 62, revelationType: "Mekke" },
  { number: 54, name: "القمر", transliteration: "El-Kamer", translation: "Hëna", ayahCount: 55, revelationType: "Mekke" },
  { number: 55, name: "الرحمن", transliteration: "Er-Rahman", translation: "I Gjithëmëshirshmi", ayahCount: 78, revelationType: "Medine" },
  { number: 56, name: "الواقعة", transliteration: "El-Vaki'a", translation: "Ngjarja", ayahCount: 96, revelationType: "Mekke" },
  { number: 57, name: "الحديد", transliteration: "El-Hadid", translation: "Hekuri", ayahCount: 29, revelationType: "Medine" },
  { number: 58, name: "المجادلة", transliteration: "El-Muxhadele", translation: "Debatuesja", ayahCount: 22, revelationType: "Medine" },
  { number: 59, name: "الحشر", transliteration: "El-Hashr", translation: "Grumbullimi", ayahCount: 24, revelationType: "Medine" },
  { number: 60, name: "الممتحنة", transliteration: "El-Mumtehine", translation: "E Provuara", ayahCount: 13, revelationType: "Medine" },
  { number: 61, name: "الصف", transliteration: "Es-Saff", translation: "Rreshti", ayahCount: 14, revelationType: "Medine" },
  { number: 62, name: "الجمعة", transliteration: "El-Xhumu'a", translation: "E Premtja", ayahCount: 11, revelationType: "Medine" },
  { number: 63, name: "المنافقون", transliteration: "El-Munafikun", translation: "Hipokritët", ayahCount: 11, revelationType: "Medine" },
  { number: 64, name: "التغابن", transliteration: "Et-Tegabun", translation: "Humbja", ayahCount: 18, revelationType: "Medine" },
  { number: 65, name: "الطلاق", transliteration: "Et-Talak", translation: "Divorci", ayahCount: 12, revelationType: "Medine" },
  { number: 66, name: "التحريم", transliteration: "Et-Tahrim", translation: "Ndalimi", ayahCount: 12, revelationType: "Medine" },
  { number: 67, name: "الملك", transliteration: "El-Mulk", translation: "Sundimi", ayahCount: 30, revelationType: "Mekke" },
  { number: 68, name: "القلم", transliteration: "El-Kalem", translation: "Lapsi", ayahCount: 52, revelationType: "Mekke" },
  { number: 69, name: "الحاقة", transliteration: "El-Hakka", translation: "E Vërteta", ayahCount: 52, revelationType: "Mekke" },
  { number: 70, name: "المعارج", transliteration: "El-Me'arixh", translation: "Shkallët", ayahCount: 44, revelationType: "Mekke" },
  { number: 71, name: "نوح", transliteration: "Nuh", translation: "Nuhu", ayahCount: 28, revelationType: "Mekke" },
  { number: 72, name: "الجن", transliteration: "El-Xhinn", translation: "Xhinët", ayahCount: 28, revelationType: "Mekke" },
  { number: 73, name: "المزمل", transliteration: "El-Muzzemmil", translation: "I Mbështjelluri", ayahCount: 20, revelationType: "Mekke" },
  { number: 74, name: "المدثر", transliteration: "El-Muddethir", translation: "I Mbuluri", ayahCount: 56, revelationType: "Mekke" },
  { number: 75, name: "القيامة", transliteration: "El-Kijame", translation: "Ringjallja", ayahCount: 40, revelationType: "Mekke" },
  { number: 76, name: "الإنسان", transliteration: "El-Insan", translation: "Njeriu", ayahCount: 31, revelationType: "Medine" },
  { number: 77, name: "المرسلات", transliteration: "El-Murselat", translation: "Të Dërguarat", ayahCount: 50, revelationType: "Mekke" },
  { number: 78, name: "النبأ", transliteration: "En-Nebe", translation: "Lajmi", ayahCount: 40, revelationType: "Mekke" },
  { number: 79, name: "النازعات", transliteration: "En-Nazi'at", translation: "Shkulësit", ayahCount: 46, revelationType: "Mekke" },
  { number: 80, name: "عبس", transliteration: "Abese", translation: "Ai Vrenjti", ayahCount: 42, revelationType: "Mekke" },
  { number: 81, name: "التكوير", transliteration: "Et-Tekvir", translation: "Mbështjellja", ayahCount: 29, revelationType: "Mekke" },
  { number: 82, name: "الانفطار", transliteration: "El-Infitar", translation: "Çarja", ayahCount: 19, revelationType: "Mekke" },
  { number: 83, name: "المطففين", transliteration: "El-Mutaffifin", translation: "Mashtruesit", ayahCount: 36, revelationType: "Mekke" },
  { number: 84, name: "الانشقاق", transliteration: "El-Inshikak", translation: "Shqyerja", ayahCount: 25, revelationType: "Mekke" },
  { number: 85, name: "البروج", transliteration: "El-Buruxh", translation: "Yjësitë", ayahCount: 22, revelationType: "Mekke" },
  { number: 86, name: "الطارق", transliteration: "Et-Tarik", translation: "Ylli i Natës", ayahCount: 17, revelationType: "Mekke" },
  { number: 87, name: "الأعلى", transliteration: "El-A'la", translation: "Më i Larti", ayahCount: 19, revelationType: "Mekke" },
  { number: 88, name: "الغاشية", transliteration: "El-Gashije", translation: "Mbuluesja", ayahCount: 26, revelationType: "Mekke" },
  { number: 89, name: "الفجر", transliteration: "El-Fexhr", translation: "Agimi", ayahCount: 30, revelationType: "Mekke" },
  { number: 90, name: "البلد", transliteration: "El-Beled", translation: "Qyteti", ayahCount: 20, revelationType: "Mekke" },
  { number: 91, name: "الشمس", transliteration: "Esh-Shems", translation: "Dielli", ayahCount: 15, revelationType: "Mekke" },
  { number: 92, name: "الليل", transliteration: "El-Lejl", translation: "Nata", ayahCount: 21, revelationType: "Mekke" },
  { number: 93, name: "الضحى", transliteration: "Ed-Duha", translation: "Paraditja", ayahCount: 11, revelationType: "Mekke" },
  { number: 94, name: "الشرح", transliteration: "Esh-Sherh", translation: "Zgjerimi", ayahCount: 8, revelationType: "Mekke" },
  { number: 95, name: "التين", transliteration: "Et-Tin", translation: "Fiku", ayahCount: 8, revelationType: "Mekke" },
  { number: 96, name: "العلق", transliteration: "El-Alek", translation: "Mpiksja", ayahCount: 19, revelationType: "Mekke" },
  { number: 97, name: "القدر", transliteration: "El-Kadr", translation: "Kadri", ayahCount: 5, revelationType: "Mekke" },
  { number: 98, name: "البينة", transliteration: "El-Bejjine", translation: "Prova", ayahCount: 8, revelationType: "Medine" },
  { number: 99, name: "الزلزلة", transliteration: "Ez-Zelzele", translation: "Tërmeti", ayahCount: 8, revelationType: "Medine" },
  { number: 100, name: "العاديات", transliteration: "El-Adijat", translation: "Galopuesit", ayahCount: 11, revelationType: "Mekke" },
  { number: 101, name: "القارعة", transliteration: "El-Kari'a", translation: "Trokitësja", ayahCount: 11, revelationType: "Mekke" },
  { number: 102, name: "التكاثر", transliteration: "Et-Tekathur", translation: "Grumbullimi", ayahCount: 8, revelationType: "Mekke" },
  { number: 103, name: "العصر", transliteration: "El-Asr", translation: "Koha", ayahCount: 3, revelationType: "Mekke" },
  { number: 104, name: "الهمزة", transliteration: "El-Humeze", translation: "Përgojiësi", ayahCount: 9, revelationType: "Mekke" },
  { number: 105, name: "الفيل", transliteration: "El-Fil", translation: "Elefanti", ayahCount: 5, revelationType: "Mekke" },
  { number: 106, name: "قريش", transliteration: "Kurejsh", translation: "Kurejshitët", ayahCount: 4, revelationType: "Mekke" },
  { number: 107, name: "الماعون", transliteration: "El-Ma'un", translation: "Ndihma e Vogël", ayahCount: 7, revelationType: "Mekke" },
  { number: 108, name: "الكوثر", transliteration: "El-Keuther", translation: "Bollëku", ayahCount: 3, revelationType: "Mekke" },
  { number: 109, name: "الكافرون", transliteration: "El-Kafirun", translation: "Mohuesit", ayahCount: 6, revelationType: "Mekke" },
  { number: 110, name: "النصر", transliteration: "En-Nasr", translation: "Ndihma", ayahCount: 3, revelationType: "Medine" },
  { number: 111, name: "المسد", transliteration: "El-Mesed", translation: "Litari", ayahCount: 5, revelationType: "Mekke" },
  { number: 112, name: "الإخلاص", transliteration: "El-Ihlas", translation: "Sinqeriteti", ayahCount: 4, revelationType: "Mekke" },
  { number: 113, name: "الفلق", transliteration: "El-Felek", translation: "Agimi", ayahCount: 5, revelationType: "Mekke" },
  { number: 114, name: "الناس", transliteration: "En-Nas", translation: "Njerëzit", ayahCount: 6, revelationType: "Mekke" },
];
```

- [ ] **Step 3: Commit quran data layer**

Run:
```bash
cd /Users/donaldcjapi/Desktop/Apps/Kurani.studio && git add lib/quran/ && git commit -m "feat: add Quran data layer with API client and 114 surah metadata"
```

---

### Task 7: Reader App Shell & Layout

**Files:**
- Create: `components/layout/app-shell.tsx`, `components/layout/user-menu.tsx`, `app/reader/layout.tsx`

- [ ] **Step 1: Write components/layout/user-menu.tsx**

Write `components/layout/user-menu.tsx`:
```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function UserMenu({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const name = user.user_metadata?.full_name || user.email || "User";

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[11px] font-bold">
          {name[0].toUpperCase()}
        </div>
        <span className="text-xs text-gray-300 hidden sm:inline">{name}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-500" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="fixed right-4 top-12 w-44 rounded-lg border border-white/10 bg-gray-900 shadow-xl py-1" style={{ zIndex: 9999 }}>
          <div className="px-3 py-2 border-b border-white/10">
            <p className="text-xs font-medium text-gray-200">{name}</p>
            <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors w-full text-left"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Dil
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Write components/layout/app-shell.tsx**

Write `components/layout/app-shell.tsx`:
```tsx
"use client";

import { useState, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import { UserMenu } from "@/components/layout/user-menu";
import type { User } from "@supabase/supabase-js";

const ThemeContext = createContext<{ dark: boolean; toggle: () => void }>({ dark: true, toggle: () => {} });
export const useTheme = () => useContext(ThemeContext);

export function AppShell({ user, children }: { user: User; children: React.ReactNode }) {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("kurani-theme");
    if (saved === "light") setDark(false);
  }, []);

  useEffect(() => {
    localStorage.setItem("kurani-theme", dark ? "dark" : "light");
  }, [dark]);

  function toggle() { setDark(!dark); }

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      <div className="flex-1 flex flex-col overflow-hidden h-screen">
        <div
          className={`shrink-0 flex items-center px-3 py-1.5 border-b transition-colors ${
            dark ? "bg-gray-950 border-white/5" : "bg-white border-gray-200"
          }`}
          style={{ zIndex: 100 }}
        >
          <Link href="/reader" className="text-sm font-bold mr-4 shrink-0 flex items-center gap-1.5">
            <span className="w-6 h-6 bg-emerald-500 rounded-md flex items-center justify-center text-[10px] text-gray-950 font-black">Q</span>
            <span className={dark ? "text-white" : "text-gray-900"}>Kurani</span>
            <span className="text-emerald-400">.</span>
          </Link>

          <div className="flex-1" />

          <div className="flex items-center gap-1">
            <button
              onClick={toggle}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                dark ? "text-gray-400 hover:text-white hover:bg-white/10" : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              }`}
              title={dark ? "Tema e drites" : "Tema e erret"}
            >
              {dark ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>
            <UserMenu user={user} />
          </div>
        </div>

        <main
          data-app-main
          className={`flex-1 min-h-0 min-w-0 relative transition-colors p-3 overflow-y-auto ${
            dark ? "bg-gray-950 text-gray-200 dark" : "bg-gray-50 text-gray-900"
          }`}
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle, ${dark ? "#10B981" : "#10B981"} 1px, transparent 1px)`,
              backgroundSize: "10px 10px",
              maskImage: "radial-gradient(600px circle at center, white, transparent)",
              WebkitMaskImage: "radial-gradient(600px circle at center, white, transparent)",
            }}
          />
          <div className="relative z-10">{children}</div>
        </main>
      </div>
    </ThemeContext.Provider>
  );
}
```

- [ ] **Step 3: Write app/reader/layout.tsx**

Write `app/reader/layout.tsx`:
```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";

export default async function ReaderLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <AppShell user={user}>{children}</AppShell>;
}
```

- [ ] **Step 4: Commit app shell**

Run:
```bash
cd /Users/donaldcjapi/Desktop/Apps/Kurani.studio && git add components/layout/ app/reader/layout.tsx && git commit -m "feat: add reader app shell with theme toggle and user menu"
```

---

### Task 8: Surah List Page (Reader Home)

**Files:**
- Create: `components/reader/surah-card.tsx`, `app/reader/page.tsx`

- [ ] **Step 1: Write components/reader/surah-card.tsx**

Write `components/reader/surah-card.tsx`:
```tsx
"use client";

import Link from "next/link";
import type { SurahMeta } from "@/lib/quran/surahs";

export function SurahCard({ surah }: { surah: SurahMeta }) {
  return (
    <Link href={`/reader/${surah.number}`}>
      <div className="group bg-gray-900/50 dark:bg-white/3 border border-gray-800 dark:border-white/6 hover:border-emerald-500/40 rounded-xl p-4 transition-all hover:shadow-lg hover:shadow-emerald-500/5">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-sm font-bold font-mono">
            {surah.number}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-sm text-white group-hover:text-emerald-400 transition-colors truncate">
                {surah.transliteration}
              </h3>
              <span className="text-right text-base font-serif text-gray-400 shrink-0" dir="rtl">
                {surah.name}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{surah.translation}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] text-gray-600 font-mono">{surah.ayahCount} ajete</span>
              <span className="text-[10px] text-gray-700">&bull;</span>
              <span className="text-[10px] text-gray-600 font-mono">{surah.revelationType}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Write app/reader/page.tsx**

Write `app/reader/page.tsx`:
```tsx
import { SURAHS } from "@/lib/quran/surahs";
import { SurahCard } from "@/components/reader/surah-card";

export const metadata = { title: "Lexuesi" };

export default function ReaderPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Kurani Fisnik</h1>
        <p className="text-sm text-gray-500 mt-1">114 sure &bull; Perkthimi shqip nga Hasan Efendi Nahi</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {SURAHS.map((surah) => (
          <SurahCard key={surah.number} surah={surah} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit surah list**

Run:
```bash
cd /Users/donaldcjapi/Desktop/Apps/Kurani.studio && git add components/reader/surah-card.tsx app/reader/page.tsx && git commit -m "feat: add surah list grid page with 114 surah cards"
```

---

### Task 9: Surah Reading View

**Files:**
- Create: `components/reader/ayah-display.tsx`, `app/reader/[surah]/page.tsx`

- [ ] **Step 1: Write components/reader/ayah-display.tsx**

Write `components/reader/ayah-display.tsx`:
```tsx
"use client";

import { useState } from "react";
import type { Ayah } from "@/lib/quran/api";

export function AyahDisplay({ ayah }: { ayah: Ayah }) {
  const [showFootnotes, setShowFootnotes] = useState(false);
  const hasFootnotes = ayah.footnotes && ayah.footnotes.trim().length > 0;

  return (
    <div className="bg-gray-900/30 dark:bg-white/2 border border-gray-800/50 dark:border-white/5 rounded-xl p-4 transition-colors hover:border-emerald-500/20">
      <div className="flex items-start gap-3">
        <span className="shrink-0 w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 text-xs flex items-center justify-center font-mono font-bold">
          {ayah.aya}
        </span>
        <div className="flex-1 space-y-3">
          <p className="text-right text-xl leading-[2.2] text-white font-serif" dir="rtl">
            {ayah.arabic_text}
          </p>
          <p className="text-sm text-gray-400 leading-relaxed">
            {ayah.translation}
          </p>
          {hasFootnotes && (
            <>
              <button
                onClick={() => setShowFootnotes(!showFootnotes)}
                className="text-[11px] text-emerald-500 hover:text-emerald-400 transition-colors font-mono"
              >
                {showFootnotes ? "Fshih shenimet" : "Shiko shenimet"}
              </button>
              {showFootnotes && (
                <div className="text-xs text-gray-500 leading-relaxed bg-gray-800/30 rounded-lg p-3 border border-gray-800/50">
                  {ayah.footnotes}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write app/reader/[surah]/page.tsx**

Write `app/reader/[surah]/page.tsx`:
```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchSurah } from "@/lib/quran/api";
import { SURAHS } from "@/lib/quran/surahs";
import { AyahDisplay } from "@/components/reader/ayah-display";

interface PageProps {
  params: Promise<{ surah: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { surah: surahParam } = await params;
  const surahNum = parseInt(surahParam, 10);
  const meta = SURAHS.find((s) => s.number === surahNum);
  if (!meta) return { title: "Nuk u gjet" };
  return { title: `${meta.transliteration} — ${meta.translation}` };
}

export default async function SurahPage({ params }: PageProps) {
  const { surah: surahParam } = await params;
  const surahNum = parseInt(surahParam, 10);
  if (isNaN(surahNum) || surahNum < 1 || surahNum > 114) notFound();

  const meta = SURAHS.find((s) => s.number === surahNum);
  if (!meta) notFound();

  const ayahs = await fetchSurah(surahNum);

  const prev = surahNum > 1 ? SURAHS[surahNum - 2] : null;
  const next = surahNum < 114 ? SURAHS[surahNum] : null;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <Link href="/reader" className="inline-block text-xs text-emerald-500 hover:text-emerald-400 font-mono tracking-widest mb-3 transition-colors">
          &larr; TE GJITHA SURET
        </Link>
        <h1 className="text-3xl font-bold">{meta.transliteration}</h1>
        <p className="text-xl font-serif text-gray-400 mt-1" dir="rtl">{meta.name}</p>
        <p className="text-sm text-gray-500 mt-2">
          {meta.translation} &bull; {meta.ayahCount} ajete &bull; {meta.revelationType}
        </p>
      </div>

      {/* Bismillah (skip for surah 9) */}
      {surahNum !== 9 && surahNum !== 1 && (
        <div className="text-center mb-6 py-4">
          <p className="text-lg font-serif text-emerald-400" dir="rtl">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
          <p className="text-xs text-gray-500 mt-1">Me emrin e Allahut, te Gjithemeshirshmit, Meshireplotit</p>
        </div>
      )}

      {/* Ayahs */}
      <div className="space-y-3">
        {ayahs.map((ayah) => (
          <AyahDisplay key={ayah.id} ayah={ayah} />
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-800/50">
        {prev ? (
          <Link href={`/reader/${prev.number}`} className="text-sm text-gray-400 hover:text-emerald-400 transition-colors">
            &larr; {prev.transliteration}
          </Link>
        ) : <div />}
        {next ? (
          <Link href={`/reader/${next.number}`} className="text-sm text-gray-400 hover:text-emerald-400 transition-colors">
            {next.transliteration} &rarr;
          </Link>
        ) : <div />}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify the full app works locally**

Run:
```bash
cd /Users/donaldcjapi/Desktop/Apps/Kurani.studio && npm run build
```

Expected: Build succeeds (auth pages may show warnings without env vars, but should compile).

- [ ] **Step 4: Commit reader**

Run:
```bash
cd /Users/donaldcjapi/Desktop/Apps/Kurani.studio && git add components/reader/ayah-display.tsx app/reader/ && git commit -m "feat: add surah reading view with ayah display, navigation, and footnotes"
```

---

### Task 10: Create Supabase Project, GitHub Repo & Deploy to Vercel

- [ ] **Step 1: Create Supabase project**

Use the Supabase MCP tool to:
1. List organizations to find the org ID
2. Create a new project named "kurani-studio" with a secure password
3. Get the project URL and anon key
4. Write them to `.env.local`

- [ ] **Step 2: Enable Google OAuth in Supabase**

Tell the user they need to:
1. Go to the Supabase dashboard > Authentication > Providers > Google
2. Enable Google provider
3. Set up OAuth credentials in Google Cloud Console
4. Add the redirect URL: `https://<project-ref>.supabase.co/auth/v1/callback`

- [ ] **Step 3: Create GitHub repository**

Run:
```bash
cd /Users/donaldcjapi/Desktop/Apps/Kurani.studio && gh repo create kurani-studio --public --source=. --push
```

- [ ] **Step 4: Deploy to Vercel**

Run:
```bash
cd /Users/donaldcjapi/Desktop/Apps/Kurani.studio && npx vercel --yes
```

Then set environment variables:
```bash
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

- [ ] **Step 5: Redeploy with env vars**

Run:
```bash
cd /Users/donaldcjapi/Desktop/Apps/Kurani.studio && npx vercel --prod
```
