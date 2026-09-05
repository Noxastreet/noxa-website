# NOXA Website Product Upgrade — 2026-09-05

Release branch: `feature/site-product-upgrade-20260905`

## Product goal

Keep the website focused on one clear job: discover real car/moto events and the communities/organizers behind them. The mobile app remains a separate future social product.

## Included in this release

- [x] Search Meets by event, organizer, city, region, location or type.
- [x] Date discovery: Happening now, Today, Tomorrow, This weekend, This month.
- [x] Faster quick filters for Happening now / Today / This weekend / Saved.
- [x] Near me: browser geolocation resolves the visitor's city/country and selects matching event geography when available.
- [x] Country / City / Type / Date filters remain one coherent discovery flow.
- [x] Save Event without an account using local browser storage.
- [x] Saved events filter on Meets.
- [x] Add to Calendar using a generated `.ics` event file.
- [x] Native Share / copy-link fallback.
- [x] Generate a NOXA 1080×1920 Story Card from an event page.
- [x] Report incorrect event information: date/time, location, cancellation, duplicate or other.
- [x] Past events archive while removing past events from the active discovery feed.
- [x] Past event pages remain accessible and are clearly marked as past.
- [x] Public organizer profiles with verified / partner state, official links, upcoming events and past events.
- [x] Community pages link to real NOXA event pages instead of sending users straight to the external source.
- [x] Community ↔ Organizer ↔ Event relationships are surfaced when database relationships exist.
- [x] City alert preference capture.
- [x] Organizer follow preference capture.
- [x] Follow-preference confirmation email reuses existing Resend configuration when available.
- [x] Homepage prioritizes `This weekend in Greece` when relevant events exist, with city counts.
- [x] Featured/promoted event support in the database and public UI.
- [x] NOXA Partner badge support for organizers and event-level partner badges.
- [x] Community navigation no longer advertises old `/radar`, Crews or Routes as current website products.
- [x] `Add Event` remains the main public submission CTA only on `/meets` top-right.
- [x] EN / EL routes included for new public archive and organizer pages.

## Explicitly deferred

- [ ] Map View. Deferred by product decision for a later release.
- [ ] Automatic background dispatch of new-event alerts to saved city/organizer subscriptions. This release stores the preference and can send a confirmation email; automated matching-event delivery must be implemented as a separate scheduled/triggered notification system before it is marketed as live.
- [ ] Full account-based saved-event synchronization. Current Save Event is intentionally no-login/local-browser only.

## Data / privacy notes

- Event corrections and follow preferences are insert-only for public users through RLS.
- No service-role secret is exposed to the browser.
- Reverse geocoding runs server-side, validates coordinates, applies request throttling and short-term cache/provider spacing.
- Geolocation is requested only after the user taps `Near me`.

## Release gate

Before merge to `main`:

1. TypeScript check passes.
2. ESLint passes.
3. Next.js production build passes.
4. Existing adapter tests pass.
5. Route smoke tests pass.
6. No Map View was added.
7. Public website still uses website Supabase `qrouwtqsqrfeeeppyeru` only.
8. Mobile app repository and app Supabase remain untouched.
9. After merge, perform one production Vercel deployment and verify key routes on `noxastreetapp.com`.
