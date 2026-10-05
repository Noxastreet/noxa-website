import fs from "node:fs";
import assert from "node:assert/strict";

const landing = fs.readFileSync("src/components/culture/CultureLandingV2.tsx", "utf8");
const rail = fs.readFileSync("src/components/culture/HomepageDiscoveryRail.tsx", "utf8");
const railCss = fs.readFileSync("src/components/culture/HomepageDiscoveryRail.module.css", "utf8");
const layout = fs.readFileSync("src/app/layout.tsx", "utf8");

assert.match(landing, /Greece’s automotive scene, in one place\./);
assert.match(landing, /Η automotive σκηνή της Ελλάδας, σε ένα μέρος\./);
assert.match(landing, /HomepageDiscoveryRail/);
assert.match(landing, /RadarHomeSpotlight/);
assert.match(landing, /HomepageMapPreview/);
assert.match(landing, /Open NOXA Map/);
assert.match(landing, /Άνοιξε το NOXA Map/);
assert.equal(landing.includes("BUSINESS & PARTNERS"), false);
assert.equal(landing.includes("CulturePromoSection"), false);
assert.equal(landing.includes("WaitlistForm"), false);
assert.equal(landing.includes("Explore Organizers"), false);

assert.ok(rail.includes('`${base}/meets`'), "Discovery rail must link to Meets");
assert.ok(rail.includes('`${base}/map`'), "Discovery rail must link to Map");
assert.match(rail, /CAR & MOTO EVENTS/);
assert.match(rail, /NOXA MAP/);
assert.equal(rail.includes("/communities"), false);
assert.equal(rail.includes("/business"), false);
assert.equal(rail.includes("/organizers"), false);
assert.equal(rail.includes("/meets/submit"), false);

assert.match(railCss, /grid-template-columns:\s*repeat\(2,/);
assert.match(railCss, /scroll-snap-type:\s*x mandatory/);
assert.match(railCss, /scroll-snap-align:\s*start/);
assert.match(railCss, /@media \(max-width: 900px\)/);

assert.match(layout, /NOXA — Automotive Events & Map in Greece/);
assert.match(layout, /Discover car and moto events, tracks, routes and verified automotive places across Greece with NOXA\./);
assert.equal(layout.includes("Crews, partners"), false);

console.log("NOXA Discovery homepage fixtures passed.");
