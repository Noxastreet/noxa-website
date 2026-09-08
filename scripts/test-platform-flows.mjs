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

// Public organizer product is intentionally hidden until it is ready.
expect(!websiteHeader.includes("/organizers"), "Public header must not expose Organizers");
expect(!communities.includes("/organizers"), "Community navigation must not expose Organizers");
expect(!meetSubmit.includes('href={`${base}/organizer`}'), "Event suggestion must not expose Organizer Dashboard");
expect(!meetSubmit.includes("Verified organizers"), "Event suggestion must not advertise verified organizer publishing");
expect(proxy.includes("isPublicOrganizerPath") && proxy.includes('"/meets"'), "Proxy must redirect public organizer routes to Meets");
expect(visibility.includes('a[href="/organizers"]') && visibility.includes('a[href="/organizer"]'), "Visibility layer must hide remaining public organizer entry points");
expect(!sitemap.includes('page("/organizers"') && !sitemap.includes('page("/organizer"'), "Sitemap must not publish organizer product routes");
expect(robots.includes('"/organizer"') && robots.includes('"/organizers"'), "robots.txt must disallow organizer product routes");
expect(eventDetail.includes("Official event information") && !eventDetail.includes("OrganizerProfile"), "Event detail must show source information instead of organizer product UI");
expect(!communities.includes("organizer identities"), "Community discovery copy must not advertise organizer identities");

// Underlying organizer implementation remains preserved for later refinement.
const organizerDirectory = read("src/components/organizers/OrganizerDirectory.tsx");
const organizerApply = read("src/components/organizers/OrganizerApplicationForm.tsx");
const dashboard = read("src/components/organizers/OrganizerDashboardFlow.tsx");
expect(organizerDirectory.length > 0, "Organizer directory implementation must remain preserved");
expect(organizerApply.includes("organizer-submit-application"), "Organizer application backend integration must remain preserved");
expect(dashboard.length > 0, "Organizer dashboard implementation must remain preserved");

// Community/event submissions remain functional even while organizer product UI is hidden.
expect(communityApply.includes("community-submit-application"), "Community application must keep its dedicated endpoint");
expect(meetSubmit.includes("radar-submit-event"), "Event suggestion must keep its dedicated endpoint");
expect(meetSubmit.includes('name="organizerName"'), "Event suggestions must still capture the factual organizer name");

console.log("platform flow consistency: PASS");
