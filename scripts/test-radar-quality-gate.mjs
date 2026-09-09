import assert from "node:assert/strict";
import fs from "node:fs";

import { radarCandidateQualityIssues } from "../src/lib/radarQuality.ts";

const valid = {
  title: "Thessaloniki Night Meet 2026",
  country_code: "GR",
  starts_at: "2026-09-20T18:00:00+03:00",
  ends_at: "2026-09-20T22:00:00+03:00",
  timezone: "Europe/Athens",
  location_text: "TIF, Thessaloniki",
  city: "Thessaloniki",
  organizer_name: "Example Motor Club",
  summary: "Public automotive gathering in Thessaloniki with an announced evening program.",
  original_url: "https://example.com/event",
};

assert.deepEqual(radarCandidateQualityIssues(valid), []);
assert.ok(radarCandidateQualityIssues({ ...valid, summary: null }).includes("missing_summary"));
assert.ok(radarCandidateQualityIssues({ ...valid, summary: "This is an event reminder" }).includes("placeholder_summary"));
assert.ok(radarCandidateQualityIssues({ ...valid, organizer_name: "OMAE" }).includes("source_as_organizer"));
assert.ok(radarCandidateQualityIssues({ ...valid, city: null, location_text: null }).includes("missing_location"));
assert.ok(radarCandidateQualityIssues({ ...valid, ends_at: "2026-09-20T17:00:00+03:00" }).includes("invalid_end"));
assert.ok(radarCandidateQualityIssues({ ...valid, original_url: "not-a-url" }).includes("invalid_source_url"));
assert.ok(radarCandidateQualityIssues({ ...valid, timezone: null }).includes("missing_timezone"));

assert.ok(radarCandidateQualityIssues({ ...valid, country_code: "DE" }).includes("outside_greece"));
assert.ok(radarCandidateQualityIssues({ ...valid, country_code: "CY" }).includes("outside_greece"));

const greekMoto = {
  ...valid,
  title: "12ο Aegean Ride — Lesvos 2026",
  organizer_name: "Vespa Club Lesvos",
  summary: "Motorcycle gathering in Lesvos with an announced ride program and community meeting.",
  original_url: "https://example.com/moto-event",
};
assert.deepEqual(radarCandidateQualityIssues(greekMoto), []);

const scopeMigration = fs.readFileSync(
  "supabase/migrations/20260909090000_radar_greece_scope_gate.sql",
  "utf8",
);
for (const expected of [
  "outside_greece",
  "country_code is distinct from 'GR'",
  "set status = 'unpublished'",
  "Scope Gate: outside_greece",
]) {
  assert.ok(scopeMigration.includes(expected), `Scope Gate migration missing: ${expected}`);
}
assert.equal(scopeMigration.includes("moto_only_event"), false);
assert.equal(scopeMigration.includes("radar_is_moto_only_event"), false);

console.log("Radar quality gate fixtures passed.");
