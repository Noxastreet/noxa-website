# Radar architecture reconciliation — 2026-09-08

## Scope

This note documents the website-only NOXA Radar backend after Ticket 1A reconciliation.

Canonical systems:
- GitHub: `Noxastreet/noxa-website`
- Website Supabase: `qrouwtqsqrfeeeppyeru`

Explicitly out of scope:
- `Noxastreet/Noxa-app`
- mobile Supabase `wzfpwuyyaotvofdijhin`

## Current pipeline

```text
radar_sources
  -> radar-collector / radar-social-collector
  -> radar_candidates (new / needs_review / duplicate / rejected / approved)
  -> manual/admin review today
  -> DB publication quality gate
  -> approval trigger
  -> radar_events (published)
  -> /meets
```

Public event submissions enter `radar_candidates` through `radar-submit-event` and never publish directly.

Public event report/follow actions are handled by `meet-public`.

## Source-control rule

Every deployed Edge Function used by the website must have its source under `supabase/functions/<function-name>/` before further behavior changes are made.

Ticket 1A restores source control for:
- `radar-social-collector`
- `radar-submit-event`
- `meet-public`

## Social-source policy

Instagram/Facebook public HTML is best-effort only.

A response that requires login or returns 401/403/429 is a source-access limitation, not a NOXA system failure. It is recorded as `radar_source_checks.status = unsupported` and does not increase the collector run `error_count`.

NOXA must not add bypasses, credential scraping, login automation, or aggressive retry behavior to work around platform access controls.

## Next step: Ticket 1B auto-enrichment

Do not add a second competing candidate lifecycle. Reuse the current candidate statuses and database Quality Gate.

Target flow:

```text
NEW candidate
  -> deterministic/source enrichment
  -> source verification
  -> AI normalization/enrichment
  -> validation outcome
       high-confidence + quality gate clean -> approve
       uncertain/missing evidence          -> needs_review
       clearly invalid                     -> rejected
  -> existing DB approval trigger publishes
```

The enrichment layer should fill only evidence-backed values: title, organizer, event type, date/time/timezone, city/region/location, summary, Greek localization, media provenance, and coordinates/location precision when independently defensible.

No auto-publishing implementation is part of Ticket 1A.
