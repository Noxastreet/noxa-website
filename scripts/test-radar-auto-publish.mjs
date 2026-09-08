import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync(
  new URL("../supabase/migrations/20260908124500_radar_verified_auto_publish_20260908.sql", import.meta.url),
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
  assert.ok(migration.includes(predicate), `missing auto-publish safety predicate: ${predicate}`);
}

assert.ok(
  !migration.includes("c.status in ('new', 'needs_review')"),
  "needs_review candidates must never be auto-publish eligible",
);
assert.ok(
  migration.includes("revoke all on function private.radar_auto_publish_verified(integer) from public"),
  "auto-publish RPC must not be publicly executable",
);
assert.ok(
  migration.includes("check (publication_source in ('reviewed', 'organizer', 'auto'))"),
  "auto publications must be explicitly traceable",
);

console.log("Radar auto-publish safety fixture: PASS");
