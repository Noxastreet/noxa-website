const baseUrl = process.env.PRODUCTION_URL;

if (!baseUrl) {
  throw new Error("PRODUCTION_URL is required, for example https://noxastreetapp.com");
}

const userAgent = "NOXA-production-smoke/1.0";
const checks = [
  ["home", "/", "text/html"],
  ["greek-home", "/el", "text/html"],
  ["meets", "/meets", "text/html"],
  ["greek-meets", "/el/meets", "text/html"],
  ["meets-archive", "/meets/archive", "text/html"],
  ["greek-meets-archive", "/el/meets/archive", "text/html"],
  ["communities", "/communities", "text/html"],
  ["greek-communities", "/el/communities", "text/html"],
  ["organizer", "/organizer", "text/html"],
  ["public-organizer", "/organizers/noxa", "text/html"],
  ["privacy", "/privacy", "text/html"],
  ["terms", "/terms", "text/html"],
  ["health", "/api/health", "application/json"],
  ["robots", "/robots.txt", "text/plain"],
  ["sitemap", "/sitemap.xml", "application/xml"],
  ["manifest", "/manifest.webmanifest", "application/manifest+json"],
  ["icon", "/icon.png", "image/png"],
];

for (const [name, pathname, expectedType] of checks) {
  const url = new URL(pathname, baseUrl);
  const response = await fetch(url, {
    redirect: "follow",
    headers: { "User-Agent": userAgent },
  });

  if (!response.ok) {
    throw new Error(`${name} failed with HTTP ${response.status} at ${url}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes(expectedType)) {
    throw new Error(`${name} returned ${contentType || "no content type"}; expected ${expectedType}`);
  }

  console.log(`✓ ${name}: ${response.status} ${contentType}`);
}

const healthResponse = await fetch(new URL("/api/health", baseUrl), {
  headers: { "User-Agent": userAgent },
});
const health = await healthResponse.json();

if (health.status !== "ok" || health.service !== "noxa-website") {
  throw new Error("Health endpoint returned an unexpected payload.");
}

const homeResponse = await fetch(new URL("/", baseUrl), {
  headers: { "User-Agent": userAgent },
});
const homeHtml = await homeResponse.text();

for (const expectedContent of [
  "instagram.com/noxa_app",
  "S. KARAKETIDIS",
  "aria-label=\"English\"",
  "aria-label=\"Greek\"",
  "href=\"/meets\"",
  "href=\"/communities\"",
  "href=\"/organizer\"",
  "/brand/noxa-maps-logo.png",
]) {
  if (!homeHtml.includes(expectedContent)) {
    throw new Error(`Home page is missing expected content: ${expectedContent}`);
  }
}

if (homeHtml.includes("href=\"/meets/submit\"")) {
  throw new Error("Home page must not expose Add Event; it belongs on the Meets directory only.");
}

const pageContentChecks = [
  ["meets", "/meets", "Find your next meet."],
  ["greek-meets", "/el/meets", "Βρες το επόμενο meet σου."],
  ["communities", "/communities", "Find your scene."],
  ["greek-communities", "/el/communities", "Βρες τη σκηνή σου."],
];

for (const [name, pathname, expectedContent] of pageContentChecks) {
  const response = await fetch(new URL(pathname, baseUrl), {
    headers: { "User-Agent": userAgent },
  });
  const html = await response.text();

  if (!html.includes(expectedContent)) {
    throw new Error(`${name} page is missing expected content: ${expectedContent}`);
  }

  if (!html.includes("/brand/noxa-maps-logo.png")) {
    throw new Error(`${name} page is missing the current NOXA logo asset.`);
  }
}

const meetsHtml = await (await fetch(new URL("/meets", baseUrl), {
  headers: { "User-Agent": userAgent },
})).text();

if (!meetsHtml.includes("href=\"/meets/submit\"")) {
  throw new Error("Meets page is missing its top-level Add Event action.");
}

const expectedHeaders = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
  "cross-origin-opener-policy": "same-origin",
};

for (const [header, expectedValue] of Object.entries(expectedHeaders)) {
  const actualValue = homeResponse.headers.get(header);
  if (actualValue !== expectedValue) {
    throw new Error(`Security header ${header} returned ${actualValue || "nothing"}; expected ${expectedValue}`);
  }
}

const permissionsPolicy = homeResponse.headers.get("permissions-policy") ?? "";
for (const directive of ["camera=()", "microphone=()", "geolocation=()"] ) {
  if (!permissionsPolicy.includes(directive)) {
    throw new Error(`Permissions-Policy is missing ${directive}`);
  }
}

console.log("Production smoke test passed.");
