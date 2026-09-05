# NOXA Meets Growth Release — 2026-09-05

This release expands the website product without coupling it to the NOXA mobile app.

## Included

- [x] Search by event, organizer, city and location
- [x] Country and city discovery controls
- [x] Near me using browser geolocation + server-side reverse geocoding
- [x] Happening now filter
- [x] Today filter
- [x] Tomorrow filter
- [x] This weekend filter
- [x] This month filter
- [x] Saved events filter
- [x] Save/unsave an event locally without account creation
- [x] Add event to calendar via `.ics`
- [x] Share event through the native share sheet
- [x] Generate a NOXA-branded 1080x1920 Story Card for an event
- [x] Report/correct wrong event information
- [x] Past-events archive with stable event URLs
- [x] Public organizer profiles
- [x] Organizer upcoming and past events
- [x] Community → Organizer linkage
- [x] Community → NOXA Meets event linkage
- [x] Event → Community linkage when available
- [x] Event → Organizer linkage
- [x] Follow a city preference by email
- [x] Follow an organizer preference by email
- [x] Featured event support
- [x] Partner badge support
- [x] Stronger homepage “This weekend in Greece” module
- [x] Simplified Communities navigation around Meets / Communities / Organizer
- [x] English and Greek public routes for the new archive and organizer profiles

## Deliberately deferred

- [ ] Map View / map-based browsing of the Meets directory

The existing event-level “Open Map” action remains available.

## Product boundary

This release modifies only `Noxastreet/noxa-website` and website Supabase project `qrouwtqsqrfeeeppyeru`. It does not modify the NOXA mobile application or the mobile-app Supabase project.

## Follow-alert note

The website securely stores city/organizer follow preferences and can send the immediate confirmation email when the existing Resend environment is configured. A future outbound worker can consume these private subscriptions to deliver automatic alerts when matching new events are published.
