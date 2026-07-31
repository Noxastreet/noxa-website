const baseUrl = process.env.PRODUCTION_URL;

if (!baseUrl) {
  throw new Error("PRODUCTION_URL is required, for example https://noxastreetapp.com");
}

const userAgent = "NOXA-production-smoke/1.0";
const checks = [
  ["home", "/", "text/html"],
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
