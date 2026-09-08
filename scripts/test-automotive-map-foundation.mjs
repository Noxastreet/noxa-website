import assert from "node:assert/strict";

import {
  mapRowToGeoJsonFeature,
  parseMapBBox,
  parseMapLayers,
  parseMapLimit,
} from "../src/lib/mapViewport.ts";

assert.deepEqual(parseMapBBox("19.0,34.0,29.0,42.5"), [19, 34, 29, 42.5]);
assert.throws(() => parseMapBBox(null), /bbox is required/);
assert.throws(() => parseMapBBox("23,40,22,41"), /minimums/);
assert.throws(() => parseMapBBox("-180,-90,180,90"), /too large/);

assert.deepEqual(parseMapLayers(null), ["events", "tracks", "routes", "places"]);
assert.deepEqual(parseMapLayers("events,routes,events"), ["events", "routes"]);
assert.throws(() => parseMapLayers("events,garages"), /unsupported map layer/);

assert.equal(parseMapLimit(null), 250);
assert.equal(parseMapLimit("25"), 25);
assert.equal(parseMapLimit("900"), 500);
assert.throws(() => parseMapLimit("0"), /positive integer/);

const pointRow = {
  feature_id: "11111111-1111-1111-1111-111111111111",
  layer: "events",
  feature_kind: "event",
  title: "Kart Championship",
  title_el: null,
  feature_type: "karting",
  latitude: 37.98,
  longitude: 23.36,
  geometry_geojson: null,
  bbox_min_lat: 37.98,
  bbox_min_lng: 23.36,
  bbox_max_lat: 37.98,
  bbox_max_lng: 23.36,
  country_code: "GR",
  city: "Megara",
  region: "Attica",
  location_text: "Athens Karting Center",
  location_text_el: null,
  cover_image_url: null,
  href: "/meets/kart-championship",
  starts_at: "2026-09-20T06:30:00Z",
  ends_at: null,
  source_url: "https://example.com/event",
};
const point = mapRowToGeoJsonFeature(pointRow);
assert.deepEqual(point?.geometry, { type: "Point", coordinates: [23.36, 37.98] });
assert.equal(point?.properties.layer, "events");
assert.equal(point?.properties.href, "/meets/kart-championship");

const routeRow = {
  feature_id: "22222222-2222-2222-2222-222222222222",
  layer: "routes",
  feature_kind: "map_feature",
  title: "Mountain Route",
  title_el: "Ορεινή Διαδρομή",
  feature_type: "route",
  latitude: null,
  longitude: null,
  geometry_geojson: { type: "LineString", coordinates: [[22.9, 40.5], [23.1, 40.6]] },
  bbox_min_lat: 40.5,
  bbox_min_lng: 22.9,
  bbox_max_lat: 40.6,
  bbox_max_lng: 23.1,
  country_code: "GR",
  city: null,
  region: "Central Macedonia",
  location_text: null,
  location_text_el: null,
  cover_image_url: null,
  href: null,
  starts_at: null,
  ends_at: null,
  source_url: "https://example.com/route",
};
const route = mapRowToGeoJsonFeature(routeRow);
assert.deepEqual(route?.geometry, {
  type: "LineString",
  coordinates: [[22.9, 40.5], [23.1, 40.6]],
});
assert.equal(route?.properties.layer, "routes");

const missingGeometry = mapRowToGeoJsonFeature({ ...routeRow, geometry_geojson: null });
assert.equal(missingGeometry, null);

console.log("Automotive map foundation fixtures passed.");
