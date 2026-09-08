import assert from "node:assert/strict";

import { extractRadarMediaLocationEvidence } from "../src/lib/radarMediaEvidence.ts";

const pageUrl = "https://example.com/events/open-track-day";
const sourceUrl = "https://example.com/";

const verified = extractRadarMediaLocationEvidence({
  pageUrl,
  sourceUrl,
  title: "Open Track Day",
  titleEl: "Ημέρα Ελεύθερης Οδήγησης",
  html: `
    <html><head>
      <script type="application/ld+json">
        {
          "@context":"https://schema.org",
          "@type":"Event",
          "name":"Open Track Day",
          "image":{"@type":"ImageObject","url":"/uploads/events/open-track-day-poster.jpg","caption":"Open Track Day poster"},
          "location":{"@type":"Place","name":"Example Circuit","geo":{"@type":"GeoCoordinates","latitude":"40.1234","longitude":"23.5678"}}
        }
      </script>
    </head></html>`,
});
assert.equal(verified.outcome, "verified");
assert.equal(verified.coverImageUrl, "https://example.com/uploads/events/open-track-day-poster.jpg");
assert.equal(verified.coverImageAlt, "Open Track Day poster");
assert.equal(verified.latitude, 40.1234);
assert.equal(verified.longitude, 23.5678);
assert.equal(verified.locationPrecision, "exact");

const rejectGeneric = extractRadarMediaLocationEvidence({
  pageUrl,
  sourceUrl,
  title: "Open Track Day",
  html: `
    <meta property="og:title" content="Open Track Day">
    <meta property="og:image" content="https://example.com/assets/site-logo.png">
  `,
});
assert.equal(rejectGeneric.coverImageUrl, null);
assert.equal(rejectGeneric.outcome, "none");

const rejectExternal = extractRadarMediaLocationEvidence({
  pageUrl,
  sourceUrl,
  title: "Open Track Day",
  html: `
    <script type="application/ld+json">
      {"@type":"Event","image":"https://random-images.example.net/car.jpg"}
    </script>
  `,
});
assert.equal(rejectExternal.coverImageUrl, null);

const socialFallback = extractRadarMediaLocationEvidence({
  pageUrl,
  sourceUrl,
  title: "Open Track Day Serres",
  html: `
    <meta property="og:title" content="Open Track Day Serres | Official Event">
    <meta property="og:image" content="/uploads/2026/track-day-serres.jpg">
    <meta property="og:image:alt" content="Track day event poster">
  `,
});
assert.equal(socialFallback.outcome, "partial");
assert.equal(socialFallback.coverImageUrl, "https://example.com/uploads/2026/track-day-serres.jpg");
assert.equal(socialFallback.locationPrecision, "unknown");

const noGuessing = extractRadarMediaLocationEvidence({
  pageUrl,
  sourceUrl,
  title: "Open Track Day",
  html: `<div>Example Circuit, Serres, Greece</div>`,
});
assert.equal(noGuessing.latitude, null);
assert.equal(noGuessing.longitude, null);
assert.equal(noGuessing.locationPrecision, "unknown");

console.log("Radar media/location evidence fixtures passed.");
