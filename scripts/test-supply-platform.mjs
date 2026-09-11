import assert from "node:assert/strict";
import fs from "node:fs";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

const eventEdge = read("supabase/functions/radar-submit-event/index.ts");
const eventForm = read("src/components/radar/RadarSubmitForm.tsx");
const sitemap = read("src/app/sitemap.ts");
const proxy = read("src/proxy.ts");
const business = read("src/components/business/BusinessPartnersPage.tsx");

assert.match(eventEdge, /PUBLISHER_TYPES = new Set\(\["crew", "business"\]\)/);
assert.match(eventEdge, /publisherType\?: unknown/);
assert.match(eventEdge, /Events can be submitted only by a Crew or Business\/Partner/);
assert.match(eventEdge, /publisher_type: publisherType/);
assert.match(eventEdge, /countryCode !== "GR"/);
assert.match(eventEdge, /country_code: "GR"/);
assert.match(eventEdge, /timezone: "Europe\/Athens"/);
assert.match(eventEdge, /submitted_via: "https:\/\/noxastreetapp\.com\/meets\/submit"/);

assert.match(eventForm, /title: "Add your event\."/);
assert.match(eventForm, /\["crew", "Crew \/ Community"\]/);
assert.match(eventForm, /\["business", "Business \/ Partner"\]/);
assert.match(eventForm, /name="publisherType"/);
assert.match(eventForm, /name="publisherName"/);
assert.equal(eventForm.includes("Apply or claim Organizer access"), false);
assert.equal(eventForm.includes("COUNTRY_CODES"), false);

assert.equal(sitemap.includes('page("/organizers"'), false);
assert.equal(sitemap.includes('page("/organizers/apply"'), false);
assert.equal(sitemap.includes("loadOrganizerSlugs"), false);
assert.match(sitemap, /page\("\/business", \.82, "weekly"\)/);

assert.match(proxy, /localizedPath === "\/organizers\/apply"/);
assert.match(proxy, /localizedPath === "\/organizers"/);
assert.match(proxy, /localizedPath === "\/organizer"/);
assert.match(proxy, /communities\/apply/);

assert.match(business, /Business &amp; Partners/);
assert.match(business, /Join as a Partner/);

console.log("Crew and Business supply policy fixtures passed.");
