import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";

const migrationFiles = await readdir("supabase/migrations");
const automationMigrationName = migrationFiles.find((name) => name.endsWith("_automotive_map_automation_20260908.sql"));
assert.ok(automationMigrationName, "Map Content Expansion automation migration must exist");

const [migration, collector] = await Promise.all([
  readFile(`supabase/migrations/${automationMigrationName}`, "utf8"),
  readFile("supabase/functions/automotive-map-collector/index.ts", "utf8"),
]);

for (const required of [
  "automation_origin text not null default 'manual'",
  "verification_confidence double precision",
  "geometry_source_url text",
  "private.automotive_map_automation_issues",
  "private.automotive_map_duplicate_feature_id",
  "private.automotive_map_auto_publish_verified",
  "coalesce(c.verification_confidence, 0) >= 0.98",
  "private.automotive_map_candidate_quality_issues(candidate_row)",
  "private.publish_automotive_map_candidate(candidate_row.id)",
  "automotive-map-collector-daily",
  "automotive-map-auto-publisher-daily",
  "'11 2 * * *'",
  "'31 2 * * *'",
  "'PistaPark Go Kart Chania'",
  "'Messara Kart'",
  "'Go Kart Malia'",
]) {
  assert.ok(migration.includes(required), `automation migration must include ${required}`);
}

assert.ok(
  migration.includes("c.automation_origin in ('source_registry', 'osm_discovery')"),
  "only automation-owned candidates may auto-publish",
);
assert.ok(
  migration.includes("s.trust_level in ('high', 'medium')"),
  "low-trust sources must never auto-publish",
);
assert.ok(
  migration.includes("Duplicate published map feature"),
  "auto-publisher must block duplicate map features",
);
assert.ok(
  migration.includes("revoke all on function private.automotive_map_auto_publish_verified(integer) from public"),
  "private auto-publisher must not become a public RPC",
);

for (const required of [
  "const OVERPASS_URL = \"https://overpass-api.de/api/interpreter\"",
  "const VERIFY_THRESHOLD = 0.98",
  "validCronSecret",
  "trust_level: \"medium\"",
  "Official website identity, exact coordinate and public-access evidence verified",
  "latitude: officialCoordinate?.latitude ?? null",
  "longitude: officialCoordinate?.longitude ?? null",
  "geometry_source_url: officialCoordinate ? page.url : null",
  "Automated route discovery is allowed, but publication is blocked until an authoritative route geometry",
  "source.trust_level === \"low\"",
  "MAX_DISCOVERED_HOSTS = 24",
]) {
  assert.ok(collector.includes(required), `collector safety fixture must include ${required}`);
}

assert.ok(
  collector.includes("hint: hintFromElement(element)"),
  "OSM coordinates may be used only as a discovery cross-check hint",
);
assert.ok(
  !collector.includes("latitude: hint?.latitude") && !collector.includes("longitude: hint?.longitude"),
  "OSM discovery coordinates must not be written as authoritative candidate coordinates",
);
assert.ok(
  collector.includes("chooseOfficialCoordinate(page.coordinates, hint)"),
  "published point coordinates must come from official-page evidence and only be cross-checked against discovery hints",
);
assert.ok(
  collector.includes("feature.featureType === \"route\"") && collector.includes("markBlocked(candidate.id, reason, 0.65)"),
  "route discovery must fail closed when authoritative geometry is unavailable",
);

console.log("Automotive map automation safety fixtures: PASS");
