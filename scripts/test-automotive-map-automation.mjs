import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import {
  classifyTourismPlace,
  tourismPlaceAccessEvidence,
} from "../supabase/functions/automotive-map-collector/place-evidence.ts";

const migrationFiles = await readdir("supabase/migrations");
const automationMigrationName = migrationFiles.find((name) => name.endsWith("_automotive_map_automation_20260908.sql"));
const runtimeMigrationName = migrationFiles.find((name) => name.endsWith("_automotive_map_collector_runtime_hardening.sql"));
const triggerSecurityMigrationName = migrationFiles.find((name) => name.endsWith("_automotive_map_quality_trigger_security.sql"));
assert.ok(automationMigrationName, "Map Content Expansion automation migration must exist");
assert.ok(runtimeMigrationName, "Map collector runtime hardening migration must exist");
assert.ok(triggerSecurityMigrationName, "Map Quality Gate trigger security migration must exist");

const [migration, runtimeMigration, triggerSecurityMigration, collector] = await Promise.all([
  readFile(`supabase/migrations/${automationMigrationName}`, "utf8"),
  readFile(`supabase/migrations/${runtimeMigrationName}`, "utf8"),
  readFile(`supabase/migrations/${triggerSecurityMigrationName}`, "utf8"),
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

assert.ok(migration.includes("c.automation_origin in ('source_registry', 'osm_discovery')"), "only automation-owned candidates may auto-publish");
assert.ok(migration.includes("s.trust_level in ('high', 'medium')"), "low-trust sources must never auto-publish");
assert.ok(migration.includes("Duplicate published map feature"), "auto-publisher must block duplicate map features");
assert.ok(migration.includes("revoke all on function private.automotive_map_auto_publish_verified(integer) from public"), "private auto-publisher must not become a public RPC");
assert.ok(runtimeMigration.includes("timeout_milliseconds := 60000"), "scheduled collector must override pg_net's 5-second timeout");
assert.ok(runtimeMigration.includes("cron.unschedule"), "runtime hardening must replace the previous collector job instead of duplicating it");

for (const required of [
  "private.enforce_automotive_map_candidate_quality()",
  "security definer",
  "set search_path = public, private",
  "private.automotive_map_candidate_quality_issues(new)",
  "revoke all on function private.enforce_automotive_map_candidate_quality() from public",
]) {
  assert.ok(triggerSecurityMigration.includes(required), `Quality Gate trigger security migration must include ${required}`);
}
assert.ok(!triggerSecurityMigration.includes("grant usage on schema private"), "collector integration must not open the private schema to service/public roles");

for (const required of [
  "const OVERPASS_URLS = [",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "const GREECE_OSM_AREA_ID = 3600192307",
  "const VERIFY_THRESHOLD = 0.98",
  "const BLOCKED_RETRY_MS = 20 * 60 * 60 * 1000",
  "validCronSecret",
  "trust_level: \"medium\"",
  "Official website identity, exact coordinate and public-access evidence verified",
  "latitude: officialCoordinate?.latitude ?? null",
  "longitude: officialCoordinate?.longitude ?? null",
  "geometry_source_url: officialCoordinate ? page.url : null",
  "Automated route discovery is allowed, but publication is blocked until an authoritative route geometry",
  "source.trust_level === \"low\"",
  "MAX_DISCOVERED_HOSTS = 48",
  "official_venue_source_already_tracked",
  "candidateSourceIds.has(source.id)",
  "!2d(-?\\d{2}\\.\\d+)!3d(-?\\d{2}\\.\\d+)",
  "add(Number(match[2]), Number(match[1]))",
  "const existing = candidatesBySource.get(source.id)",
  "existing?.external_key",
  "let osmResults: ProcessResult[] = []",
  "key: \"osm-discovery\"",
  "OSM discovery unavailable",
  "tags.highway === \"raceway\"",
  "tags[\"contact:url\"]",
  "area(${GREECE_OSM_AREA_ID})->.gr",
  "nwr(area.gr)[\"highway\"=\"raceway\"]",
  "Promise.allSettled",
  "for (const url of OVERPASS_URLS)",
  "AbortSignal.timeout(16_000)",
  "out center tags qt",
  "NOXA-Map-Collector/1.4",
  "OFFICIAL_TOURISM_PLACE_DISCOVERY",
  "collectTourismPlaceDiscoveries",
  "tourismPlaceAccessEvidence",
  'tags.tourism === "viewpoint"',
  'nwr(area.gr)["tourism"="viewpoint"]["website"]',
  'source.source_type !== "tourism_authority"',
  'featureType: "automotive_place", featureSubtype: classification.subtype',
  'key: "tourism-place-discovery"',
]) {
  assert.ok(collector.includes(required), `collector safety fixture must include ${required}`);
}

assert.ok(collector.indexOf("https://maps.mail.ru/osm/tools/overpass/api/interpreter") < collector.indexOf("https://overpass-api.de/api/interpreter"), "the production-network verified Overpass endpoint must remain primary");
assert.ok(!collector.includes("GREECE_BBOX"), "Greece discovery must never fall back to a rectangle that includes neighbouring countries");
assert.ok(!collector.includes('area["ISO3166-1"="GR"]'), "split queries must use the direct Greece area id rather than repeatedly resolving the country relation");
assert.equal(collector.match(/area\(\$\{GREECE_OSM_AREA_ID\}\)->\.gr/g)?.length, 3, "each split Overpass query must independently use the exact Greece area");
assert.ok(collector.includes("hint: hintFromElement(element)"), "OSM coordinates may be used only as a discovery cross-check hint");
assert.ok(!collector.includes("latitude: hint?.latitude") && !collector.includes("longitude: hint?.longitude"), "OSM discovery coordinates must not be written as authoritative candidate coordinates");
assert.ok(collector.includes("chooseOfficialCoordinate(page.coordinates, hint)"), "published point coordinates must come from official-page evidence and only be cross-checked against discovery hints");
assert.ok(collector.includes("feature.featureType === \"route\"") && collector.includes("markBlocked(candidate.id, reason, 0.65)"), "route discovery must fail closed when authoritative geometry is unavailable");
assert.ok(!collector.includes('source.source_type === "official_venue" && !candidatesBySource.has(source.id)'), "source-registry discovery must not permanently exclude blocked candidates from retry");
assert.ok(collector.includes("existing,\n    }));"), "registry retry must pass the existing candidate into the update path instead of creating a duplicate");
assert.ok(!collector.includes('["route"="road"]["scenic"="yes"]'), "general venue collector must not spend its runtime budget on scenic-route discovery");
assert.ok(collector.includes('/kart|karting|motorsport|motocross|motorcycle|motor racing|raceway|circuit|καρτ|μοτοκρος|πιστα/'), "venue classification must cover English and Greek motorsport signals");

const registryCall = collector.indexOf("const registryResults = await collectRegistrySources(sources, candidates)");
const tourismIsolation = collector.indexOf("let tourismResults: ProcessResult[] = []");
const osmIsolation = collector.indexOf("let osmResults: ProcessResult[] = []");
assert.ok(registryCall >= 0 && tourismIsolation > registryCall && osmIsolation > tourismIsolation, "tourism discovery must be isolated after registry processing and before optional OSM discovery");

const trackBranch = collector.indexOf('const motorsportSignal = tags.highway === "raceway"');
const routeBranch = collector.indexOf('if (tags.route === "road" || (tags.scenic === "yes" && Boolean(tags.highway)))');
assert.ok(trackBranch >= 0 && routeBranch >= 0 && trackBranch < routeBranch, "track classification must take precedence over scenic-route metadata");

const driveUp = "Lycabettus Hill offers stunning panoramic views. There is also a road to drive up. Visit the hill for a 360 degree view.";
assert.equal(classifyTourismPlace("Lycabettus Hill", driveUp, "viewpoint").subtype, "viewpoint", "explicit drive-up panoramic viewpoint must classify as viewpoint");
assert.ok(tourismPlaceAccessEvidence(driveUp), "drive-up viewpoint must have conditional driving/public access evidence");

const genericScenic = "A beautiful scenic mountain area with forests and villages. By car from Athens.";
assert.equal(classifyTourismPlace("Mountain Area", genericScenic, "photo_spot").subtype, null, "generic scenic prose must not become a photo spot");

const strictPhoto = "A photogenic sunset viewpoint and postcard-perfect photography location. How to get there: By Car. Drive to the lookout.";
assert.equal(classifyTourismPlace("Sunset Point", strictPhoto, "photo_spot").subtype, "photo_spot", "photo spot requires explicit photography evidence");
assert.ok(tourismPlaceAccessEvidence(strictPhoto), "photo spot still requires explicit road/car access evidence");

const scenicNotPhoto = "A panoramic viewpoint with a road to drive up. Visit for a sweeping view.";
assert.equal(classifyTourismPlace("Scenic Point", scenicNotPhoto, "photo_spot").subtype, "viewpoint", "scenic evidence without photography evidence must downgrade to viewpoint");

const hikingOnly = "Panoramic viewpoint. By car to the designated parking area near the beginning of the trail. From there the path begins and hiking reaches the viewpoint.";
assert.equal(tourismPlaceAccessEvidence(hikingOnly), null, "car access only to a trailhead must not count as driving access to the viewpoint");

console.log("Automotive map automation safety fixtures: PASS");
