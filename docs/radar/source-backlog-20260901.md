# NOXA Radar — Greece source backlog

Date: 2026-09-01

These sources are verified public discovery candidates. They are **not activated in the collector until a dedicated adapter or official API path is implemented**. This avoids turning unsupported sources into noisy production errors.

## Priority A — community / meets

### Hellenic Spot
- URL: https://hellenicspot.gr/
- Focus: Greek automotive community and hosted car meets.
- Evidence: the site has an `Our Events` section and describes itself as a Greek automotive community.
- Intended adapter: website event-list parser.
- Suggested event types: `car_meet`, `group_drive`, `show`, `festival`.

### Cars & Coffee — Greece discovery
- URL: https://cars.coffee/find-events
- Focus: Cars & Coffee events by country; Greece is currently listed in the event finder.
- Intended adapter: country-specific event discovery/parser.
- Suggested event type: `cars_and_coffee`.

## Priority A — moto community

### ELMOTO Events
- URL: https://elmoto.gr/category/events/
- Focus: Greek motorcycle federation/community gatherings and events.
- Intended adapter: WordPress/category article parser.
- Suggested event types: `moto_meet`, `group_drive`, `festival`.

### VOGE Moto Club Hellas
- URL: https://vogemotoclub.gr/
- Focus: motorcycle community meetings, rides and club activities in Greece.
- Public social handle referenced by the site: `@vogemotoclubgr`.
- Intended adapter: website announcements first; Meta API social discovery later.
- Suggested event types: `moto_meet`, `group_drive`.

## Priority B — moto exhibitions / larger events

### Motorcycle Events Greece
- URL: https://motorcycleevents.gr/
- Focus: motorcycle exhibitions and lifestyle events in Greece.
- Intended adapter: website event parser.
- Suggested event types: `show`, `festival`, `moto_meet`.

### Moto Expo Greece
- URL: https://moto-expo.gr/
- Focus: official motorcycle exhibition and special events.
- Intended adapter: website event parser.
- Suggested event types: `show`, `festival`.

## Discovery-only leads

### Carspecs Club Culture
- URL: https://www.carspecs.gr/
- Focus: articles about Greek car clubs and communities. Useful for discovering organizer accounts rather than direct automatic event ingestion.
- Example discovered community: BMW Club Alexandroupolis / `@bmw_e46_club_axd`.

### SVOA club directory
- URL: https://www.svoa.gr/clubs
- Focus: directory of Greek automotive clubs and enthusiast communities.
- Use: organizer/source discovery only; do not treat the directory itself as an event feed.

## Social collection rule

Instagram/Facebook sources remain public-only. Direct HTML access is best-effort and may be blocked by Meta. Stable social discovery should use the official Meta Graph API after NOXA completes Meta Developer verification. No login, CAPTCHA or private-group bypass is permitted.
