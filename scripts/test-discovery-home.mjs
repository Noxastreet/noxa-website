import fs from "node:fs";
import assert from "node:assert/strict";

const landing = fs.readFileSync("src/components/culture/CultureLandingV2.tsx", "utf8");
const rail = fs.readFileSync("src/components/culture/HomepageDiscoveryRail.tsx", "utf8");
const railCss = fs.readFileSync("src/components/culture/HomepageDiscoveryRail.module.css", "utf8");
const layout = fs.readFileSync("src/app/layout.tsx", "utf8");

assert.match(landing, /The automotive platform for Greece\./);
assert.match(landing, /Η automotive πλατφόρμα για την Ελλάδα\./);
assert.match(landing, /HomepageDiscoveryRail/);
assert.match(landing, /RadarHomeSpotlight/);
assert.match(landing, /AppShowcase/);
assert.match(landing, /Discover the app/);
assert.match(landing, /Δες το app/);
assert.equal(landing.includes("HomepageMapPreview"), false);
assert.equal(landing.includes("Open NOXA Map"), false);
assert.equal(landing.includes("BUSINESS & PARTNERS"), false);
assert.equal(landing.includes("CulturePromoSection"), false);
assert.equal(landing.includes("WaitlistForm"), false);

assert.ok(rail.includes('`${base}/meets`'), "Discovery rail must link to Meets");
assert.ok(rail.includes('`${base}/app`'), "Discovery rail must link to App");
assert.match(rail, /CAR & MOTO EVENTS/);
assert.match(rail, /NOXA APP/);
assert.equal(rail.includes("/map"), false);
assert.equal(rail.includes("/communities"), false);
assert.equal(rail.includes("/business"), false);
assert.equal(rail.includes("/organizers"), false);
assert.equal(rail.includes("/meets/submit"), false);

assert.match(railCss, /grid-template-columns:\s*repeat\(2,/);
assert.match(railCss, /scroll-snap-type:\s*x mandatory/);
assert.match(railCss, /scroll-snap-align:\s*start/);
assert.match(railCss, /@media \(max-width: 900px\)/);

assert.match(layout, /NOXA — Automotive Platform for Greece/);
assert.match(layout, /Discover car and moto events across Greece and meet the NOXA app/);

console.log("NOXA Discovery homepage fixtures passed.");
