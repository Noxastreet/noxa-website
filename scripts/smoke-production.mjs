const baseUrl = process.env.PRODUCTION_URL;
if (!baseUrl) throw new Error("PRODUCTION_URL is required");

const userAgent = "NOXA-production-smoke/3.3";
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

const organizerRedirects = [
  ["organizers", "/organizers", "/meets"],
  ["organizer-profile", "/organizers/example", "/meets"],
  ["organizer-apply", "/organizers/apply", "/meets"],
  ["organizer-dashboard", "/organizer", "/meets"],
  ["organizer-insights", "/organizer/insights", "/meets"],
  ["greek-organizers", "/el/organizers", "/el/meets"],
  ["greek-organizer-profile", "/el/organizers/example", "/el/meets"],
  ["greek-organizer-apply", "/el/organizers/apply", "/el/meets"],
  ["greek-organizer-dashboard", "/el/organizer", "/el/meets"],
  ["greek-organizer-insights", "/el/organizer/insights", "/el/meets"],
];

for (const [name, pathname, expectedPath] of organizerRedirects) {
  const response = await fetch(new URL(pathname, baseUrl), {
    redirect: "manual",
    headers: { "User-Agent": userAgent },
  });
  if (![301, 302, 307, 308].includes(response.status)) {
    throw new Error(`${name} expected redirect, got HTTP ${response.status}`);
  }
  const location = response.headers.get("location");
  if (!location || new URL(location, baseUrl).pathname !== expectedPath) {
    throw new Error(`${name} redirects to ${location}; expected ${expectedPath}`);
  }
  console.log(`✓ ${name}: hidden → ${expectedPath}`);
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

const communityHtml = await (await fetch(new URL("/communities", baseUrl), { headers: { "User-Agent": userAgent } })).text();
for (const forbidden of ["href=\"/radar\"", "href=\"/crews\"", "href=\"/routes\"", "href=\"/organizers\""]) {
  if (communityHtml.includes(forbidden)) throw new Error(`Community navigation still contains ${forbidden}`);
}
for (const expected of ["href=\"/meets\"", "href=\"/communities\""]) {
  if (!communityHtml.includes(expected)) throw new Error(`Community navigation missing ${expected}`);
}
if (communityHtml.includes("communities, organisers and local scenes")) throw new Error("Communities still mixes organizer discovery");
if (communityHtml.includes("communities, organizers and local scenes")) throw new Error("Communities metadata still mixes organizer discovery");

const greekSubmit = await (await fetch(new URL("/el/meets/submit", baseUrl), { headers: { "User-Agent": userAgent } })).text();
if (!greekSubmit.includes("Πρότεινε ένα event") || greekSubmit.includes("Submit an event for review.")) {
  throw new Error("Greek event suggestion is not localized");
}

const robotsText = await (await fetch(new URL("/robots.txt", baseUrl), { headers: { "User-Agent": userAgent } })).text();
if (!robotsText.includes("Disallow: /organizer") || !robotsText.includes("Disallow: /organizers")) {
  throw new Error("robots.txt does not hide organizer routes");
}
const sitemapText = await (await fetch(new URL("/sitemap.xml", baseUrl), { headers: { "User-Agent": userAgent } })).text();
if (sitemapText.includes("/organizer") || sitemapText.includes("/organizers")) {
  throw new Error("Sitemap still exposes organizer routes");
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
