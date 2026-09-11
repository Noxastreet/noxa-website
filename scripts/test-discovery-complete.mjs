import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const [directory, directoryPage, map, eventPage, personalization, mobileDock, mobileFilters, discoveryCss] = await Promise.all([
  read("src/components/meets/MeetsDirectory.tsx"),
  read("src/components/meets/MeetsDirectoryPage.tsx"),
  read("src/components/map/AutomotiveMap.tsx"),
  read("src/components/meets/EventDetailPage.tsx"),
  read("src/lib/meets/discoveryPersonalization.ts"),
  read("src/components/meets/MobileDiscoveryDock.tsx"),
  read("src/components/meets/MobileMeetFilters.tsx"),
  read("src/components/meets/MeetsDiscovery.module.css"),
]);

for (const expected of [
  'personalMode === "nearby"',
  'personalMode === "saved"',
  "navigator.geolocation.getCurrentPosition",
  "NEARBY_RADIUS_KM = 100",
  "rankRecommendations",
  "buildNoxaMapHref",
  "SavedEventButton",
  "MobileDiscoveryDock",
  "FollowSubscriptionForm",
  "QUICK DISCOVERY",
  "This weekend",
  "Saved",
  "NOXA Map",
  "Event, crew, business or city",
]) {
  assert.ok(directory.includes(expected), `Meets Discovery missing: ${expected}`);
}
assert.ok(!directory.includes("/organizers/"), "Meets Discovery must not link to removed organizer profiles");
assert.ok(!directory.includes("organizerSlug"), "Meets Discovery must not depend on organizer profile slugs");

for (const expected of [
  "latitude,longitude,location_precision",
  "organizer_name",
  "locationPrecision",
]) {
  assert.ok(directoryPage.includes(expected), `Meets data bridge missing: ${expected}`);
}
assert.ok(!directoryPage.includes("loadPublicOrganizers"), "Meets data bridge must not load removed organizer profiles");
assert.ok(!directoryPage.includes("organizer_profile_id"), "Meets data bridge must not depend on organizer profile IDs");

for (const expected of [
  "distanceKm",
  "eventDistanceKm",
  "eventFamily",
  "rankRecommendations",
  "buildNoxaMapHref",
  'locationPrecision === "exact"',
]) {
  assert.ok(personalization.includes(expected), `Discovery personalization missing: ${expected}`);
}

for (const expected of [
  "deepLinkTarget",
  'params.get("event")',
  'params.get("lat")',
  'params.get("lng")',
  "initialEventIdRef",
  "feature.id === initialEventIdRef.current",
  "setSheetExpanded(true)",
]) {
  assert.ok(map.includes(expected), `Map event deep link missing: ${expected}`);
}

for (const expected of [
  "loadRelatedEvents",
  "buildNoxaMapHref",
  "OFFICIAL SOURCE",
  "Open official source",
  "Open in NOXA Map",
  "More events like this.",
]) {
  assert.ok(eventPage.includes(expected), `Event discovery bridge missing: ${expected}`);
}
assert.ok(!eventPage.includes("loadOrganizerById"), "Event detail must not load removed organizer profiles");
assert.ok(!eventPage.includes("VERIFIED ORGANIZER"), "Event detail must not render removed organizer profile UI");

for (const expected of ["Near", "Weekend", "Saved", "Filters", "mobileDock"]) {
  assert.ok(mobileDock.includes(expected), `Mobile dock missing: ${expected}`);
}
assert.ok(mobileFilters.includes("openSignal"), "Mobile filter sheet must be openable from Discovery dock");
assert.ok(discoveryCss.includes("padding-bottom: calc(84px + env(safe-area-inset-bottom))"), "Mobile dock must reserve safe content space");
assert.ok(discoveryCss.includes("scroll-snap-type: x mandatory"), "Mobile discovery rails must use scroll snap");

console.log("NOXA Discovery complete fixtures passed.");
