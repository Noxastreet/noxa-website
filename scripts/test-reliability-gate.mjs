import fs from "node:fs";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function expectIncludes(text, expected, label) {
  if (!text.includes(expected)) throw new Error(`${label} missing: ${expected}`);
}

const nextConfig = read("next.config.ts");
for (const [source, destination] of [
  ["/api/meets/report", "meet-public?action=report"],
  ["/api/meets/follow", "meet-public?action=follow"],
]) {
  expectIncludes(nextConfig, `source: \"${source}\"`, "Next rewrite");
  expectIncludes(nextConfig, destination, "Next rewrite");
}

for (const path of [
  "src/app/api/meets/report/route.ts",
  "src/app/api/meets/follow/route.ts",
]) {
  if (fs.existsSync(path)) throw new Error(`Bypassable public write route still exists: ${path}`);
}

const edge = read("supabase/functions/meet-public/index.ts");
for (const expected of [
  "SUPABASE_SERVICE_ROLE_KEY",
  "https://noxastreetapp.com",
  "https://www.noxastreetapp.com",
  "rateLimited(req, \"meet-report\"",
  "rateLimited(req, \"meet-follow\"",
  "Origin not allowed.",
]) {
  expectIncludes(edge, expected, "meet-public Edge Function");
}

const migration = read("supabase/migrations/20260909080500_lock_down_public_meet_writes.sql").toLowerCase();
for (const expected of [
  'drop policy if exists "public can create follow subscriptions"',
  'drop policy if exists "public can submit event corrections"',
  "revoke insert on table public.meet_follow_subscriptions from anon, authenticated",
  "revoke insert on table public.event_correction_reports from anon, authenticated",
]) {
  expectIncludes(migration, expected, "public write lockdown migration");
}

console.log("Reliability Gate security fixtures passed.");
