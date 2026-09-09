import assert from "node:assert/strict";

import { isMotoOnlyRadarEvent, radarCandidateQualityIssues } from "../src/lib/radarQuality.ts";

const valid = {
  title: "Thessaloniki Night Meet 2026",
  event_type: "car_meet",
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
assert.ok(radarCandidateQualityIssues({ ...valid, event_type: "moto_meet" }).includes("moto_only_event"));
assert.ok(radarCandidateQualityIssues({
  ...valid,
  event_type: "track_day",
  title: "Extreme Track Days — Megara",
  summary: "Motorcycle track-day weekend at Athens Megara Circuit with rider groups and instructors.",
}).includes("moto_only_event"));
assert.ok(radarCandidateQualityIssues({
  ...valid,
  event_type: "rally",
  title: "HELLAS RALLY 24h",
  original_url: "https://www.amotoe.org/hellas-rally-24h",
}).includes("moto_only_event"));
assert.ok(radarCandidateQualityIssues({
  ...valid,
  title: "12ο Aegean Ride",
  organizer_name: "Vespa Club Lesvos",
}).includes("moto_only_event"));

assert.equal(isMotoOnlyRadarEvent({
  event_type: "show",
  title: "Athens Motor Show 2026",
  summary: "Automotive exhibition for passenger and performance cars.",
  organizer_name: "Example Motor Club",
  original_url: "https://automotopatras.gr/athens-motor-show",
}), false);
assert.equal(isMotoOnlyRadarEvent({
  event_type: "car_meet",
  title: "Mazda MX-5 Meet",
  summary: "Roadster owners meet for a static automotive gathering.",
  organizer_name: "MX-5 Club",
  original_url: "https://example.com/mx5",
}), false);

console.log("Radar quality gate fixtures passed.");
