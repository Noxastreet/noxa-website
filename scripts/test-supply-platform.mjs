import assert from "node:assert/strict";
import fs from "node:fs";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function includesAll(text, expected, label) {
  for (const value of expected) assert.ok(text.includes(value), `${label} missing: ${value}`);
}

const migration = read("supabase/migrations/20260909103000_supply_platform_claim_organizer.sql");
includesAll(migration, [
  "application_kind",
  "claimed_organizer_id",
  "application_kind in ('new', 'claim')",
  "if application_row.application_kind = 'claim' then",
  "insert into public.organizer_invites",
  "target_organizer.id",
  "Claim target is not an active verified organizer",
], "Organizer claim migration");

const claimStart = migration.indexOf("if application_row.application_kind = 'claim' then");
const newProfileStart = migration.indexOf("insert into public.organizer_profiles", claimStart);
const claimReturn = migration.indexOf("'claim', true", claimStart);
assert.ok(claimStart >= 0 && claimReturn > claimStart, "Claim approval branch must exist");
assert.ok(newProfileStart > claimReturn, "Claim approval must finish before the new-profile insert path");

const organizerEdge = read("supabase/functions/organizer-submit-application/index.ts");
includesAll(organizerEdge, [
  'applicationKind?: unknown',
  'claimedOrganizerId?: unknown',
  'status=eq.active&verified=eq.true',
  'application_kind: applicationKind',
  'claimed_organizer_id: applicationKind === "claim" ? claimedOrganizerId : null',
  'countryCode !== "GR"',
  'pendingClaimExists',
], "Organizer submit Edge Function");

const organizerProfile = read("src/components/organizers/OrganizerProfile.tsx");
assert.ok(organizerProfile.includes('/organizers/${organizer.slug}/claim'), "Organizer profile must expose Claim CTA");
assert.ok(organizerProfile.includes('organizer.organizer_type !== "community"'), "Community organizer profiles must not use this claim flow");

for (const path of [
  "src/app/organizers/[slug]/claim/page.tsx",
  "src/app/el/organizers/[slug]/claim/page.tsx",
]) {
  const page = read(path);
  includesAll(page, [
    "loadOrganizerBySlug",
    "OrganizerApplicationForm",
    "claimTarget",
    'organizer.organizer_type === "community"',
    "robots: { index: false, follow: false }",
  ], path);
}

const review = read("src/components/organizers/OrganizerApplicationReview.tsx");
includesAll(review, [
  'application_kind: "new" | "claim"',
  'claimed_organizer_id: string | null',
  'Approve claim & create access',
  'p_slug: slug',
], "Organizer admin review");

const proxy = read("src/proxy.ts");
assert.equal(proxy.includes("isPublicOrganizerPath"), false, "Supply Platform organizer routes must not be redirected away");
assert.equal(proxy.includes('new URL(locale === "el" ? "/el/meets" : "/meets"'), false, "Proxy must not hide organizer platform routes");

const robots = read("src/app/robots.ts");
includesAll(robots, [
  '"/organizer"',
  '"/el/organizer"',
  '"/organizers/*/claim"',
  '"/el/organizers/*/claim"',
], "Organizer robots boundary");
assert.equal(robots.includes('"/organizers",'), false, "Public organizer directory must not be disallowed in robots");

const sitemap = read("src/app/sitemap.ts");
includesAll(sitemap, [
  'page("/organizers", .9, "daily")',
  'page("/el/organizers", .86, "daily")',
  'page("/organizers/apply", .72, "monthly")',
  'loadOrganizerSlugs',
], "Organizer sitemap surfaces");
assert.equal(sitemap.includes("/claim`"), false, "Organizer claim pages must not enter sitemap");

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
  'Apply or claim Organizer access',
], "Add Event form");
assert.equal(eventForm.includes("COUNTRY_CODES"), false, "Add Event must not expose out-of-Greece country choices");

console.log("Supply Platform P1 fixtures passed.");
