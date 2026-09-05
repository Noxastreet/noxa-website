# NOXA Meets growth update

This update intentionally excludes Map View.

## Included

- Search by event title, organizer and city
- Date discovery: Happening now state, Today, Tomorrow, This weekend, This month, All upcoming
- Saved events in local browser storage
- Add to Calendar (.ics + Google Calendar)
- Story Card image generation and share/download
- Event correction/report flow
- Public archive for past events
- Public organizer profiles with upcoming and past events
- Organizer ↔ community ↔ event linking
- City and organizer update subscription capture
- Featured event and partner badge presentation using real database state only
- Homepage “This weekend in Greece” discovery block
- Navigation cleanup away from legacy Radar/Crews/Routes public paths

## Blocked

- Near me is blocked until published events have trusted coordinates or the website has an approved geocoding source. NOXA must not display invented distances.

## Deployment rule

Build and validate the whole update before merging to main. Production deployment should happen only after the final merge.
