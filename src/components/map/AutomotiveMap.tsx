"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GeoJSONSource, LngLatBoundsLike, Map as MapLibreMap, Marker as MapLibreMarker } from "maplibre-gl";

import { DocumentLanguage } from "@/components/i18n/DocumentLanguage";
import { WebsiteHeader } from "@/components/navigation/WebsiteHeader";
import { MAP_LAYERS, type MapLayer } from "@/lib/mapViewport";
import { applyNoxaBasemapTheme, createNoxaPoiImage } from "@/lib/noxaMapTheme";

import styles from "./AutomotiveMap.module.css";

const DARK_STYLE_URL = "https://tiles.openfreemap.org/styles/dark";
const GREECE_CENTER: [number, number] = [22.35, 39.05];
const GREECE_BOUNDS: [[number, number], [number, number]] = [[18.2, 34.4], [30.4, 42.6]];
const EMPTY_COLLECTION = { type: "FeatureCollection" as const, features: [] };
const MAP_LIMIT = 300;

type MapGeometry = { type: string; coordinates?: unknown };
type MapApiFeature = {
  type: "Feature";
  id: string;
  geometry: MapGeometry;
  properties: {
    layer: MapLayer;
    kind: "event" | "map_feature";
    title: string;
    titleEl: string | null;
    featureType: string;
    countryCode: string;
    city: string | null;
    region: string | null;
    location: string | null;
    locationEl: string | null;
    coverImageUrl: string | null;
    href: string | null;
    startsAt: string | null;
    endsAt: string | null;
    sourceUrl: string;
  };
};
type MapApiResponse = {
  type: "FeatureCollection";
  features: MapApiFeature[];
  meta: { count: number; limit: number; capped: boolean };
};
type SelectedFeature = MapApiFeature["properties"] & { id: string; geometry: MapGeometry };

function featureCollection(features: MapApiFeature[]) {
  return { type: "FeatureCollection" as const, features };
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase();
}

function localizedTitle(feature: MapApiFeature, locale: "en" | "el") {
  return locale === "el" ? feature.properties.titleEl || feature.properties.title : feature.properties.title;
}

function localizedLocation(feature: MapApiFeature, locale: "en" | "el") {
  const p = feature.properties;
  return locale === "el" ? p.locationEl || p.location : p.location;
}

function matchesSearch(feature: MapApiFeature, query: string, locale: "en" | "el") {
  const search = normalize(query);
  if (!search) return true;
  const p = feature.properties;
  return normalize([
    localizedTitle(feature, locale), p.title, p.city, p.region,
    localizedLocation(feature, locale), p.featureType,
  ].filter(Boolean).join(" ")).includes(search);
}

function readString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function selectedFromFeature(feature: MapApiFeature): SelectedFeature {
  return { id: feature.id, geometry: feature.geometry, ...feature.properties };
}

function selectedFromRenderedFeature(feature: unknown): SelectedFeature | null {
  if (!feature || typeof feature !== "object") return null;
  const candidate = feature as { id?: string | number; geometry?: MapGeometry; properties?: Record<string, unknown> };
  const properties = candidate.properties;
  const id = candidate.id == null ? null : String(candidate.id);
  const layer = readString(properties?.layer);
  const title = readString(properties?.title);
  const sourceUrl = readString(properties?.sourceUrl);
  if (!id || !layer || !title || !sourceUrl || !candidate.geometry || !(MAP_LAYERS as readonly string[]).includes(layer)) return null;
  return {
    id,
    geometry: candidate.geometry,
    layer: layer as MapLayer,
    kind: readString(properties?.kind) === "event" ? "event" : "map_feature",
    title,
    titleEl: readString(properties?.titleEl),
    featureType: readString(properties?.featureType) || "place",
    countryCode: readString(properties?.countryCode) || "GR",
    city: readString(properties?.city),
    region: readString(properties?.region),
    location: readString(properties?.location),
    locationEl: readString(properties?.locationEl),
    coverImageUrl: readString(properties?.coverImageUrl),
    href: readString(properties?.href),
    startsAt: readString(properties?.startsAt),
    endsAt: readString(properties?.endsAt),
    sourceUrl,
  };
}

function formatEventDate(value: string | null, locale: "en" | "el") {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale === "el" ? "el-GR" : "en-GB", {
    weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    hour12: false, timeZone: "Europe/Athens",
  }).format(date);
}

function flattenCoordinates(value: unknown, out: [number, number][]) {
  if (!Array.isArray(value)) return;
  if (value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") {
    out.push([value[0], value[1]]);
    return;
  }
  for (const child of value) flattenCoordinates(child, out);
}

function geometryBounds(geometry: MapGeometry): [[number, number], [number, number]] | null {
  const coords: [number, number][] = [];
  flattenCoordinates(geometry.coordinates, coords);
  if (coords.length === 0) return null;
  let minLng = coords[0][0]; let maxLng = coords[0][0];
  let minLat = coords[0][1]; let maxLat = coords[0][1];
  for (const [lng, lat] of coords) {
    minLng = Math.min(minLng, lng); maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
  }
  return [[minLng, minLat], [maxLng, maxLat]];
}

export function AutomotiveMap({ locale }: { locale: "en" | "el" }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const locationMarkerRef = useRef<MapLibreMarker | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const allFeaturesRef = useRef<MapApiFeature[]>([]);
  const activeLayersRef = useRef<Set<MapLayer>>(new Set(MAP_LAYERS));
  const queryRef = useRef("");

  const [activeLayers, setActiveLayers] = useState<Set<MapLayer>>(new Set(MAP_LAYERS));
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<SelectedFeature | null>(null);
  const [visibleCount, setVisibleCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [capped, setCapped] = useState(false);

  const t = locale === "el" ? {
    search: "Αναζήτηση στον χάρτη", searchPlaceholder: "Event, πόλη, πίστα ή μέρος",
    layers: "Επίπεδα", events: "Events", tracks: "Πίστες", routes: "Διαδρομές", places: "Μέρη",
    loading: "Φόρτωση περιοχής…", visible: "ορατά σημεία", empty: "Δεν υπάρχουν επαληθευμένα σημεία εδώ.",
    chooseLayer: "Επίλεξε τουλάχιστον ένα επίπεδο.", capped: "Μεγάλη περιοχή — κάνε zoom για περισσότερες λεπτομέρειες.",
    details: "Λεπτομέρειες", explore: "Επίλεξε ένα σημείο ή μετακίνησε τον χάρτη.", viewEvent: "Δες Event",
    source: "Πηγή", locate: "Η τοποθεσία μου", locationError: "Δεν ήταν δυνατή η πρόσβαση στην τοποθεσία.", retry: "Δοκίμασε ξανά",
    results: "Αποτελέσματα", noResults: "Δεν βρέθηκε κάτι στην ορατή περιοχή.", close: "Κλείσιμο",
  } : {
    search: "Search the map", searchPlaceholder: "Event, city, track or place",
    layers: "Layers", events: "Events", tracks: "Tracks", routes: "Routes", places: "Places",
    loading: "Loading this area…", visible: "visible objects", empty: "No verified objects in this area yet.",
    chooseLayer: "Choose at least one map layer.", capped: "Large area — zoom in for more detail.",
    details: "Details", explore: "Select a place or move around the map.", viewEvent: "View Event",
    source: "Source", locate: "My location", locationError: "Location access was not available.", retry: "Try again",
    results: "Results", noResults: "No matches in the visible area.", close: "Close",
  };

  const layerLabels: Record<MapLayer, string> = { events: t.events, tracks: t.tracks, routes: t.routes, places: t.places };
  const searchResults = useMemo(() => query.trim()
    ? allFeaturesRef.current.filter((feature) => matchesSearch(feature, query, locale)).slice(0, 6)
    : [], [query, locale, visibleCount]);

  const updateMapSources = useCallback((features: MapApiFeature[]) => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    const filtered = features.filter((feature) => matchesSearch(feature, queryRef.current, locale));
    setVisibleCount(filtered.length);
    (map.getSource("noxa-points") as GeoJSONSource | undefined)?.setData(featureCollection(filtered.filter((f) => f.geometry.type === "Point")) as Parameters<GeoJSONSource["setData"]>[0]);
    (map.getSource("noxa-shapes") as GeoJSONSource | undefined)?.setData(featureCollection(filtered.filter((f) => f.geometry.type !== "Point")) as Parameters<GeoJSONSource["setData"]>[0]);
  }, [locale]);

  const loadVisibleFeatures = useCallback(async (map: MapLibreMap) => {
    const layers = MAP_LAYERS.filter((layer) => activeLayersRef.current.has(layer));
    if (layers.length === 0) {
      requestRef.current?.abort(); allFeaturesRef.current = []; updateMapSources([]);
      setLoading(false); setError(null); setCapped(false); return;
    }
    requestRef.current?.abort();
    const controller = new AbortController(); requestRef.current = controller;
    const bounds = map.getBounds();
    const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()].map((v) => v.toFixed(6)).join(",");
    setLoading(true); setError(null);
    try {
      const response = await fetch(`/api/map/features?bbox=${encodeURIComponent(bbox)}&layers=${encodeURIComponent(layers.join(","))}&limit=${MAP_LIMIT}`, {
        signal: controller.signal, headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(`Map data request failed (${response.status})`);
      const payload = await response.json() as MapApiResponse;
      allFeaturesRef.current = payload.features; setCapped(payload.meta.capped); updateMapSources(payload.features);
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Map data request failed");
    } finally { if (!controller.signal.aborted) setLoading(false); }
  }, [updateMapSources]);

  useEffect(() => { queryRef.current = query; updateMapSources(allFeaturesRef.current); }, [query, updateMapSources]);
  useEffect(() => {
    activeLayersRef.current = activeLayers;
    const map = mapRef.current; if (map?.loaded()) void loadVisibleFeatures(map);
  }, [activeLayers, loadVisibleFeatures]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setQuery(""); setSelected(null); setSheetExpanded(false);
    };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    let disposed = false;
    void import("maplibre-gl").then((module) => {
      if (disposed || !mapContainerRef.current) return;
      const maplibregl = module;
      maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
      const map = new maplibregl.Map({
        container: mapContainerRef.current, style: DARK_STYLE_URL, center: GREECE_CENTER, zoom: 5.35,
        minZoom: 4.6, maxZoom: 18, maxBounds: GREECE_BOUNDS, attributionControl: false,
        cooperativeGestures: false,
      });
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }), "bottom-right");
      map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

      map.on("load", () => {
        applyNoxaBasemapTheme(map);
        for (const layer of MAP_LAYERS) {
          const imageId = `noxa-poi-${layer}`;
          if (!map.hasImage(imageId)) map.addImage(imageId, createNoxaPoiImage(layer));
        }
        map.addSource("noxa-points", { type: "geojson", data: EMPTY_COLLECTION, cluster: true, clusterMaxZoom: 13, clusterRadius: 52 });
        map.addSource("noxa-shapes", { type: "geojson", data: EMPTY_COLLECTION });
        map.addLayer({ id: "noxa-clusters", type: "circle", source: "noxa-points", filter: ["has", "point_count"], paint: {
          "circle-color": "#c8102e", "circle-radius": ["step", ["get", "point_count"], 18, 10, 22, 40, 28],
          "circle-stroke-width": 2, "circle-stroke-color": "rgba(255,255,255,.84)", "circle-opacity": .94,
        }});
        map.addLayer({ id: "noxa-cluster-count", type: "symbol", source: "noxa-points", filter: ["has", "point_count"],
          layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 12 }, paint: { "text-color": "#fff" } });
        map.addLayer({ id: "noxa-points", type: "symbol", source: "noxa-points", filter: ["!", ["has", "point_count"]], layout: {
          "icon-image": ["match", ["get", "layer"],
            "events", "noxa-poi-events", "tracks", "noxa-poi-tracks",
            "routes", "noxa-poi-routes", "places", "noxa-poi-places", "noxa-poi-events"],
          "icon-size": ["interpolate", ["linear"], ["zoom"], 5, .48, 10, .62, 15, .78],
          "icon-allow-overlap": false,
          "icon-ignore-placement": false,
        }});
        map.addLayer({ id: "noxa-polygons", type: "fill", source: "noxa-shapes", filter: ["==", ["geometry-type"], "Polygon"], paint: {
          "fill-color": ["match", ["get", "layer"], "tracks", "#f5f5f7", "places", "#70d6ff", "#e32c49"], "fill-opacity": .17, "fill-outline-color": "#e32c49",
        }});
        map.addLayer({ id: "noxa-lines", type: "line", source: "noxa-shapes", filter: ["==", ["geometry-type"], "LineString"], paint: {
          "line-color": ["match", ["get", "layer"], "routes", "#e32c49", "tracks", "#f5f5f7", "places", "#70d6ff", "#e32c49"],
          "line-width": ["interpolate", ["linear"], ["zoom"], 5, 2, 10, 4, 15, 6], "line-opacity": .92,
        }});

        const selectRendered = (feature: unknown) => {
          const next = selectedFromRenderedFeature(feature); if (!next) return;
          setSelected(next); setSheetExpanded(true);
        };
        map.on("click", "noxa-clusters", async (event) => {
          setSelected(null); setSheetExpanded(false);
          const cluster = event.features?.[0]; const clusterId = cluster?.properties?.cluster_id;
          const source = map.getSource("noxa-points") as GeoJSONSource | undefined;
          let zoom = Math.min(map.getZoom() + 2, 14);
          if (source && typeof clusterId === "number") {
            try { zoom = Math.min(await source.getClusterExpansionZoom(clusterId), 14); } catch { /* fallback */ }
          }
          map.easeTo({ center: event.lngLat, zoom, duration: 500 });
        });
        for (const layerId of ["noxa-points", "noxa-lines", "noxa-polygons"] as const) {
          map.on("click", layerId, (event) => selectRendered(event.features?.[0]));
          map.on("mouseenter", layerId, () => { map.getCanvas().style.cursor = "pointer"; });
          map.on("mouseleave", layerId, () => { map.getCanvas().style.cursor = ""; });
        }
        map.on("click", (event) => {
          const hits = map.queryRenderedFeatures(event.point, { layers: ["noxa-points", "noxa-lines", "noxa-polygons", "noxa-clusters"] });
          if (hits.length === 0) { setSelected(null); setSheetExpanded(false); }
        });
        map.on("moveend", () => void loadVisibleFeatures(map));
        void loadVisibleFeatures(map);
      });
      map.on("error", (event) => { if (event.error) setError(event.error.message); });
    });
    return () => {
      disposed = true; requestRef.current?.abort(); locationMarkerRef.current?.remove(); mapRef.current?.remove(); mapRef.current = null;
    };
  }, [loadVisibleFeatures]);

  function toggleLayer(layer: MapLayer) {
    setSelected(null); setSheetExpanded(false);
    setActiveLayers((current) => { const next = new Set(current); next.has(layer) ? next.delete(layer) : next.add(layer); return next; });
  }

  function focusFeature(feature: MapApiFeature) {
    const map = mapRef.current; if (!map) return;
    setSelected(selectedFromFeature(feature)); setSheetExpanded(true); setQuery("");
    if (feature.geometry.type === "Point" && Array.isArray(feature.geometry.coordinates)) {
      const [lng, lat] = feature.geometry.coordinates as [number, number];
      map.easeTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 12), duration: 650 }); return;
    }
    const bounds = geometryBounds(feature.geometry);
    if (bounds) map.fitBounds(bounds as LngLatBoundsLike, { padding: 88, maxZoom: 13, duration: 700 });
  }

  async function locateUser() {
    if (!navigator.geolocation || !mapRef.current) { setError(t.locationError); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const center: [number, number] = [position.coords.longitude, position.coords.latitude];
      const map = mapRef.current; if (!map) return;
      const maplibreModule = await import("maplibre-gl"); locationMarkerRef.current?.remove();
      const markerElement = document.createElement("div"); markerElement.className = styles.locationMarker;
      locationMarkerRef.current = new maplibreModule.Marker({ element: markerElement }).setLngLat(center).addTo(map);
      map.flyTo({ center, zoom: Math.max(map.getZoom(), 11.5), duration: 850 }); setLocating(false);
    }, () => { setLocating(false); setError(t.locationError); }, { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 });
  }

  const selectedTitle = selected ? (locale === "el" ? selected.titleEl || selected.title : selected.title) : null;
  const selectedLocation = selected ? (locale === "el" ? selected.locationEl || selected.location : selected.location) : null;
  const selectedDate = selected ? formatEventDate(selected.startsAt, locale) : null;
  const statusText = activeLayers.size === 0 ? t.chooseLayer : loading ? t.loading : error ? error : capped ? t.capped : visibleCount === 0 ? t.empty : `${visibleCount} ${t.visible}`;

  return (
    <div className={styles.page}>
      <DocumentLanguage locale={locale} />
      <a className="skip-link" href="#map-main">{locale === "el" ? "Μετάβαση στον χάρτη" : "Skip to map"}</a>
      <WebsiteHeader locale={locale} path="/map" />
      <main id="map-main" className={styles.main}>
        <div ref={mapContainerRef} className={styles.map} aria-label={locale === "el" ? "Διαδραστικός automotive χάρτης Ελλάδας" : "Interactive automotive map of Greece"} />
        <div className={styles.vignette} aria-hidden="true" />

        <section className={styles.topPanel} aria-label={t.search}>
          <div className={styles.searchRow}>
            <label className={styles.searchBox}>
              <span className={styles.searchIcon} aria-hidden="true" />
              <span className="sr-only">{t.search}</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder={t.searchPlaceholder} autoComplete="off" />
              {query ? <button type="button" onClick={() => setQuery("")} aria-label={t.close}>×</button> : null}
            </label>
            <button type="button" className={styles.locateButton} onClick={locateUser} disabled={locating} aria-label={t.locate}>
              <span className={styles.crosshair} aria-hidden="true" />
            </button>
          </div>

          {query.trim() ? <div className={styles.searchResults} aria-label={t.results}>
            {searchResults.length ? searchResults.map((feature) => <button key={feature.id} type="button" onClick={() => focusFeature(feature)}>
              <span className={`${styles.poiIcon} ${styles[`poiIcon_${feature.properties.layer}`]}`} aria-hidden="true" />
              <span><strong>{localizedTitle(feature, locale)}</strong><small>{localizedLocation(feature, locale) || feature.properties.city || layerLabels[feature.properties.layer]}</small></span>
            </button>) : <p>{t.noResults}</p>}
          </div> : null}

          <div className={styles.layerChips}>
            {MAP_LAYERS.map((layer) => <button key={layer} type="button" className={activeLayers.has(layer) ? styles.layerChipActive : styles.layerChip}
              aria-pressed={activeLayers.has(layer)} onClick={() => toggleLayer(layer)}>
              <span className={`${styles.poiIcon} ${styles[`poiIcon_${layer}`]}`} aria-hidden="true" />{layerLabels[layer]}
            </button>)}
          </div>
        </section>

        <div className={`${styles.statusPill} ${error ? styles.statusError : ""}`} role="status">
          {statusText}{error ? <button type="button" onClick={() => mapRef.current && void loadVisibleFeatures(mapRef.current)}>{t.retry}</button> : null}
        </div>

        <aside className={`${styles.detailSheet} ${sheetExpanded ? styles.detailSheetExpanded : ""}`} aria-label={t.details}>
          <button type="button" className={styles.sheetHandle} aria-expanded={sheetExpanded} onClick={() => setSheetExpanded((value) => !value)}>
            <span className={styles.sheetGrabber} aria-hidden="true" />
            <strong>{selectedTitle || (visibleCount ? `${visibleCount} ${t.visible}` : t.details)}</strong>
            <small>{selected ? layerLabels[selected.layer] : t.explore}</small>
          </button>
          <div className={styles.sheetBody}>
            {selected ? <>
              {selected.coverImageUrl ? <div className={styles.detailImage} style={{ backgroundImage: `url(${selected.coverImageUrl})` }} role="img" aria-label={selectedTitle || selected.title} /> : null}
              <div className={styles.detailMeta}><span>{layerLabels[selected.layer]}</span><span>{selected.featureType.replaceAll("_", " ")}</span></div>
              <h2>{selectedTitle}</h2>
              {selectedDate ? <p className={styles.detailDate}>{selectedDate}</p> : null}
              {selectedLocation || selected.city ? <p className={styles.detailLocation}>{selectedLocation || [selected.city, selected.region].filter(Boolean).join(", ")}</p> : null}
              <div className={styles.detailActions}>
                {selected.href ? <Link href={selected.href}>{t.viewEvent}<span aria-hidden="true">↗</span></Link> : null}
                <a href={selected.sourceUrl} target="_blank" rel="noreferrer">{t.source}<span aria-hidden="true">↗</span></a>
              </div>
            </> : <p className={styles.sheetIntro}>{t.explore}</p>}
          </div>
        </aside>
      </main>
    </div>
  );
}
