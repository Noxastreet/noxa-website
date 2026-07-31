# NOXA Website Production Deployment

This document is the production checklist for `noxastreetapp.com`.

## Hosting target

- Platform: Vercel
- Repository: `Noxastreet/noxa-website`
- Production branch: `main`
- Framework preset: Next.js
- Node.js: 22.x

## Required environment variables

Configure these only in the Vercel project settings. Do not commit real values to GitHub.

```text
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
```

Use the production NOXA Supabase project URL and an enabled publishable key. Never use a service-role key for this website.

Apply both variables to:

- Production
- Preview

## Vercel project setup

1. Import the GitHub repository `Noxastreet/noxa-website` into Vercel.
2. Keep the detected framework as Next.js.
3. Set the production branch to `main`.
4. Add the two Supabase environment variables.
5. Deploy a preview from the pull request branch.
6. Verify the preview on mobile and desktop.
7. Merge the validated pull request into `main`.
8. Attach `noxastreetapp.com` as the production domain.
9. Follow the DNS records supplied by Vercel.
10. Confirm HTTPS is active before sharing the site publicly.

## Required pre-merge checks

- GitHub Actions is green.
- Lighthouse CI passes all configured budgets.
- Waitlist form records a real test email in `public.prelaunch_waitlist`.
- A repeated email returns the already-joined state.
- Mobile Safari and Android Chrome complete the Hero and Product Story without a scroll trap.
- Desktop Chrome or Safari renders the wide-screen layout correctly.
- Privacy and terms links are ready before opening the waitlist to the public.

## Post-deploy smoke test

Run against the live production domain:

```bash
PRODUCTION_URL=https://noxastreetapp.com npm run smoke:production
```

The smoke test validates:

- homepage
- health endpoint
- robots.txt
- sitemap.xml
- web manifest
- NOXA icon

## Runtime endpoints

```text
GET /api/health
POST /api/waitlist
GET /robots.txt
GET /sitemap.xml
GET /manifest.webmanifest
GET /icon.svg
```

## Rollback

If the production deployment is unhealthy:

1. Promote the previous stable Vercel deployment.
2. Do not alter the production Supabase schema during rollback.
3. Keep the failed GitHub commit available for investigation.
4. Re-run GitHub Actions and the production smoke test before promoting a replacement.
