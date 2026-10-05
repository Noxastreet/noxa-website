import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const expect = (ok, message) => { if (!ok) throw new Error(message); };

const websiteHeader = read("src/components/navigation/WebsiteHeader.tsx");
const communities = read("src/components/communities/CommunityDirectory.tsx");
const communityApply = read("src/components/communities/CommunityApplicationForm.tsx");
const meetSubmit = read("src/components/radar/RadarSubmitForm.tsx");
const eventDetail = read("src/components/meets/EventDetailPage.tsx");
const eventSubmit = read("supabase/functions/radar-submit-event/index.ts");
const proxy = read("src/proxy.ts");
const sitemap = read("src/app/sitemap.ts");
const robots = read("src/app/robots.ts");
const businessPage = read("src/components/business/BusinessPartnersPage.tsx");
const businessCss = read("src/components/business/BusinessPartnersPage.module.css");
const communityRoute = read("src/app/communities/page.tsx");
const businessRoute = read("src/app/business/page.tsx");
const featureRoute = read("src/app/[feature]/page.tsx");

// Public website focus: Events + App + Organizers. Full social/spatial functionality stays in the mobile app.
expect(websiteHeader.includes('["/meets", "/app", "/organizers"]'), "Public header active roots must be Events + App + Organizers");
expect(websiteHeader.includes('["Events", `${base}/meets`]'), "Public header must expose Events");
expect(websiteHeader.includes('["App", `${base}/app`]'), "Public header must expose App");
expect(websiteHeader.includes('`${base}/organizers`'), "Public header must expose Organizers");
expect(!websiteHeader.includes('["Map", `${base}/map`]'), "Public header must not expose retired web Map");
expect(!websiteHeader.includes('"/business"'), "Public header must hide Business");
expect(!websiteHeader.includes('"/communities"'), "Public header must hide Community");
expect(websiteHeader.includes("showInstagram={false}"), "Focused public header must hide social navigation");
expect(communityRoute.includes('redirect("/meets")'), "Community directory route must temporarily redirect to Meets");
expect(businessRoute.includes('redirect("/organizers")'), "Business route must redirect to Organizers");
expect(featureRoute.includes('feature === "routes"') && featureRoute.includes('redirect("/app")'), "Routes must resolve into App");
expect(featureRoute.includes('feature === "crews"') && featureRoute.includes('redirect("/app")'), "Crews must resolve into App");

// Business & Partners implementation is preserved intact for later reactivation.
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
  expect(businessPage.includes(expected), `Preserved Business implementation missing content: ${expected}`);
}
for (const forbidden of ["900K", "30K", "150 events", "testimonials", "rating"]) {
  expect(!businessPage.toLowerCase().includes(forbidden.toLowerCase()), `Business source must not reintroduce fake metric/content: ${forbidden}`);
}
expect(businessCss.includes("scroll-snap-type: x mandatory"), "Preserved mobile Featured Partners implementation must remain horizontally swipeable");
expect(businessCss.includes("grid-template-columns: repeat(3, minmax(0, 1fr))"), "Preserved mobile Business Categories implementation must retain its 3-column grid");
expect(businessCss.includes("@media (prefers-reduced-motion: reduce)"), "Preserved Business implementation must respect reduced motion");

// Organizer public landing pages are active, while old organizer profile/onboarding paths remain safely retired.
for (const path of [
  "src/app/organizers/page.tsx",
  "src/app/el/organizers/page.tsx",
]) {
  expect(fs.existsSync(path), `Organizer landing route must exist: ${path}`);
}
for (const path of [
  "src/app/organizers/apply/page.tsx",
  "src/app/organizer/page.tsx",
  "src/app/el/organizers/apply/page.tsx",
  "src/app/el/organizer/page.tsx",
]) {
  expect(!fs.existsSync(path), `Retired organizer profile/onboarding route must not exist: ${path}`);
}
expect(proxy.includes('localizedPath === "/organizers/apply"'), "Legacy Organizer apply URL must redirect safely");
expect(!proxy.includes('localizedPath === "/organizers" ||'), "Exact Organizers landing route must not be intercepted by proxy");
expect(sitemap.includes('page("/organizers"'), "Sitemap must publish Organizer landing page");
expect(sitemap.includes('page("/el/organizers"'), "Sitemap must publish Greek Organizer landing page");
expect(!sitemap.includes("loadOrganizerSlugs"), "Sitemap must not enumerate retired Organizer profiles");
expect(!robots.includes('"/organizer"'), "robots.txt must not carry obsolete Organizer route rules");
expect(!eventDetail.includes("loadOrganizerById"), "Event detail must not load retired Organizer profiles");
expect(!eventDetail.includes("VERIFIED ORGANIZER"), "Event detail must not render retired Organizer UI");
expect(!eventDetail.includes("/organizers/"), "Event detail must not link to retired Organizer profiles");
expect(eventDetail.includes("Official event information"), "Event detail must retain factual official source information");

// Crew and Business publisher infrastructure remains preserved even while their public surfaces are hidden.
expect(communityApply.includes("community-submit-application"), "Community application implementation must keep its dedicated endpoint");
expect(meetSubmit.includes('["crew", "Crew / Community"]'), "Event form must support Crew publishers");
expect(meetSubmit.includes('["business", "Business / Partner"]'), "Event form must support Business/Partner publishers");
expect(meetSubmit.includes('name="publisherType"'), "Event form must capture publisher type");
expect(!meetSubmit.includes("Apply or claim Organizer access"), "Event form must not expose Organizer onboarding");
expect(eventSubmit.includes('new Set(["crew", "business"])'), "Submission backend must enforce Crew/Business publisher types");
expect(eventSubmit.includes("publisher_type: publisherType"), "Submission audit payload must record publisher type");
expect(eventSubmit.includes('organizer_name: organizerName'), "Factual organizer_name storage remains compatible with existing event schema");
expect(communities.length > 0, "Community directory implementation must remain preserved in source");

console.log("platform flow consistency: PASS");
