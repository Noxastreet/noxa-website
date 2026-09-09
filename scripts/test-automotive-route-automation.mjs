import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";

const migrationFiles = await readdir("supabase/migrations");
const routeMigrationName = migrationFiles.find((name) => name.endsWith("_automotive_route_pipeline_20260909.sql"));
assert.ok(routeMigrationName, "authoritative route pipeline migration must exist");

const [collector, migration] = await Promise.all([
  readFile("supabase/functions/automotive-route-collector/index.ts", "utf8"),
  readFile(`supabase/migrations/${routeMigrationName}`, "utf8"),
]);

for (const required of [
  'externalKey: "visitgreece-amyntaio-lakes-light"',
  'sourceBaseUrl: "https://www.visitgreece.gr/"',
  'featureSubtype: "scenic_route"',
  'automation_origin: "source_registry"',
  'feature_type: "route"',
  'geometry_geojson: geometry',
  'geometry_source_url: kml.url',
  'public_access_status: "confirmed"',
  'driving_access_status: "conditional"',
  'verification_confidence: 1',
  'AbortSignal.timeout(15_000)',
  'MAX_PAGE_BYTES = 900_000',
  'MAX_KML_BYTES = 500_000',
  'canonicalHost(pageEvidence.kmlUrl)',
  'kmlHost !== "cdn.visitgreece.gr"',
  'parseKmlGeometry',
  '<LineString',
  'route_type',
  'road',
  'validGreekCoordinate',
  'x-radar-cron-secret',
  'validCronSecret',
]) {
  assert.ok(collector.includes(required), `route collector must include ${required}`);
}

assert.ok(
  collector.includes('type: "LineString"') && collector.includes('type: "MultiLineString"'),
  "route geometry must be an authoritative line geometry",
);
assert.ok(
  collector.includes("authoritative KML LineString could not be validated"),
  "missing or invalid authoritative geometry must fail closed",
);
assert.ok(
  collector.includes("official_road_classification_missing"),
  "route page must explicitly identify a Road route",
);
assert.ok(
  !collector.toLowerCase().includes("overpass") && !collector.toLowerCase().includes("openstreetmap") && !collector.includes("osm.org"),
  "dedicated route collector must never source authoritative geometry from OSM/Overpass",
);
assert.ok(
  !collector.includes("hintFromElement") && !collector.includes("GREECE_BBOX"),
  "route geometry must not be synthesized from discovery hints or a broad bbox",
);
assert.ok(
  collector.includes("latitude >= 34") && collector.includes("longitude >= 18.5"),
  "route coordinates must be constrained to the Greece content scope",
);

for (const required of [
  'externalKey: "visitgreece-grevena-jeep-safari"',
  'pageUrl: "https://www.visitgreece.gr/el/inspirations/jeep-safari-in-grevena"',
  'featureSubtype: "offroad_route"',
  'tags: ["auto-map", "route:official-tourism", "route:offroad", "4x4"]',
  'public_access_status: "unknown"',
  'driving_access_status: "unknown"',
  'offroadPageEvidence',
  'authoritative_geometry_missing',
  'current_public_driving_access_not_verified',
  'NOXA will not synthesize route geometry or assume current access',
  'processOffroadDiscovery',
]) {
  assert.ok(collector.includes(required), `off-road discovery must include ${required}`);
}
assert.ok(
  collector.includes('const evidenceConfirmed = Boolean(evidence?.titleOk && evidence.offroadOk && evidence.fourByFourOk)'),
  "off-road discovery must require explicit official 4x4/off-road evidence",
);
assert.ok(
  collector.includes('await markBlocked(candidate.id, reason, evidenceConfirmed ? 0.9 : 0.5)'),
  "off-road discovery must remain blocked even when identity confidence is high",
);
assert.ok(
  !collector.includes('featureSubtype: "offroad_route"') || !collector.includes('geometry_source_url: evidence.authoritativeGeometryUrl'),
  "off-road discovery must not wire unverified geometry into publication",
);

for (const required of [
  "'Visit Greece (GNTO)'",
  "'tourism_authority'",
  "'https://www.visitgreece.gr/'",
  "'high'",
  "'automotive-route-collector-daily'",
  "'21 2 * * *'",
  "automotive-route-collector",
  "timeout_milliseconds := 60000",
  "radar_collector_cron_secret",
]) {
  assert.ok(migration.includes(required), `route migration must include ${required}`);
}
assert.ok(
  migration.includes("where not exists"),
  "Visit Greece source seed must be duplicate-safe",
);
assert.ok(
  migration.includes("cron.unschedule"),
  "route cron migration must replace an existing job rather than duplicate it",
);

console.log("Automotive route automation safety fixtures: PASS");
