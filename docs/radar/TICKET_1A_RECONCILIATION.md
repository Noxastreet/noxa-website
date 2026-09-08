# NOXA Radar — Ticket 1A reconciliation

Date: 2026-09-08

## Goal

Reconcile the Radar backend that is actually used in production with GitHub `main`, remove false failure noise from best-effort social collection, and define the next auto-enrichment boundary without implementing auto-publishing yet.

## Canonical baseline

GitHub `main` at audit start:

`fdceb93a93d3f200e6fef828d24f505895340b20`

Website Supabase:

`qrouwtqsqrfeeeppyeru`

## Production-to-repository reconciliation

### Canonical and actively used

- `radar-collector` — already present in GitHub and deployed.
- `radar-social-collector` — deployed and invoked by the Radar admin `Scan sources` flow, but its source was missing from `main`. Restore it under `supabase/functions/radar-social-collector/index.ts`.
- `radar-submit-event` — deployed and directly invoked by the public event suggestion form, but its source was missing from `main`. Restore it under `supabase/functions/radar-submit-event/index.ts` without changing behavior in this ticket.

### Production residue / decommission candidate

- `meet-public` is deployed in Supabase, but current website code uses `/api/meets/report` and `/api/meets/follow` instead. No current GitHub reference to `functions/v1/meet-public` was found.
- Do not restore `meet-public` as canonical application code in this ticket.
- Do not undeploy it yet: external callers have not been proven absent. Decommissioning requires a separate runtime/log verification.

## Social collector policy

Public Meta HTML is best effort only. Access controls are never bypassed.

Expected source limitations are recorded but are not infrastructure failures:

- `429` → `rate_limited`;
- login wall / `401` / `403` → `unsupported`;
- unexpected parser/network/database errors → `failed` and increment `error_count`.

The existing database status constraint already supports `rate_limited` and `unsupported`; no migration is required.

## Existing Radar pipeline to preserve

`Source → Candidate → manual AI analysis/review → Quality Gate → Approval → Published Event`

Reuse:

- existing collectors and deduplication;
- existing `radar_candidates` and `radar_events`;
- existing Gemini analysis endpoint and AI audit fields;
- existing production Quality Gate;
- existing approval-to-publication database trigger;
- existing EN/EL and media/exact-location event fields;
- existing Meets discovery and event-page UX.

Do not create a second event table, a second quality gate, or a parallel publication pipeline.

## Next ticket boundary: auto-enrichment

Ticket 1B may introduce an idempotent enrichment worker/job for candidates that need analysis. Desired logical flow:

`NEW → Enrichment → Validation → VERIFIED | REVIEW_REQUIRED | REJECTED`

Rules:

1. Enrichment may only use evidence from the source/candidate and explicitly trusted lookups.
2. Missing facts remain missing; no invented organizer, date, time, venue, coordinates, image, or translation fact.
3. Existing Quality Gate remains the final database safety barrier before approval/publication.
4. Auto-approval is allowed only when all required evidence is source-confirmed and the candidate passes the existing Quality Gate.
5. Uncertain candidates remain available to Radar Admin for human review.
6. Processing must be idempotent and auditable; retrying the same candidate must not create duplicate events.
7. Official event-specific media may be selected automatically only at high confidence; otherwise use the existing NOXA fallback.
8. Auto-enrichment must not be coupled to the optional social collector: official website sources must continue independently when Meta blocks public HTML.

No auto-publishing implementation is part of Ticket 1A.

## Verification required before merge/deploy

- PR CI: typecheck, Radar adapter fixtures, Radar quality fixtures, Meets growth fixtures, platform flows, lint, production build, route smoke, Lighthouse.
- Confirm diff contains no schema/migration changes.
- Confirm `radar-submit-event` repository copy matches deployed v1 behavior.
- Confirm social collector changes are limited to expected-access classification plus source-control restoration.
- After an explicitly approved deployment, run one controlled social collector scenario and verify Meta 429 is stored as `rate_limited` without a failed collector run.
- Verify the primary `radar-collector` remains unchanged and successful.
