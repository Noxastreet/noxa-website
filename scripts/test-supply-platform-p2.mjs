import fs from "node:fs";
import assert from "node:assert/strict";

const retiredRoutes = [
  "src/app/organizers/page.tsx",
  "src/app/organizers/apply/page.tsx",
  "src/app/organizers/[slug]/page.tsx",
  "src/app/organizers/[slug]/claim/page.tsx",
  "src/app/organizer/page.tsx",
  "src/app/organizer/insights/page.tsx",
  "src/app/el/organizers/page.tsx",
  "src/app/el/organizers/apply/page.tsx",
  "src/app/el/organizers/[slug]/page.tsx",
  "src/app/el/organizers/[slug]/claim/page.tsx",
  "src/app/el/organizer/page.tsx",
  "src/app/el/organizer/insights/page.tsx",
  "src/app/radar/admin/organizers/page.tsx",
  "src/app/radar/admin/organizers/applications/page.tsx",
];

for (const path of retiredRoutes) {
  assert.equal(fs.existsSync(path), false, `retired Organizer route still exists: ${path}`);
}

const businessRoute = fs.readFileSync("src/app/business/page.tsx", "utf8");
const businessPage = fs.readFileSync("src/components/business/BusinessPartnersPage.tsx", "utf8");
const header = fs.readFileSync("src/components/navigation/WebsiteHeader.tsx", "utf8");
const homepage = fs.readFileSync("src/components/culture/CultureLandingV2.tsx", "utf8");

assert.match(businessRoute, /redirect\("\/meets"\)/);
assert.match(businessPage, /Featured Partners/);
assert.match(businessPage, /Business Categories/);
assert.equal(header.includes('["Business"'), false);
assert.equal(header.includes('["Organizers"'), false);
assert.equal(homepage.includes("BUSINESS & PARTNERS"), false);
assert.equal(homepage.includes("Explore Organizers"), false);
assert.match(homepage, /RadarHomeSpotlight/);
assert.match(homepage, /HomepageMapPreview/);

console.log("Retired Organizer route surface fixtures passed.");
