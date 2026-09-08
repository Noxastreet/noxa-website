import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  MAP_CANDIDATE_STATUSES,
  MAP_DRIVING_ACCESS_STATUSES,
  MAP_FEATURE_SUBTYPES,
  MAP_PUBLIC_ACCESS_STATUSES,
  MAP_SOURCE_TRUST_LEVELS,
  MAP_SOURCE_TYPES,
  isSubtypeForFeatureType,
} from "../src/lib/automotiveMapContent.ts";

const [migration, initialCandidates] = await Promise.all([
  readFile("supabase/migrations/20260908161000_automotive_map_content_verification_20260908.sql", "utf8"),
  readFile("supabase/migrations/20260908162000_initial_verified_map_candidates_20260908.sql", "utf8"),
]);

for (const required of [
  "create table if not exists public.automotive_map_sources",
  "create table if not exists public.automotive_map_candidates",
  "source_id uuid references public.automotive_map_sources",
  "feature_subtype text",
  "public_access_status",
  "driving_access_status",
  "access_verified_at",
  "missing_source_registry",
  "public_access_not_verified",
  "driving_access_not_verified",
  "high_trust_source_required",
  "AUTOMOTIVE_MAP_CANDIDATE_BLOCK_REASON_REQUIRED",
  "private.publish_automotive_map_candidate",
]) {
  assert.ok(migration.includes(required), `content verification migration must include ${required}`);
}

assert.ok(MAP_SOURCE_TYPES.includes("official_venue"), "official venues must be first-class sources");
assert.ok(MAP_SOURCE_TYPES.includes("tourism_authority"), "tourism authorities must be supported");
assert.ok(MAP_SOURCE_TRUST_LEVELS.includes("high"), "high-trust source tier must exist");
assert.ok(MAP_PUBLIC_ACCESS_STATUSES.includes("restricted"), "restricted public access must be representable");
assert.ok(MAP_DRIVING_ACCESS_STATUSES.includes("not_applicable"), "non-driving places must be representable");
assert.ok(MAP_CANDIDATE_STATUSES.includes("blocked"), "uncertain candidates must remain explicitly blocked");
assert.ok(MAP_CANDIDATE_STATUSES.includes("verified"), "verified candidate state must exist before publishing");
assert.ok(isSubtypeForFeatureType("route", "offroad_route"), "off-road routes must map to route features");
assert.ok(isSubtypeForFeatureType("automotive_place", "photo_spot"), "photo spots must map to automotive places");
assert.ok(isSubtypeForFeatureType("track", "race_circuit"), "race circuits must map to tracks");
assert.equal(isSubtypeForFeatureType("track", "photo_spot"), false, "subtypes must not cross feature types");

for (const subtype of MAP_FEATURE_SUBTYPES.route) {
  assert.ok(migration.includes(`'${subtype}'`), `migration must allow route subtype ${subtype}`);
}

for (const required of [
  "'serres-racing-circuit'",
  "'verified'",
  "41.07317",
  "23.517207",
  "https://serrescircuit.gr/en/",
  "https://serrescircuit.gr/orario-leitourgias/",
  "'athens-international-circuit-megara'",
  "'blocked'",
  "exact_coordinates_not_verified_from_primary_source",
]) {
  assert.ok(initialCandidates.includes(required), `initial candidate seed must include ${required}`);
}

assert.ok(
  !initialCandidates.includes("private.publish_automotive_map_candidate"),
  "candidate seed must never auto-publish features during migration",
);

console.log("Automotive map content verification fixtures: PASS");
