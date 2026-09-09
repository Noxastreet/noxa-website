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

## Public surfaces

Supply Platform P1 makes these product routes public:

- `/organizers` and `/el/organizers`
- verified organizer profiles under `/organizers/[slug]`
- `/organizers/apply`
- reviewed claim entry points under `/organizers/[slug]/claim`

Verified organizer directory/profile pages may be indexed. Claim pages and the authenticated `/organizer` dashboard are `noindex`; the dashboard remains protected by Supabase authentication and RLS.

## Access boundary

Submitting or claiming never gives immediate write access. NOXA Admin approval creates an owner invite. The user must authenticate with the invited email and claim the invite through the existing Organizer access flow.

## Production rollout order

The backend is intentionally deployed before the new public UI so a Vercel deployment can never expose Claim against an old database/function contract.

1. Obtain explicit owner approval for the production rollout.
2. Apply `20260909103000_supply_platform_claim_organizer.sql` to Website Supabase.
3. Deploy the updated `organizer-submit-application` Edge Function.
4. Deploy the updated `radar-submit-event` Edge Function.
5. Verify the existing production forms still work with the updated backward-compatible endpoints.
6. Merge the approved PR to `main` using the expected exact head SHA.
7. Verify the Vercel production deployment and run production smoke/runtime checks.

The migration is additive and gives existing organizer applications `application_kind = 'new'`. The updated organizer endpoint also treats a missing `applicationKind` as `new`, so deploying the migration/function before the UI is backward-compatible with the currently deployed form.
