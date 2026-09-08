import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [packageText, mapUi, mapCss, nextConfig, websiteHeader, mapPage, greekMapPage] = await Promise.all([
  readFile("package.json", "utf8"),
  readFile("src/components/map/AutomotiveMap.tsx", "utf8"),
  readFile("src/components/map/AutomotiveMap.module.css", "utf8"),
  readFile("next.config.ts", "utf8"),
  readFile("src/components/navigation/WebsiteHeader.tsx", "utf8"),
  readFile("src/app/map/page.tsx", "utf8"),
  readFile("src/app/el/map/page.tsx", "utf8"),
]);

const packageJson = JSON.parse(packageText);
assert.equal(packageJson.dependencies["maplibre-gl"], "5.24.0", "MapLibre must stay pinned for predictable production builds");

for (const required of [
  "https://tiles.openfreemap.org/styles/dark",
  "/api/map/features?bbox=",
  "cluster: true",
  "navigator.geolocation",
  '"events"',
  '"tracks"',
  '"routes"',
  '"places"',
  "moveend",
]) {
  assert.ok(mapUi.includes(required), `AutomotiveMap must include ${required}`);
}

assert.ok(mapCss.includes("detailSheetExpanded"), "mobile detail bottom sheet styles must exist");
assert.ok(mapCss.includes("@media (max-width: 900px)"), "map must have a dedicated mobile layout");
assert.ok(nextConfig.includes("https://tiles.openfreemap.org"), "CSP must allow the OpenFreeMap tile host");
assert.ok(nextConfig.includes("geolocation=(self)"), "geolocation must be restricted to NOXA itself");
assert.ok(websiteHeader.includes('["Map", `${base}/map`]'), "website navigation must expose the Map route");
assert.ok(mapPage.includes('<AutomotiveMap locale="en" />'), "English map route must render the map");
assert.ok(greekMapPage.includes('<AutomotiveMap locale="el" />'), "Greek map route must render the localized map");

console.log("Automotive map UI fixture: PASS");
