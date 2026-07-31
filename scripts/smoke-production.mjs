const baseUrl = process.env.PRODUCTION_URL;

if (!baseUrl) {
  throw new Error("PRODUCTION_URL is required, for example https://noxastreetapp.com");
}

const checks = [
  ["home", "/", "text/html"],
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
    headers: {
      "User-Agent": "NOXA-production-smoke/1.0",
    },
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
  headers: { "User-Agent": "NOXA-production-smoke/1.0" },
});
const health = await healthResponse.json();

if (health.status !== "ok" || health.service !== "noxa-website") {
  throw new Error("Health endpoint returned an unexpected payload.");
}

console.log("Production smoke test passed.");
