# NOXA Website

Official mobile-first launch website for NOXA.

## Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- Motion for React with LazyMotion
- Supabase waitlist persistence
- Vercel production target

## Experience

The website is designed for mobile devices first, then expanded for tablet and desktop. It includes a scroll-linked Hero and a sticky Product Story covering Discover, Meet, Belong and Drive.

The current NOXA app splash screen is deliberately not used.

## Environment

Copy `.env.example` and provide:

```text
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
```

Never expose or commit a Supabase service-role key.

## Commands

```bash
npm install
npm run typecheck
npm run lint
npm run build
npm run dev
```

After deployment:

```bash
PRODUCTION_URL=https://noxastreetapp.com npm run smoke:production
```

## Validation

GitHub Actions runs:

- exact dependency inventory
- TypeScript
- ESLint
- production Next.js build
- built-server route and security-header smoke test
- three Lighthouse mobile audits
- Lighthouse report upload

## Production routes

- `/`
- `/api/health`
- `/api/waitlist`
- `/robots.txt`
- `/sitemap.xml`
- `/manifest.webmanifest`
- `/icon.svg`

See `DEPLOYMENT.md` for the production checklist.

## Production domain

`noxastreetapp.com`
