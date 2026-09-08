"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GeoJSONSource, Map as MapLibreMap, Marker as MapLibreMarker } from "maplibre-gl";

import { DocumentLanguage } from "@/components/i18n/DocumentLanguage";
import { WebsiteHeader } from "@/components/navigation/WebsiteHeader";
import { MAP_LAYERS, type MapLayer } from "@/lib/mapViewport";

import styles from "./AutomotiveMap.module.css";

const DARK_STYLE_URL = "https://tiles.openfreemap.org/styles/dark";
const GREECE_CENTER: [number, number] = [22.35, 39.05];
const GREECE_BOUNDS: [[number, number], [number, number]] = [[18.2, 34.4], [30.4, 42.6]];
const EMPTY_COLLECTION = { type: "FeatureCollection" as const, features: [] };

type MapGeometry = {
  type: string;
  coordinates?: unknown;
};

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
  meta: {
    bbox: [number, number, number, number];
    layers: MapLayer[];
    count: number;
    limit: number;
    capped: boolean;
  };
};

type SelectedFeature = MapApiFeature["properties"] & { id: string };

function featureCollection(features: MapApiFeature[]) {
  return { type: "FeatureCollection" as const, features };
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase();
}

function matchesSearch(feature: MapApiFeature, query: string, locale: "en" | "el") {
  const search = normalize(query);
  if (!search) return true;
  const p = feature.properties;
  const localizedTitle = locale === "el" ? p.titleEl || p.title : p.title;
  const localizedLocation = locale === "el" ? p.locationEl || p.location : p.location;
  return normalize([
    localizedTitle,
    p.title,
    p.city,
    p.region,
    localizedLocation,
    p.featureType,
  ].filter(Boolean).join(" ")).includes(search);
}

function readString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function selectedFromRenderedFeature(feature: unknown): SelectedFeature | null {
  if (!feature || typeof feature !== "object") return null;
  const candidate = feature as { id?: string | number; properties?: Record<string, unknown> };
  const properties = candidate.properties;
  const id = candidate.id == null ? null : String(candidate.id);
  const layer = readString(properties?.layer);
  const title = readString(properties?.title);
  const sourceUrl = readString(properties?.sourceUrl);
  if (!id || !layer || !title || !sourceUrl || !(MAP_LAYERS as readonly string[]).includes(layer)) return null;

  return {
    id,
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
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Athens",
  }).format(date);
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

  const t = locale === "el" ? {
    title: "Automotive Map",
    subtitle: "Events, πίστες, διαδρομές και automotive spots σε όλη την Ελλάδα.",
    search: "Αναζήτηση στον χάρτη",
    searchPlaceholder: "Event, πόλη, πίστα ή μέρος",
    layers: "Επίπεδα",
    events: "Events",
    tracks: "Πίστες",
    routes: "Διαδρομές",
    places: "Μέρη",
    loading: "Φόρτωση περιοχής…",
    visible: "ορατά σημεία",
    empty: "Δεν υπάρχουν επαληθευμένα σημεία σε αυτή την περιοχή.",
    details: "Λεπτομέρειες",
    explore: "Μετακίνησε ή κάνε zoom στον χάρτη. Η NOXA φορτώνει μόνο την περιοχή που βλέπεις.",
    viewEvent: "Δες Event",
    source: "Πηγή",
    locate: "Η τοποθεσία μου",
    locationError: "Δεν ήταν δυνατή η πρόσβαση στην τοποθεσία.",
    retry: "Δοκίμασε ξανά",
  } : {
    title: "Automotive Map",
    subtitle: "Events, tracks, routes and automotive spots across Greece.",
    search: "Search the map",
    searchPlaceholder: "Event, city, track or place",
    layers: "Layers",
    events: "Events",
    tracks: "Tracks",
    routes: "Routes",
    places: "Places",
    loading: "Loading this area…",
    visible: "visible objects",
    empty: "No verified objects in this area yet.",
    details: "Details",
    explore: "Move or zoom the map. NOXA loads only the area currently on screen.",
    viewEvent: "View Event",
    source: "Source",
    locate: "My location",
    locationError: "Location access was not available.",
    retry: "Try again",
  };

  const layerLabels: Record<MapLayer, string> = {
    events: t.events,
    tracks: t.tracks,
    routes: t.routes,
    places: t.places,
  };

  const updateMapSources = useCallback((features: MapApiFeature[]) => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;

    const filtered = features.filter((feature) => matchesSearch(feature, queryRef.current, locale));
    const points = filtered.filter((feature) => feature.geometry.type === "Point");
    const shapes = filtered.filter((feature) => feature.geometry.type !== "Point");
    setVisibleCount(filtered.length);

    const pointsSource = map.getSource("noxa-points") as GeoJSONSource | undefined;
    const shapesSource = map.getSource("noxa-shapes") as GeoJSONSource | undefined;
    pointsSource?.setData(featureCollection(points) as Parameters<GeoJSONSource["setData"]>[0]);
    shapesSource?.setData(featureCollection(shapes) as Parameters<GeoJSONSource["setData"]>[0]);
  }, [locale]);

  const loadVisibleFeatures = useCallback(async (map: MapLibreMap) => {
    const layers = MAP_LAYERS.filter((layer) => activeLayersRef.current.has(layer));
    if (layers.length === 0) {
      requestRef.current?.abort();
      allFeaturesRef.current = [];
      updateMapSources([]);
      setLoading(false);
      setError(null);
      return;
    }

    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const bounds = map.getBounds();
    const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()]
      .map((value) => value.toFixed(6))
      .join(",");

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/map/features?bbox=${encodeURIComponent(bbox)}&layers=${encodeURIComponent(layers.join(","))}&limit=300`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(`Map data request failed (${response.status})`);
      const payload = await response.json() as MapApiResponse;
      allFeaturesRef.current = payload.features;
      updateMapSources(payload.features);
    } catch (cause) {
      if (controller.signal.aborted) return;
      setError(cause instanceof Error ? cause.message : "Map data request failed");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [updateMapSources]);

  useEffect(() => {
    queryRef.current = query;
    updateMapSources(allFeaturesRef.current);
  }, [query, updateMapSources]);

  useEffect(() => {
    activeLayersRef.current = activeLayers;
    const map = mapRef.current;
    if (map?.loaded()) void loadVisibleFeatures(map);
  }, [activeLayers, loadVisibleFeatures]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    let disposed = false;

    void import("maplibre-gl").then((module) => {
      if (disposed || !mapContainerRef.current) return;
      const maplibregl = module.default;
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: DARK_STYLE_URL,
        center: GREECE_CENTER,
        zoom: 5.35,
        minZoom: 4.6,
        maxZoom: 18,
        maxBounds: GREECE_BOUNDS,
        attributionControl: false,
        cooperativeGestures: true,
      });
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }), "bottom-right");
      map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

      map.on("load", () => {
        map.addSource("noxa-points", {
          type: "geojson",
          data: EMPTY_COLLECTION,
          cluster: true,
          clusterMaxZoom: 13,
          clusterRadius: 48,
        });
        map.addSource("noxa-shapes", { type: "geojson", data: EMPTY_COLLECTION });

        map.addLayer({
          id: "noxa-clusters",
          type: "circle",
          source: "noxa-points",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": "#c8102e",
            "circle-radius": ["step", ["get", "point_count"], 18, 10, 22, 40, 28],
            "circle-stroke-width": 2,
            "circle-stroke-color": "rgba(255,255,255,.78)",
            "circle-opacity": 0.92,
          },
        });
        map.addLayer({
          id: "noxa-cluster-count",
          type: "symbol",
          source: "noxa-points",
          filter: ["has", "point_count"],
          layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 12 },
          paint: { "text-color": "#ffffff" },
        });
        map.addLayer({
          id: "noxa-points",
          type: "circle",
          source: "noxa-points",
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": ["match", ["get", "layer"], "events", "#e32c49", "tracks", "#f5f5f7", "routes", "#ff8a3d", "places", "#70d6ff", "#e32c49"],
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 5.5, 10, 8, 15, 11],
            "circle-stroke-width": 2,
            "circle-stroke-color": "#050505",
            "circle-opacity": 0.96,
          },
        });
        map.addLayer({
          id: "noxa-polygons",
          type: "fill",
          source: "noxa-shapes",
          filter: ["==", ["geometry-type"], "Polygon"],
          paint: {
            "fill-color": ["match", ["get", "layer"], "tracks", "#f5f5f7", "places", "#70d6ff", "#e32c49"],
            "fill-opacity": 0.16,
            "fill-outline-color": "#e32c49",
          },
        });
        map.addLayer({
          id: "noxa-lines",
          type: "line",
          source: "noxa-shapes",
          filter: ["==", ["geometry-type"], "LineString"],
          paint: {
            "line-color": ["match", ["get", "layer"], "routes", "#e32c49", "tracks", "#f5f5f7", "places", "#70d6ff", "#e32c49"],
            "line-width": ["interpolate", ["linear"], ["zoom"], 5, 2, 10, 4, 15, 6],
            "line-opacity": 0.9,
          },
        });

        const selectFeature = (feature: unknown) => {
          const next = selectedFromRenderedFeature(feature);
          if (!next) return;
          setSelected(next);
          setSheetExpanded(true);
        };

        map.on("click", "noxa-clusters", (event) => {
          map.easeTo({ center: event.lngLat, zoom: Math.min(map.getZoom() + 2, 14), duration: 550 });
        });
        for (const layerId of ["noxa-points", "noxa-lines", "noxa-polygons"] as const) {
          map.on("click", layerId, (event) => selectFeature(event.features?.[0]));
          map.on("mouseenter", layerId, () => { map.getCanvas().style.cursor = "pointer"; });
          map.on("mouseleave", layerId, () => { map.getCanvas().style.cursor = ""; });
        }
        map.on("mouseenter", "noxa-clusters", () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", "noxa-clusters", () => { map.getCanvas().style.cursor = ""; });
        map.on("moveend", () => void loadVisibleFeatures(map));
        void loadVisibleFeatures(map);
      });

      map.on("error", (event) => {
        if (event.error) setError(event.error.message);
      });
    });

    return () => {
      disposed = true;
      requestRef.current?.abort();
      locationMarkerRef.current?.remove();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [loadVisibleFeatures]);

  function toggleLayer(layer: MapLayer) {
    setSelected(null);
    setActiveLayers((current) => {
      const next = new Set(current);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return next;
    });
  }

  async function locateUser() {
    if (!navigator.geolocation || !mapRef.current) {
      setError(t.locationError);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const center: [number, number] = [position.coords.longitude, position.coords.latitude];
      const map = mapRef.current;
      if (!map) return;
      const maplibreModule = await import("maplibre-gl");
      locationMarkerRef.current?.remove();
      const markerElement = document.createElement("div");
      markerElement.className = styles.locationMarker;
      locationMarkerRef.current = new maplibreModule.default.Marker({ element: markerElement })
        .setLngLat(center)
        .addTo(map);
      map.flyTo({ center, zoom: Math.max(map.getZoom(), 11.5), duration: 900 });
      setLocating(false);
    }, () => {
      setLocating(false);
      setError(t.locationError);
    }, { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 });
  }

  const selectedTitle = selected ? (locale === "el" ? selected.titleEl || selected.title : selected.title) : null;
  const selectedLocation = selected ? (locale === "el" ? selected.locationEl || selected.location : selected.location) : null;
  const selectedDate = selected ? formatEventDate(selected.startsAt, locale) : null;

  return (
    <div className={styles.page}>
      <DocumentLanguage locale={locale} />
      <a className="skip-link" href="#map-main">{locale === "el" ? "Μετάβαση στον χάρτη" : "Skip to map"}</a>
      <WebsiteHeader locale={locale} path="/map" />

      <main id="map-main" className={styles.main}>
        <div ref={mapContainerRef} className={styles.map} aria-label={locale === "el" ? "Διαδραστικός automotive χάρτης Ελλάδας" : "Interactive automotive map of Greece"} />
        <div className={styles.vignette} aria-hidden="true" />

        <section className={styles.topPanel} aria-label={t.search}>
          <div className={styles.brandRow}>
            <div>
              <p className={styles.eyebrow}>NOXA MAP</p>
              <h1>{t.title}</h1>
              <p className={styles.subtitle}>{t.subtitle}</p>
            </div>
            <button type="button" className={styles.locateButton} onClick={locateUser} disabled={locating} aria-label={t.locate}>
              <span aria-hidden="true">⌖</span>
              <span>{locating ? "…" : t.locate}</span>
            </button>
          </div>

          <label className={styles.searchBox}>
            <span className="sr-only">{t.search}</span>
            <span aria-hidden="true">⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder={t.searchPlaceholder} />
            {query ? <button type="button" onClick={() => setQuery("")} aria-label={locale === "el" ? "Καθαρισμός" : "Clear search"}>×</button> : null}
          </label>

          <div className={styles.layerSection}>
            <span className={styles.layerLabel}>{t.layers}</span>
            <div className={styles.layerChips}>
              {MAP_LAYERS.map((layer) => (
                <button
                  key={layer}
                  type="button"
                  className={activeLayers.has(layer) ? styles.layerChipActive : styles.layerChip}
                  aria-pressed={activeLayers.has(layer)}
                  onClick={() => toggleLayer(layer)}
                >
                  <span className={`${styles.layerDot} ${styles[`layerDot_${layer}`]}`} aria-hidden="true" />
                  {layerLabels[layer]}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className={`${styles.statusPill} ${error ? styles.statusError : ""}`} role="status">
          {loading ? t.loading : error ? error : visibleCount === 0 ? t.empty : `${visibleCount} ${t.visible}`}
          {error ? <button type="button" onClick={() => mapRef.current && void loadVisibleFeatures(mapRef.current)}>{t.retry}</button> : null}
        </div>

        <aside className={`${styles.detailSheet} ${sheetExpanded ? styles.detailSheetExpanded : ""}`} aria-label={t.details}>
          <button type="button" className={styles.sheetHandle} aria-expanded={sheetExpanded} onClick={() => setSheetExpanded((value) => !value)}>
            <span aria-hidden="true" />
            <strong>{selectedTitle || t.details}</strong>
            <small>{selected ? layerLabels[selected.layer] : `${visibleCount} ${t.visible}`}</small>
          </button>

          <div className={styles.sheetBody}>
            {selected ? (
              <>
                <div className={styles.detailMeta}>
                  <span>{layerLabels[selected.layer]}</span>
                  <span>{selected.featureType.replaceAll("_", " ")}</span>
                </div>
                <h2>{selectedTitle}</h2>
                {selectedDate ? <p className={styles.detailDate}>{selectedDate}</p> : null}
                {selectedLocation || selected.city ? <p className={styles.detailLocation}>⌖ {selectedLocation || [selected.city, selected.region].filter(Boolean).join(", ")}</p> : null}
                <div className={styles.detailActions}>
                  {selected.href ? <Link href={selected.href}>{t.viewEvent}<span aria-hidden="true">↗</span></Link> : null}
                  <a href={selected.sourceUrl} target="_blank" rel="noreferrer">{t.source}<span aria-hidden="true">↗</span></a>
                </div>
              </>
            ) : (
              <>
                <p className={styles.sheetIntro}>{t.explore}</p>
                <div className={styles.legend}>
                  {MAP_LAYERS.map((layer) => <span key={layer}><i className={`${styles.layerDot} ${styles[`layerDot_${layer}`]}`} />{layerLabels[layer]}</span>)}
                </div>
              </>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
