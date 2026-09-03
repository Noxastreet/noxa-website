# NOXA Ecosystem Roadmap

NOXA should evolve from a pre-launch landing page into public infrastructure for automotive and motorcycle culture.

The product serves three groups at the same time:

1. **Enthusiasts** — discover meets, crews, routes and communities.
2. **Communities / organisers** — keep their identity, publish activity and grow their reach.
3. **Partners / companies** — reach a relevant automotive audience through useful participation rather than generic advertising.

## Product principle

NOXA does not replace existing communities. It connects them and gives them better discovery and organisation tools.

No fake communities, fake attendance numbers or fake activity should be shown to make the product look larger than it is.

## Phase 1 — Ecosystem foundation

- Keep NOXA Meets as the live event discovery product.
- Explain the three audiences clearly on the homepage.
- Establish the promise that communities keep their own identity.
- Keep current waitlist and partner interest paths working.
- Preserve existing Supabase and `/radar` internals until a controlled migration is justified.

## Phase 2 — Public communities

Add a real public community layer:

- `/communities` directory.
- `/communities/[slug]` public profile.
- Name, logo, city/region, description and public links.
- Verified status where appropriate.
- Upcoming and past NOXA Meets connected to the community.
- Community application / claim workflow.
- SEO-friendly public pages.

Do not add member counts until the data is real and consistently defined.

## Phase 3 — Organiser tools

- Community owner / organiser authentication.
- Event submission and management.
- Draft → review → published workflow.
- Community roles and permissions.
- Event history and organiser reputation signals.
- Basic analytics: views, outbound clicks and event interest.

All public writes must be protected by authentication, authorization and server-side validation.

## Phase 4 — Partner ecosystem

Add a controlled partner layer for garages, tuners, detailers, shops, tracks, event partners and larger brands:

- `/partners` directory.
- `/partners/[slug]` profiles.
- Verified partner status.
- Locations and relevant services.
- Offers or benefits with clear validity dates.
- Event partnerships / sponsorship associations.
- Brand collaboration pages when there is a real collaboration.

Large-company value should come from relevant audience access, event participation and measurable engagement — not intrusive display advertising.

## Phase 5 — Shared app + web ecosystem

Once app authentication and production data contracts are stable:

- Shared user identity between web and app where appropriate.
- "I'm going" / event interest synced with the app.
- Crew and community membership.
- Saved meets and routes.
- Deep links from web pages into the NOXA app.

## Future core entities

These are conceptual entities, not an instruction to create migrations immediately:

- `communities`
- `community_memberships`
- `community_claims`
- `community_event_links`
- `partners`
- `partner_locations`
- `partner_offers`
- `event_partnerships`

Before creating these tables, inspect the current production Supabase schema and reuse existing entities where possible.

## MVP success test

The ecosystem is useful when each audience has a clear reason to return:

- **Enthusiast:** "I can quickly see what is happening around me."
- **Community:** "New people can discover my community and events."
- **Partner:** "I can reach active automotive people in a relevant and measurable way."
