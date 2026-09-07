# NOXA Event Publishing Standard

This document is the website editorial contract for every public automotive or motorcycle event published by NOXA.

## Hard publication requirements

An event must not become `published` until the following facts are verified from a public source:

1. **Public title** — concise event name, without collector/admin suffixes such as `| Αναγγελία`, `Announcement`, or `Δελτίο Τύπου`.
2. **Date and time** — verified start time, valid timezone, and an end time that is later than the start when an end is known.
3. **Location** — a real venue, route, stage area, or city. Never invent a precise location from a city name.
4. **Organizer** — the actual organizer. A federation or publication used as the information source is not automatically the organizer.
5. **Source** — a valid HTTPS page supporting the published facts.
6. **Public description** — factual visitor-facing copy, not collector notes. It should explain what the event is and include the important program/schedule, stages or route, relevant championship context, start/finish/awards times, and meaningful figures when those details are available from the source.
7. **No internal placeholders** — text such as `Review the original source before publishing`, `Official OMAE event announcement`, `This is an event reminder`, TODO/TBD, or equivalent internal notes must never reach a public page.

## Localization

For Greek events, NOXA should provide EN and EL public copy where evidence supports it:

- title
- description
- location text

Missing Greek localization is an editorial warning in Quality Gate v1 rather than a hard database blocker, because verified third-party organizers can currently publish through a single-language form. It must still be completed during NOXA editorial review whenever NOXA itself publishes the event.

## Images

Use a cover only when it is directly connected to the specific event and its source is known.

When a cover is present, store:

- `cover_image_url`
- `cover_image_source_url`
- accessible alt text

Do not use a photo from another year, another event, a random automotive image, an AI substitute, or an unverified social screenshot. If no verified image is available, use the branded NOXA fallback.

## Map / coordinates

Map actions are shown only when the event has confirmed exact coordinates:

- `latitude`
- `longitude`
- `location_precision = exact`

A city, region, route description, inferred venue, or approximate geocode must not be presented as an exact event pin.

For rallies, group drives and other multi-location events, keep Map hidden unless there is one clearly defined exact public point that is useful and truthful (for example a confirmed start/meeting point).

## Legacy events

Quality Gate v1 does not silently remove already-published legacy events. Existing rows that pass the new rules are marked as quality-gated. Legacy rows that fail remain visible for deliberate cleanup and must pass the gate before being republished after an unpublish/cancel cycle.
