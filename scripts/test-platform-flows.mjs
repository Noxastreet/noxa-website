import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const expect = (ok, message) => { if (!ok) throw new Error(message); };

const websiteHeader = read("src/components/navigation/WebsiteHeader.tsx");
const communities = read("src/components/communities/CommunityDirectory.tsx");
const communityApply = read("src/components/communities/CommunityApplicationForm.tsx");
const meetSubmit = read("src/components/radar/RadarSubmitForm.tsx");
const sitemap = read("src/app/sitemap.ts");
const eventDetail = read("src/components/meets/EventDetailPage.tsx");
const business = read("src/components/business/BusinessPartnersPage.tsx");

// Public publishing identities are now Crew and Business / Partner.
expect(websiteHeader.includes('"/business"'), "Public header must expose Business");
expect(!websiteHeader.includes('"/organizers"'), "Public header must not expose removed Organizers");
expect(sitemap.includes('page("/business"'), "Sitemap must publish Business & Partners");
expect(!sitemap.includes('page("/organizers"') && !sitemap.includes("loadOrganizerSlugs"), "Sitemap must not publish removed organizer routes");
expect(business.includes("BUSINESS & PARTNERS") && business.includes("Join as a Partner"), "Business page must expose partner onboarding");
expect(business.includes("Featured Partners") && business.includes("Business Categories"), "Business page must include reference sections");

for (const route of [
  "src/app/organizers/page.tsx",
  "src/app/organizers/apply/page.tsx",
  "src/app/organizers/[slug]/page.tsx",
  "src/app/organizers/[slug]/claim/page.tsx",
  "src/app/el/organizers/page.tsx",
  "src/app/el/organizers/apply/page.tsx",
  "src/app/el/organizers/[slug]/page.tsx",
  "src/app/el/organizers/[slug]/claim/page.tsx",
  "src/app/organizer/page.tsx",
  "src/app/el/organizer/page.tsx",
]) {
  expect(!fs.existsSync(route), `Removed organizer route still exists: ${route}`);
}

// Existing event records may keep factual host/source metadata, but no public organizer profile coupling.
expect(eventDetail.includes("Official source") || eventDetail.includes("OFFICIAL SOURCE"), "Event detail must keep factual official source information");
expect(!eventDetail.includes("loadOrganizerById"), "Event detail must not load organizer profiles");
expect(!eventDetail.includes("/organizers/"), "Event detail must not link to organizer profiles");
expect(!communities.includes("organizer identities"), "Community discovery copy must not conflate crews with removed organizers");

// Community and event submissions remain functional; direct publishing identity is Crew or Business Partner.
expect(communityApply.includes("community-submit-application"), "Community application must keep its dedicated endpoint");
expect(meetSubmit.includes("radar-submit-event"), "Add Event must keep its dedicated Radar endpoint");
expect(meetSubmit.includes('name="organizerName"'), "Radar payload must retain factual host name compatibility");
expect(meetSubmit.includes("approved Crews and Business Partners"), "Add Event must explain the new publishing model");
expect(meetSubmit.includes("/communities/apply") && meetSubmit.includes("/business#partner-cta"), "Add Event must route publisher onboarding to Crew and Business");
expect(!meetSubmit.includes("/organizers"), "Add Event must not expose removed organizer onboarding");

console.log("platform flow consistency: PASS");
