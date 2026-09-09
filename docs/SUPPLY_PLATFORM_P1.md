# NOXA Supply Platform P1

## Product scope

NOXA serves public car and motorcycle events in Greece.

## Public event submission

`/meets/submit` and `/el/meets/submit` send an event into the existing Radar candidate queue.

Flow:

`Add Event -> radar-submit-event -> radar_candidates:new -> existing enrichment / Quality Gate -> review or publication`

Public submission never bypasses the existing publication Quality Gate. The public endpoint accepts Greece (`GR`) only.

## Organizer onboarding

New organizer:

`Organizers -> New Organizer -> organizer-submit-application -> organizer_applications:new -> NOXA Admin review -> organizer profile + owner invite`

Existing organizer claim:

`Organizer profile -> Claim this profile -> organizer-submit-application -> organizer_applications:claim -> NOXA Admin review -> owner invite for existing profile`

A claim never creates a second organizer profile. A claim target must already be an active, verified public organizer. Community-type organizer profiles keep their existing Community flow and are excluded from this claim path.

## Access boundary

Submitting or claiming never gives immediate write access. NOXA Admin approval creates an owner invite. The user must authenticate with the invited email and claim the invite through the existing Organizer access flow.

## Deployment order

1. Merge owner-approved code to `main`.
2. Apply `20260909103000_supply_platform_claim_organizer.sql` to Website Supabase.
3. Deploy the updated `organizer-submit-application` Edge Function.
4. Deploy the updated `radar-submit-event` Edge Function.
5. Let Vercel production serve the merged `main`.

The organizer migration must be applied before deploying the updated organizer application Edge Function because the function writes the new `application_kind` and `claimed_organizer_id` columns.
