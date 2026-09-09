import fs from "node:fs";
import assert from "node:assert/strict";

const landing = fs.readFileSync("src/components/culture/CultureLandingV2.tsx", "utf8");
const rail = fs.readFileSync("src/components/culture/HomepageDiscoveryRail.tsx", "utf8");
const railCss = fs.readFileSync("src/components/culture/HomepageDiscoveryRail.module.css", "utf8");
const layout = fs.readFileSync("src/app/layout.tsx", "utf8");

assert.match(landing, /Discover car & moto events across Greece\./);
assert.match(landing, /Ανακάλυψε car & moto events σε όλη την Ελλάδα\./);
assert.match(landing, /HomepageDiscoveryRail/);
assert.match(landing, /secondaryButton/);
assert.match(landing, /Open NOXA Map/);
assert.match(landing, /Άνοιξε το NOXA Map/);

assert.match(rail, /date=weekend/);
assert.match(rail, /\/map/);
assert.match(rail, /\/organizers/);
assert.match(rail, /\/meets\/submit/);
assert.match(rail, /THIS WEEKEND/);
assert.match(rail, /ΑΥΤΟ ΤΟ WEEKEND/);
assert.match(rail, /HOSTING AN EVENT\?/);
assert.match(rail, /ΔΙΟΡΓΑΝΩΝΕΙΣ EVENT\?/);

assert.match(railCss, /scroll-snap-type:\s*x mandatory/);
assert.match(railCss, /scroll-snap-align:\s*start/);
assert.match(railCss, /@media \(max-width: 900px\)/);

assert.match(layout, /NOXA — Car & Moto Events in Greece/);
assert.match(layout, /Discover car and moto events, organizers, tracks, routes and verified automotive places across Greece with NOXA\./);

console.log("NOXA Discovery homepage fixtures passed.");
