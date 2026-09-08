import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const autoPublishMigration = readFileSync(
  new URL("../supabase/migrations/20260908124500_radar_verified_auto_publish_20260908.sql", import.meta.url),
  "utf8",
);
const eventMapGuarantee = readFileSync(
  new URL("../supabase/migrations/20260908190453_event_map_guarantee_20260908.sql", import.meta.url),
  "utf8",
);
const pipelineOrderFix = readFileSync(
  new URL("../supabase/migrations/20260908190706_event_map_guarantee_pipeline_order_fix_20260908.sql", import.meta.url),
  "utf8",
);

const requiredPredicates = [
  "c.status = 'new'",
  "c.duplicate_of is null",
  "c.enrichment_outcome = 'verified'",
  "c.source_verified_at is not null",
  "c.source_verified_at > now() - interval '24 hours'",
  "coalesce(c.ai_confidence, 0) >= 0.92",
  "c.reviewed_by is null",
  "c.starts_at > now()",
  "c.media_location_attempted_at is not null",
  "c.media_location_outcome in ('verified', 'partial', 'none')",
  "s.active = true",
  "s.trust_level = 'trusted'",
  "private.radar_candidate_quality_issues(candidate_row)",
  "private.radar_auto_publish_duplicate_event_id(candidate_row)",
  "candidate_row.title_el",
  "candidate_row.summary_el",
  "candidate_row.location_text_el",
  "publication_source = 'auto'",
  "'57 */6 * * *'",
];

for (const predicate of requiredPredicates) {
  assert.ok(autoPublishMigration.includes(predicate), `missing auto-publish safety predicate: ${predicate}`);
}

assert.ok(
  !autoPublishMigration.includes("c.status in ('new', 'needs_review')"),
  "needs_review candidates must never be auto-publish eligible",
);
assert.ok(
  autoPublishMigration.includes("revoke all on function private.radar_auto_publish_verified(integer) from public"),
  "auto-publish RPC must not be publicly executable",
);
assert.ok(
  autoPublishMigration.includes("check (publication_source in ('reviewed', 'organizer', 'auto'))"),
  "auto publications must be explicitly traceable",
);

assert.ok(
  eventMapGuarantee.includes("before insert or update of status, latitude, longitude, location_precision"),
  "published events must be revalidated when map location fields change",
);
assert.ok(
  eventMapGuarantee.includes("map_location_not_exact") && eventMapGuarantee.includes("map_coordinates_missing"),
  "published-event gate must require exact coordinates",
);

assert.ok(
  pipelineOrderFix.includes("private.radar_candidate_map_issues(candidate_row)"),
  "auto-publisher must run the dedicated Map Gate",
);
assert.ok(
  pipelineOrderFix.includes("block_reason := 'Map Gate: '"),
  "non-map-eligible candidates must be blocked rather than published",
);
assert.ok(
  pipelineOrderFix.includes("private.radar_candidate_quality_issues(new)") &&
    pipelineOrderFix.includes("private.radar_candidate_map_issues(new)"),
  "manual approval must enforce both content quality and map eligibility",
);

const contentQualityFunction = pipelineOrderFix
  .split("create or replace function private.radar_candidate_quality_issues", 2)[1]
  ?.split("create or replace function private.radar_candidate_map_issues", 1)[0] ?? "";
assert.ok(contentQualityFunction, "candidate content-quality function must exist");
assert.ok(
  !contentQualityFunction.includes("map_location_not_exact") && !contentQualityFunction.includes("map_coordinates_missing"),
  "content enrichment quality must remain independent from later map-location verification",
);

console.log("Radar auto-publish and Event Map Guarantee safety fixtures: PASS");
