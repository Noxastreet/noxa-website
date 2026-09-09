import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const expect = (ok, message) => { if (!ok) throw new Error(message); };

const websiteHeader = read("src/components/navigation/WebsiteHeader.tsx");
const communities = read("src/components/communities/CommunityDirectory.tsx");
const communityApply = read("src/components/communities/CommunityApplicationForm.tsx");
const meetSubmit = read("src/components/radar/RadarSubmitForm.tsx");
const proxy = read("src/proxy.ts");
const visibility = read("src/app/public-feature-visibility.css");
const sitemap = read("src/app/sitemap.ts");
const robots = read("src/app/robots.ts");
const eventDetail = read("src/components/meets/EventDetailPage.tsx");

// Supply Platform P1 exposes the organizer directory and profiles as public product surfaces.
expect(websiteHeader.includes('"/organizers"'), "Public header must expose Organizers");
expect(websiteHeader.includes('"/meets", "/map", "/communities", "/organizers"'), "Organizers must participate in active navigation state");
expect(!proxy.includes("isPublicOrganizerPath"), "Proxy must not redirect organizer routes back to Meets");
expect(!visibility.includes('display: none !important'), "Public visibility layer must not hide organizer product surfaces");
expect(!visibility.includes('a[href="/organizers"]'), "Public visibility layer must not hide organizer directory links");
expect(!visibility.includes('RadarSubmitForm-module'), "Add Event organizer guidance must remain visible");
expect(sitemap.includes('page("/organizers"') && sitemap.includes('page("/organizers/apply"'), "Sitemap must publish organizer discovery and onboarding routes");
expect(sitemap.includes("loadOrganizerSlugs") && sitemap.includes("/organizers/${slug}"), "Sitemap must publish verified organizer profiles");
expect(!sitemap.includes('page("/organizer"'), "Sitemap must not publish private organizer dashboard routes");
expect(robots.includes('"/organizer"') && !robots.includes('"/organizers"'), "robots.txt must hide dashboard but allow public organizer routes");
expect(eventDetail.includes("Official event information") && !eventDetail.includes("OrganizerProfile"), "Event detail must keep factual source information independent from organizer profile rendering");
expect(!communities.includes("organizer identities"), "Community discovery copy must not conflate Communities with Organizers");

// Organizer product implementation is now an active public supply surface.
const organizerDirectory = read("src/components/organizers/OrganizerDirectory.tsx");
const organizerApply = read("src/components/organizers/OrganizerApplicationForm.tsx");
const organizerProfile = read("src/components/organizers/OrganizerProfile.tsx");
const dashboard = read("src/components/organizers/OrganizerDashboardFlow.tsx");
expect(organizerDirectory.includes("New Organizer") && organizerDirectory.includes("I already have access"), "Organizer directory must expose onboarding and existing access paths");
expect(organizerApply.includes("organizer-submit-application"), "Organizer application backend integration must remain active");
expect(organizerProfile.includes("/claim"), "Organizer profile must expose reviewed claim entry point");
expect(dashboard.length > 0, "Organizer dashboard implementation must remain available behind auth");

// Community and event submissions remain separate, functional supply channels.
expect(communityApply.includes("community-submit-application"), "Community application must keep its dedicated endpoint");
expect(meetSubmit.includes("radar-submit-event"), "Add Event must keep its dedicated Radar endpoint");
expect(meetSubmit.includes('name="organizerName"'), "Add Event must still capture the factual organizer name");
expect(meetSubmit.includes("Apply or claim Organizer access"), "Add Event must expose organizer supply escalation");

console.log("platform flow consistency: PASS");
