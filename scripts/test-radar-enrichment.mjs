import assert from "node:assert/strict";
import {
  decideEnrichmentOutcome,
  sameTrustedSource,
} from "../src/lib/radarEnrichment.ts";

const goodCandidate = {
  title: "Serres Open Track Day",
  country_code: "GR",
  starts_at: "2026-10-19T06:00:00.000Z",
  ends_at: null,
  timezone: "Europe/Athens",
  location_text: "Serres Racing Circuit",
  city: "Serres",
  organizer_name: "Serres Racing Circuit",
  summary: "Official open track day at Serres Racing Circuit with public participation information.",
  original_url: "https://serrescircuit.gr/events/open-track-day",
};

assert.equal(sameTrustedSource("https://serrescircuit.gr/events/1", "https://serrescircuit.gr"), true);
assert.equal(sameTrustedSource("https://events.serrescircuit.gr/1", "https://serrescircuit.gr"), true);
assert.equal(sameTrustedSource("https://evilserrescircuit.gr/1", "https://serrescircuit.gr"), false);
assert.equal(sameTrustedSource("http://127.0.0.1/test", "https://serrescircuit.gr"), false);

assert.equal(decideEnrichmentOutcome({
  isEvent: true,
  confidence: 0.96,
  sourceVerified: true,
  candidate: goodCandidate,
}).outcome, "verified");

assert.equal(decideEnrichmentOutcome({
  isEvent: true,
  confidence: 0.96,
  sourceVerified: false,
  candidate: goodCandidate,
}).outcome, "review_required");

assert.equal(decideEnrichmentOutcome({
  isEvent: false,
  confidence: 0.91,
  sourceVerified: true,
  candidate: goodCandidate,
}).outcome, "rejected");

assert.equal(decideEnrichmentOutcome({
  isEvent: true,
  confidence: 0.99,
  sourceVerified: true,
  candidate: { ...goodCandidate, summary: "" },
}).outcome, "review_required");

console.log("Radar enrichment fixtures passed.");
