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
  includesAll(page, ["loadOrganizerBySlug", "OrganizerApplicationForm", "claimTarget", 'organizer.organizer_type === "community"'], path);
}

const review = read("src/components/organizers/OrganizerApplicationReview.tsx");
includesAll(review, [
  'application_kind: "new" | "claim"',
  'claimed_organizer_id: string | null',
  'Approve claim & create access',
  'p_slug: slug',
], "Organizer admin review");

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
