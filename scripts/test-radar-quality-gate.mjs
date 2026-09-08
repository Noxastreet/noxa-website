import assert from "node:assert/strict";

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
  latitude: 40.6271,
  longitude: 22.9557,
  location_precision: "exact",
};

assert.deepEqual(radarCandidateQualityIssues(valid), []);
assert.ok(radarCandidateQualityIssues({ ...valid, summary: null }).includes("missing_summary"));
assert.ok(radarCandidateQualityIssues({ ...valid, summary: "This is an event reminder" }).includes("placeholder_summary"));
assert.ok(radarCandidateQualityIssues({ ...valid, organizer_name: "OMAE" }).includes("source_as_organizer"));
assert.ok(radarCandidateQualityIssues({ ...valid, city: null, location_text: null }).includes("missing_location"));
assert.ok(radarCandidateQualityIssues({ ...valid, ends_at: "2026-09-20T17:00:00+03:00" }).includes("invalid_end"));
assert.ok(radarCandidateQualityIssues({ ...valid, original_url: "not-a-url" }).includes("invalid_source_url"));
assert.ok(radarCandidateQualityIssues({ ...valid, timezone: null }).includes("missing_timezone"));
assert.ok(
  radarCandidateQualityIssues({ ...valid, location_precision: "approximate" }).includes("map_location_not_exact"),
  "approximate event locations must not be publishable",
);
assert.ok(
  radarCandidateQualityIssues({ ...valid, latitude: null, longitude: null }).includes("map_coordinates_missing"),
  "events without coordinates must not be publishable",
);

console.log("Radar quality gate fixtures passed.");
