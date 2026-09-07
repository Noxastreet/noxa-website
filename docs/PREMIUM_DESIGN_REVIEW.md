# NOXA premium design — review candidate

Scope: website only. Based on canonical main `8d8ae5651f1f8ccf9cbf210082cafa6b527b6710`.
Owner approved starting with design before the remaining reliability work.

## Intent

- Home: preserve the accepted automotive video and logo; remove ornamental noise and an unused poster preload, improve heading rhythm, contrast and section continuity.
- Meets: shorten the introduction, improve card title wrapping and filter readability; retain existing query/state/data logic.
- Event: establish a readable title scale and separate primary actions from calendar/sharing utilities. Label the generic background as editorial imagery.
- Reuse SiteHeader through one shared website configuration. Add document language and skip links to Meets/Event; expose Saved pressed state.

No new dependencies or media assets, no data/schema/API changes, no Map View. Security PR #83 remains independent pending review; this design is not production acceptance.

## Verification at initial review

- TypeScript: PASS.
- ESLint: zero errors; eight existing warnings in unchanged admin/organizer components.
- Production build on Node 22.23.2: PASS.
- Existing Meets and platform fixtures: PASS.
- Desktop preview on initial commit f5d0274: home → Meets → filtered results → Event, EN/EL event switching, Saved pressed state and unsave verified. No horizontal overflow observed on inspected desktop pages.
- CI for f5d0274: typecheck, lint, build, route smoke and fixtures PASS; security PASS. Lighthouse fails LCP (median 2807ms); performance 95, accessibility 96, TBT115ms, CLS0.
- Follow-up: keep section reveal fully opaque for contrast and include EN/EL in language accessible names; matching smoke assertions updated. Final CI/browser results recorded in PR #84.
- Real mobile/iPhone Safari: NOT VERIFIED. The available cloud browser has no viewport/emulation capability; localhost is inaccessible from that browser.
- Performance: NOT VERIFIED for this candidate. Video asset is unchanged and previous Lighthouse debt remains.

## Acceptance before approval

- Desktop + mobile screenshots for EN/EL home, discovery and a long-title event.
- Menu/language navigation, date/search filters, save state and action opening.
- No overflow at 320–430px, readable controls and keyboard focus.
- Check homepage hero playback on physical iPhone Safari.
- Review the visual direction with the owner. Do not merge or deploy production without separate authorization.

Remaining data accuracy, Saved list, reports/RLS and reliability findings remain tracked in the Notion website roadmap. Do not mark those fixed because their UI was styled.

## Owner feedback: separate cards from the page

The owner approved the direction but found the surfaces monotonous and card boundaries hard to distinguish. Reuse existing graphite tokens: raised surfaces for event/organizer/waitlist cards, a quieter surface for filters/empty states, and stronger neutral borders with restrained shadows. Keep separation visible without hover on touch devices. Improve metadata contrast on the raised surfaces and add explicit keyboard focus to homepage event cards. No layout, media, data or interaction logic changes. Exact-head build/CI and preview evidence are recorded in PR #84.
