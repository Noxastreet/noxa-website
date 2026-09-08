import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";

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
assert.ok(
  !triggerSecurityMigration.includes("grant usage on schema private"),
  "collector integration must not open the private schema to service/public roles",
);

for (const required of [
  "const OVERPASS_URL = \"https://overpass-api.de/api/interpreter\"",
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
  "nwr(area.gr)[\"highway\"=\"raceway\"]",
  "out center tags qt",
  "NOXA-Map-Collector/1.1",
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
assert.ok(
  !collector.includes('source.source_type === "official_venue" && !candidatesBySource.has(source.id)'),
  "source-registry discovery must not permanently exclude blocked candidates from retry",
);
assert.ok(
  collector.includes("existing,\n    }));"),
  "registry retry must pass the existing candidate into the update path instead of creating a duplicate",
);
assert.ok(
  !collector.includes('wr(area.gr)["route"="road"]["scenic"="yes"]'),
  "general venue collector must not spend its runtime budget on scenic-route discovery",
);
assert.ok(
  collector.includes('/kart|karting|motorsport|motocross|motorcycle|motor racing|raceway|circuit|καρτ|μοτοκρος|πιστα/'),
  "venue classification must cover English and Greek motorsport signals",
);

const registryCall = collector.indexOf("const registryResults = await collectRegistrySources(sources, candidates)");
const osmIsolation = collector.indexOf("let osmResults: ProcessResult[] = []");
assert.ok(registryCall >= 0 && osmIsolation > registryCall, "official source processing must complete before optional OSM discovery is isolated");

const trackBranch = collector.indexOf('const motorsportSignal = tags.highway === "raceway"');
const routeBranch = collector.indexOf('if (tags.route === "road" || (tags.scenic === "yes" && Boolean(tags.highway)))');
assert.ok(trackBranch >= 0 && routeBranch >= 0 && trackBranch < routeBranch, "track classification must take precedence over scenic-route metadata");

console.log("Automotive map automation safety fixtures: PASS");