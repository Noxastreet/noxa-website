import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const expect = (ok, message) => { if (!ok) throw new Error(message); };

const websiteHeader = read("src/components/navigation/WebsiteHeader.tsx");
const communities = read("src/components/communities/CommunityDirectory.tsx");
const communityApply = read("src/components/communities/CommunityApplicationForm.tsx");
const meetSubmit = read("src/components/radar/RadarSubmitForm.tsx");
const eventSubmit = read("supabase/functions/radar-submit-event/index.ts");
const proxy = read("src/proxy.ts");
const sitemap = read("src/app/sitemap.ts");
const robots = read("src/app/robots.ts");
const businessPage = read("src/components/business/BusinessPartnersPage.tsx");
const businessCss = read("src/components/business/BusinessPartnersPage.module.css");

// Public product navigation is now Events + Map + Community/Crews + Business/Partners.
expect(websiteHeader.includes('"/business"'), "Public header must expose Business");
expect(!websiteHeader.includes('"/organizers"'), "Public header must not expose Organizers");
expect(websiteHeader.includes('"/meets", "/map", "/communities", "/business"'), "Business must participate in active navigation state");

// Business & Partners must preserve the approved reference structure without fake metrics.
for (const expected of [
  "Business &amp; Partners",
  "Grow your presence",
  "Join as a Partner",
  "Featured Partners",
  "Business Categories",
  "Let’s Drive",
  "Raceworks Performance",
  "ClearRide Detailing",
  "Fuel Café",
]) {
  expect(businessPage.includes(expected), `Business page missing approved reference content: ${expected}`);
}
for (const forbidden of ["900K", "30K", "150 events", "testimonials", "rating"]) {
  expect(!businessPage.toLowerCase().includes(forbidden.toLowerCase()), `Business page must not reintroduce fake metric/content: ${forbidden}`);
}
expect(businessCss.includes("scroll-snap-type: x mandatory"), "Mobile Featured Partners must remain horizontally swipeable");
expect(businessCss.includes("grid-template-columns: repeat(3, minmax(0, 1fr))"), "Mobile Business Categories must preserve 3-column grid");
expect(businessCss.includes("@media (prefers-reduced-motion: reduce)"), "Business page must respect reduced motion");

// Organizer product pages are retired and old URLs are redirected to Community.
for (const path of [
  "src/app/organizers/page.tsx",
  "src/app/organizers/apply/page.tsx",
  "src/app/organizer/page.tsx",
  "src/app/el/organizers/page.tsx",
  "src/app/el/organizers/apply/page.tsx",
  "src/app/el/organizer/page.tsx",
]) {
  expect(!fs.existsSync(path), `Retired Organizer route must not exist: ${path}`);
}
expect(proxy.includes('localizedPath === "/organizers"'), "Legacy Organizer URLs must redirect safely");
expect(proxy.includes('`${base}/communities`'), "Legacy Organizer URLs must redirect to Community");
expect(!sitemap.includes('page("/organizers"'), "Sitemap must not publish Organizer directory");
expect(!sitemap.includes("loadOrganizerSlugs"), "Sitemap must not enumerate Organizer profiles");
expect(!robots.includes('"/organizer"'), "robots.txt must not carry obsolete Organizer route rules");

// Crews and Business/Partners are the only public event-publisher identities.
expect(communityApply.includes("community-submit-application"), "Community application must keep its dedicated endpoint");
expect(meetSubmit.includes('["crew", "Crew / Community"]'), "Event form must support Crew publishers");
expect(meetSubmit.includes('["business", "Business / Partner"]'), "Event form must support Business/Partner publishers");
expect(meetSubmit.includes('name="publisherType"'), "Event form must capture publisher type");
expect(!meetSubmit.includes("Apply or claim Organizer access"), "Event form must not expose Organizer onboarding");
expect(eventSubmit.includes('new Set(["crew", "business"])'), "Submission backend must enforce Crew/Business publisher types");
expect(eventSubmit.includes("publisher_type: publisherType"), "Submission audit payload must record publisher type");
expect(eventSubmit.includes('organizer_name: organizerName'), "Factual organizer_name storage remains compatible with existing event schema");
expect(communities.length > 0, "Community directory must remain available");

console.log("platform flow consistency: PASS");
