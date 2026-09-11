import assert from "node:assert/strict";
import fs from "node:fs";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function includesAll(text, expected, label) {
  for (const value of expected) assert.ok(text.includes(value), `${label} missing: ${value}`);
}

// Legacy organizer backend remains intact for data compatibility while its public product surface is retired.
const migration = read("supabase/migrations/20260909103000_supply_platform_claim_organizer.sql");
includesAll(migration, [
  "application_kind",
  "claimed_organizer_id",
  "application_kind in ('new', 'claim')",
  "insert into public.organizer_invites",
], "Legacy organizer claim migration");

const organizerEdge = read("supabase/functions/organizer-submit-application/index.ts");
includesAll(organizerEdge, [
  'applicationKind?: unknown',
  'claimedOrganizerId?: unknown',
  'countryCode !== "GR"',
], "Legacy organizer submit Edge Function");

for (const path of [
  "src/app/organizers/page.tsx",
  "src/app/organizers/apply/page.tsx",
  "src/app/organizers/[slug]/page.tsx",
  "src/app/organizers/[slug]/claim/page.tsx",
  "src/app/el/organizers/page.tsx",
  "src/app/el/organizers/apply/page.tsx",
  "src/app/el/organizers/[slug]/page.tsx",
  "src/app/el/organizers/[slug]/claim/page.tsx",
]) {
  assert.equal(fs.existsSync(path), false, `Retired organizer public route must not exist: ${path}`);
}

const sitemap = read("src/app/sitemap.ts");
assert.ok(sitemap.includes('page("/business", .9, "weekly")'), "Business must replace organizer discovery in sitemap");
assert.equal(sitemap.includes("loadOrganizerSlugs"), false, "Organizer profiles must not enter sitemap");
assert.equal(sitemap.includes('page("/organizers"'), false, "Organizer directory must not enter sitemap");

const eventEdge = read("supabase/functions/radar-submit-event/index.ts");
includesAll(eventEdge, [
  'countryCode !== "GR"',
  'country_code: "GR"',
  'timezone: "Europe/Athens"',
  'submitted_via: "https://noxastreetapp.com/meets/submit"',
  '"moto_meet"',
  '"karting"',
  '"dexterity"',
], "Public event submit Edge Function");

const eventForm = read("src/components/radar/RadarSubmitForm.tsx");
includesAll(eventForm, [
  'title: "Add your event."',
  'countryCode: "GR"',
  '["moto_meet", "Moto meet"]',
  '["karting", "Karting"]',
  '["dexterity", "Dexterity"]',
  'approved Crews and Business Partners',
  '/communities/apply',
  '/business#partner-cta',
], "Add Event form");
assert.equal(eventForm.includes("COUNTRY_CODES"), false, "Add Event must not expose out-of-Greece country choices");
assert.equal(eventForm.includes("/organizers"), false, "Add Event must not expose retired organizer onboarding");

console.log("Supply Platform P1 compatibility fixtures passed.");
