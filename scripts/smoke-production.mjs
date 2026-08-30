const baseUrl = process.env.PRODUCTION_URL;

if (!baseUrl) {
  throw new Error("PRODUCTION_URL is required, for example https://noxastreetapp.com");
}

const userAgent = "NOXA-production-smoke/1.0";
const checks = [
  ["home", "/", "text/html"],
  ["greek-home", "/el", "text/html"],
  ["meetups", "/meets", "text/html"],
  ["crews", "/crews", "text/html"],
  ["routes", "/routes", "text/html"],
  ["greek-meetups", "/el/meets", "text/html"],
  ["greek-crews", "/el/crews", "text/html"],
  ["greek-routes", "/el/routes", "text/html"],
  ["privacy", "/privacy", "text/html"],
  ["terms", "/terms", "text/html"],
  ["health", "/api/health", "application/json"],
  ["robots", "/robots.txt", "text/plain"],
  ["sitemap", "/sitemap.xml", "application/xml"],
  ["manifest", "/manifest.webmanifest", "application/manifest+json"],
  ["icon", "/icon.svg", "image/svg+xml"],
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
    throw new Error(
      `${name} returned ${contentType || "no content type"}; expected ${expectedType}`,
    );
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
  "href=\"/crews\"",
  "href=\"/routes\"",
]) {
  if (!homeHtml.includes(expectedContent)) {
    throw new Error(`Home page is missing expected content: ${expectedContent}`);
  }
}

const featureContentChecks = [
  ["meetups", "/meets", "What Meetups mean inside NOXA"],
  ["crews", "/crews", "What Crews mean inside NOXA"],
  ["routes", "/routes", "What Routes &amp; Drives mean inside NOXA"],
  ["greek-meetups", "/el/meets", "Τι σημαίνουν τα Meetups μέσα στο NOXA"],
];

for (const [name, pathname, expectedContent] of featureContentChecks) {
  const response = await fetch(new URL(pathname, baseUrl), {
    headers: { "User-Agent": userAgent },
  });
  const html = await response.text();

  if (!html.includes(expectedContent)) {
    throw new Error(`${name} page is missing expected content: ${expectedContent}`);
  }

  if (!html.includes("S. KARAKETIDIS") || !html.includes("instagram.com/noxa_app")) {
    throw new Error(`${name} page is missing founder or Instagram footer content.`);
  }
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
    throw new Error(
      `Security header ${header} returned ${actualValue || "nothing"}; expected ${expectedValue}`,
    );
  }
}

const permissionsPolicy = homeResponse.headers.get("permissions-policy") ?? "";
for (const directive of ["camera=()", "microphone=()", "geolocation=()"] ) {
  if (!permissionsPolicy.includes(directive)) {
    throw new Error(`Permissions-Policy is missing ${directive}`);
  }
}

console.log("Production smoke test passed.");
