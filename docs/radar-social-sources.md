# NOXA Radar social sources

Radar supports `instagram` and `facebook` as source platforms in the separate NOXA Radar database.

## Public-only rule

The social collector only attempts to read content that is publicly reachable without authentication. It must not bypass login walls, CAPTCHA, private groups, private profiles, rate limits, or other access controls.

Supported best-effort inputs:

- a public Instagram post / Reel URL;
- a public Instagram organizer profile when its public HTML exposes post links;
- a public Facebook Event URL;
- a public Facebook Page/post URL when its public HTML exposes event/post links.

Every discovered item keeps the original social URL and is written to `radar_candidates` for admin review. It is never published automatically.

## Expected Meta limitations

Meta can return login redirects, HTTP 429, or other restrictions for server-side public HTML requests. Those cases are treated as a source-level failure and must not break website/RSS collectors.

The stable long-term path is an official Meta API connection for organizer accounts/content that the API is allowed to expose. The public HTML collector remains a best-effort fallback, not a dependency for the rest of Radar.

## Scheduling

- `radar-collector`: existing structured website collector.
- `radar-social-collector`: isolated Instagram/Facebook collector.

They run independently so a Meta restriction cannot break official website ingestion. Manual `Scan sources` runs both collectors and combines their result summary.

## Review policy

- Preserve organizer/source attribution and original URL.
- Do not infer a missing event year/date from a social post.
- Candidates without a confirmed event date stay in Review and cannot be approved until the date is confirmed.
- No private user data should be collected or stored.
