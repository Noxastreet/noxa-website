const baseUrl = process.env.PRODUCTION_URL;
if (!baseUrl) throw new Error("PRODUCTION_URL is required");

const userAgent = "NOXA-production-smoke/3.4";
const checks = [
  ["home", "/", "text/html"],
  ["greek-home", "/el", "text/html"],
  ["meets", "/meets", "text/html"],
  ["greek-meets", "/el/meets", "text/html"],
  ["meet-submit", "/meets/submit", "text/html"],
  ["greek-meet-submit", "/el/meets/submit", "text/html"],
  ["communities", "/communities", "text/html"],
  ["greek-communities", "/el/communities", "text/html"],
  ["community-apply", "/communities/apply", "text/html"],
  ["greek-community-apply", "/el/communities/apply", "text/html"],
  ["organizers", "/organizers", "text/html"],
  ["greek-organizers", "/el/organizers", "text/html"],
  ["organizer-apply", "/organizers/apply", "text/html"],
  ["greek-organizer-apply", "/el/organizers/apply", "text/html"],
  ["organizer-dashboard", "/organizer", "text/html"],
  ["greek-organizer-dashboard", "/el/organizer", "text/html"],
  ["privacy", "/privacy", "text/html"],
  ["terms", "/terms", "text/html"],
  ["health", "/api/health", "application/json"],
  ["robots", "/robots.txt", "text/plain"],
  ["sitemap", "/sitemap.xml", "application/xml"],
  ["manifest", "/manifest.webmanifest", "application/manifest+json"],
  ["icon", "/icon.png", "image/png"],
];

for (const [name, pathname, expectedType] of checks) {
  const response = await fetch(new URL(pathname, baseUrl), {
    redirect: "follow",
    headers: { "User-Agent": userAgent },
  });
  if (!response.ok) throw new Error(`${name} failed with HTTP ${response.status}`);
  const type = response.headers.get("content-type") ?? "";
  if (!type.includes(expectedType)) throw new Error(`${name} returned ${type}; expected ${expectedType}`);
  if (pathname === "/el" || pathname.startsWith("/el/")) {
    const language = response.headers.get("content-language");
    if (language !== "el") throw new Error(`${name} Content-Language: ${language}; expected el`);
  }
  console.log(`✓ ${name}: ${response.status}`);
}

const health = await (await fetch(new URL("/api/health", baseUrl), { headers: { "User-Agent": userAgent } })).json();
if (health.status !== "ok" || health.service !== "noxa-website") throw new Error("Unexpected health payload");

const homeResponse = await fetch(new URL("/", baseUrl), { headers: { "User-Agent": userAgent } });
const homeHtml = await homeResponse.text();
for (const expected of [
  "instagram.com/noxa_app",
  "S. KARAKETIDIS",
  "aria-label=\"EN — English\"",
  "aria-label=\"EL — Greek\"",
  "href=\"/meets\"",
  "href=\"/communities\"",
  "href=\"/organizers\"",
  "/brand/noxa-maps-logo.png",
  "THIS WEEKEND IN GREECE",
  "/meets?country=GR&amp;date=weekend",
]) {
  if (!homeHtml.includes(expected)) throw new Error(`Home missing: ${expected}`);
}
if (homeHtml.includes("href=\"/meets/submit\"")) throw new Error("Home must not expose Add Event");

const pages = [
  ["meets", "/meets", "Find your next meet."],
  ["greek-meets", "/el/meets", "Βρες το επόμενο meet σου."],
  ["communities", "/communities", "Find your scene."],
  ["greek-communities", "/el/communities", "Βρες τη σκηνή σου."],
  ["organizers", "/organizers", "The organizers behind the events."],
  ["greek-organizers", "/el/organizers", "Οι organizers πίσω από τα events."],
];
for (const [name, pathname, expected] of pages) {
  const html = await (await fetch(new URL(pathname, baseUrl), { headers: { "User-Agent": userAgent } })).text();
  if (!html.includes(expected)) throw new Error(`${name} missing: ${expected}`);
  if (!html.includes("/brand/noxa-maps-logo.png")) throw new Error(`${name} missing NOXA logo`);
}

const meetsHtml = await (await fetch(new URL("/meets?country=GR&date=weekend&q=NOXA", baseUrl), { headers: { "User-Agent": userAgent } })).text();
if (!meetsHtml.includes("href=\"/meets/submit\"")) throw new Error("Meets missing Add Event");
if (!meetsHtml.includes("This weekend")) throw new Error("Meets missing date filters");
if (!meetsHtml.includes(">Search<")) throw new Error("Meets missing discovery search");

const organizerHtml = await (await fetch(new URL("/organizers", baseUrl), { headers: { "User-Agent": userAgent } })).text();
for (const expected of ["href=\"/organizers/apply\"", "I already have access", "car and motorcycle events in Greece"]) {
  if (!organizerHtml.includes(expected)) throw new Error(`Organizer directory missing: ${expected}`);
}

const communityHtml = await (await fetch(new URL("/communities", baseUrl), { headers: { "User-Agent": userAgent } })).text();
for (const forbidden of ["href=\"/radar\"", "href=\"/crews\"", "href=\"/routes\""]) {
  if (communityHtml.includes(forbidden)) throw new Error(`Community navigation still contains ${forbidden}`);
}
for (const expected of ["href=\"/meets\"", "href=\"/communities\""]) {
  if (!communityHtml.includes(expected)) throw new Error(`Community navigation missing ${expected}`);
}
if (communityHtml.includes("communities, organisers and local scenes")) throw new Error("Communities still mixes organizer discovery");
if (communityHtml.includes("communities, organizers and local scenes")) throw new Error("Communities metadata still mixes organizer discovery");

const greekSubmit = await (await fetch(new URL("/el/meets/submit", baseUrl), { headers: { "User-Agent": userAgent } })).text();
if (!greekSubmit.includes("Πρόσθεσε το event σου.") || greekSubmit.includes("Submit an event for review.")) {
  throw new Error("Greek Add Event flow is not localized");
}

const robotsText = await (await fetch(new URL("/robots.txt", baseUrl), { headers: { "User-Agent": userAgent } })).text();
const robotsLines = robotsText.split(/\r?\n/).map((line) => line.trim());
for (const expected of ["Disallow: /organizer", "Disallow: /el/organizer"]) {
  if (!robotsLines.includes(expected)) throw new Error(`robots.txt missing private organizer rule: ${expected}`);
}
for (const forbidden of ["Disallow: /organizers", "Disallow: /el/organizers"]) {
  if (robotsLines.includes(forbidden)) throw new Error(`robots.txt still hides public organizer directory: ${forbidden}`);
}

const sitemapText = await (await fetch(new URL("/sitemap.xml", baseUrl), { headers: { "User-Agent": userAgent } })).text();
for (const expected of [
  "https://noxastreetapp.com/organizers",
  "https://noxastreetapp.com/el/organizers",
  "https://noxastreetapp.com/organizers/apply",
]) {
  if (!sitemapText.includes(expected)) throw new Error(`Sitemap missing public organizer surface: ${expected}`);
}
for (const forbidden of [
  "<loc>https://noxastreetapp.com/organizer</loc>",
  "<loc>https://noxastreetapp.com/el/organizer</loc>",
  "/claim</loc>",
]) {
  if (sitemapText.includes(forbidden)) throw new Error(`Sitemap exposes private organizer surface: ${forbidden}`);
}

const origin = new URL(baseUrl).origin;
const invalidReport = await fetch(new URL("/api/meets/report", baseUrl), {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: origin, "User-Agent": userAgent },
  body: JSON.stringify({ eventId: "invalid", reason: "other" }),
});
if (invalidReport.status !== 400) throw new Error(`Report validation expected 400, got ${invalidReport.status}`);

const invalidFollow = await fetch(new URL("/api/meets/follow", baseUrl), {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: origin, "User-Agent": userAgent },
  body: JSON.stringify({ email: "person@example.com", consent: false, targetType: "city", city: "Thessaloniki", countryCode: "GR", startedAt: Date.now() - 2000 }),
});
if (invalidFollow.status !== 400) throw new Error(`Follow validation expected 400, got ${invalidFollow.status}`);

const expectedHeaders = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
  "cross-origin-opener-policy": "same-origin",
};
for (const [header, expected] of Object.entries(expectedHeaders)) {
  const actual = homeResponse.headers.get(header);
  if (actual !== expected) throw new Error(`Security header ${header}: ${actual}`);
}
const policy = homeResponse.headers.get("permissions-policy") ?? "";
for (const directive of ["camera=()", "microphone=()", "geolocation=(self)"]) {
  if (!policy.includes(directive)) throw new Error(`Permissions-Policy missing ${directive}`);
}

console.log("Production smoke test passed.");
