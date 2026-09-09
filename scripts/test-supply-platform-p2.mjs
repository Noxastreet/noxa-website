import fs from "node:fs";
import assert from "node:assert/strict";

const dashboard = fs.readFileSync("src/components/organizers/OrganizerDashboardP2.tsx", "utf8");
const routeEn = fs.readFileSync("src/app/organizer/page.tsx", "utf8");
const routeEl = fs.readFileSync("src/app/el/organizer/page.tsx", "utf8");
const migration = fs.readFileSync("supabase/migrations/20260909124000_supply_platform_p2_organizer_event_quality.sql", "utf8");

assert.match(routeEn, /OrganizerDashboardP2/);
assert.match(routeEl, /OrganizerDashboardP2/);

for (const eventType of ["car_meet", "moto_meet", "karting", "dexterity"]) {
  assert.match(dashboard, new RegExp(`\\[\\"${eventType}\\"`), `missing ${eventType} organizer event type`);
}

assert.match(dashboard, /latitude,longitude,location_precision/);
assert.match(dashboard, /location_precision: hasExactPoint \? "exact" : "unknown"/);
assert.match(dashboard, /Publish requires exact latitude \+ longitude/);
assert.match(dashboard, /Published events need a description of at least 32 characters/);
assert.match(dashboard, /Add the official source for this exact event/);
assert.match(dashboard, /publication_source: "organizer"/);
assert.match(dashboard, /country_code: "GR"/);
assert.match(dashboard, /source_url: normalizeUrl\(draft\.sourceUrl\) \|\| profileUrl/);
assert.match(dashboard, /status === "published"/);
assert.match(dashboard, /"unpublished"/);
assert.match(dashboard, /"cancelled"/);
assert.match(dashboard, /Map point missing/);

assert.match(migration, /target\.publication_source in \('reviewed', 'organizer'\)/);
assert.match(migration, /missing_organizer_profile/);
assert.match(migration, /missing_summary/);
assert.match(migration, /short_summary/);
assert.match(migration, /map_location_not_exact/);
assert.match(migration, /map_coordinates_missing/);
assert.match(migration, /outside_greece/);

console.log("Supply Platform P2 organizer dashboard fixtures passed.");
