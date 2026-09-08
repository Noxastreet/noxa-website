# NOXA Radar social sources

Radar stores `instagram` and `facebook` sources in the separate NOXA Radar database.

## Current production policy

Automatic Instagram/Facebook HTML scraping is disabled.

NOXA must not bypass login walls, CAPTCHA, private profiles/groups, rate limits, or other Meta access controls. Until an official Meta API connection is available, active social sources are recorded as:

- `radar_source_checks.status = unsupported`;
- zero items seen/new;
- a clear message that an official Meta API connection is required.

This is an expected limitation, not a Radar infrastructure failure. The social collector run can finish successfully while reporting those sources as unsupported.

## Why

Public Meta HTML is unstable for server-side collection and can return login redirects, HTTP 401/403/429, or hydration-only pages. Continuing to parse that HTML adds noise and security risk without reliable event discovery.

The long-term supported path is an official Meta API connection for organizer accounts/content that the API is allowed to expose.

## Scheduling

- `radar-collector`: structured website collector; remains the reliable automatic discovery path.
- `radar-social-collector`: isolated social-source status collector; does not scrape Meta HTML.

They stay independent so social limitations cannot affect official website ingestion. Manual `Scan sources` can still call both collectors and receive a normal summary.

## Review policy

- Preserve organizer/source attribution and original URLs already stored in Radar.
- Do not infer event facts from inaccessible social pages.
- No private user data should be collected or stored.
- Re-enable automatic social ingestion only after a supported API path is designed and verified.
