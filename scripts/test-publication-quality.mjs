import assert from "node:assert/strict";

import {
  publicationBlockers,
  publicationReady,
  publicationWarnings,
} from "../src/lib/meets/publicationQuality.ts";

const validRally = {
  title: "58ο Ράλλυ Δ.Ε.Θ. 2026",
  eventType: "rally",
  startsAt: "2026-09-12T11:00:00.000Z",
  endsAt: "2026-09-13T15:30:00.000Z",
  timezone: "Europe/Athens",
  locationText: "South Gate, Thessaloniki International Fair (Saturday) · Galatista service park and special stages (Sunday)",
  city: "Thessaloniki",
  countryCode: "GR",
  organizerName: "Αυτοκινητιστικός Όμιλος Θεσσαλονίκης (Α.Ο.Θ.)",
  sourceName: "OMAE",
  sourceUrl: "https://www.omae-epa.gr/example",
  publicationSource: "reviewed",
  summary: "58th Rally D.E.TH. runs on 12–13 September 2026. Saturday includes scrutineering and a ceremonial start; Sunday includes five asphalt special stages, the finish and the awards ceremony.",
  titleEl: "58ο Ράλλυ Δ.Ε.Θ. 2026",
  summaryEl: "Το 58ο Ράλλυ Δ.Ε.Θ. διεξάγεται στις 12–13 Σεπτεμβρίου 2026, με τεχνικό έλεγχο, πανηγυρική εκκίνηση, πέντε ειδικές διαδρομές, τερματισμό και απονομή.",
  locationTextEl: "Νότια Πύλη Δ.Ε.Θ. · Γαλάτιστα και ειδικές διαδρομές",
  locationPrecision: "unknown",
};

assert.equal(publicationReady(validRally), true, "a factual Rally DETH-style event should pass");
assert.deepEqual(publicationBlockers(validRally), []);
assert.ok(publicationWarnings(validRally).some((issue) => issue.code === "no_verified_event_image"));
assert.ok(publicationWarnings(validRally).some((issue) => issue.code === "map_unavailable"));

const omaePlaceholder = {
  ...validRally,
  title: "58ο Ράλλυ ΔΕΘ 2026 | Αναγγελία",
  organizerName: "OMAE",
  sourceName: "OMAE",
  summary: "Official OMAE event announcement. Review the original source before publishing.",
};
const placeholderCodes = new Set(publicationBlockers(omaePlaceholder).map((issue) => issue.code));
assert.ok(placeholderCodes.has("announcement_title"));
assert.ok(placeholderCodes.has("source_is_not_organizer"));
assert.ok(placeholderCodes.has("summary_too_short"));
assert.ok(placeholderCodes.has("service_summary"));

const missingLocation = { ...validRally, locationText: "", city: "" };
assert.ok(publicationBlockers(missingLocation).some((issue) => issue.code === "missing_location"));

const badEnd = { ...validRally, endsAt: "2026-09-11T15:30:00.000Z" };
assert.ok(publicationBlockers(badEnd).some((issue) => issue.code === "end_before_start"));

const verifiedCover = {
  ...validRally,
  coverImageUrl: "https://example.org/event.jpg",
  coverImageSourceUrl: "https://example.org/event-page",
  coverImageAlt: "Rally D.E.TH. event poster",
};
assert.equal(publicationReady(verifiedCover), true);
assert.equal(publicationWarnings(verifiedCover).some((issue) => issue.code === "no_verified_event_image"), false);

const unsafeCover = {
  ...validRally,
  coverImageUrl: "http://example.org/event.jpg",
  coverImageSourceUrl: null,
  coverImageAlt: "",
};
const coverCodes = new Set(publicationBlockers(unsafeCover).map((issue) => issue.code));
assert.ok(coverCodes.has("invalid_cover_url"));
assert.ok(coverCodes.has("missing_cover_source"));
assert.ok(coverCodes.has("missing_cover_alt"));

const exactWithoutCoordinates = { ...validRally, locationPrecision: "exact", latitude: null, longitude: null };
assert.ok(publicationBlockers(exactWithoutCoordinates).some((issue) => issue.code === "exact_location_without_coordinates"));

const organizerDraftQuality = {
  ...validRally,
  publicationSource: "organizer",
  organizerName: "OMAE",
  sourceName: "OMAE",
};
assert.equal(publicationBlockers(organizerDraftQuality).some((issue) => issue.code === "source_is_not_organizer"), false);

console.log("Publication quality fixtures passed.");
