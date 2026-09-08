"use client";

import { useEffect, useRef } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";

import { NOXA_BASEMAP_STYLE_URL } from "@/lib/noxaMapTheme";

import styles from "./HomepageMapPreview.module.css";

const THESSALONIKI_CENTER: [number, number] = [22.9444, 40.6401];

export function HomepageMapCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    let disposed = false;
    let observer: IntersectionObserver | null = null;

    const mountMap = async () => {
      if (disposed || mapRef.current || !containerRef.current) return;

      const mapLibreModule = await import("maplibre-gl");
      if (disposed || mapRef.current || !containerRef.current) return;

      const maplibregl = mapLibreModule.default;
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: NOXA_BASEMAP_STYLE_URL,
        center: THESSALONIKI_CENTER,
        zoom: 11.2,
        interactive: false,
        attributionControl: false,
        cooperativeGestures: false,
      });

      mapRef.current = map;
      map.once("load", () => {
        if (!disposed) map.resize();
      });
    };

    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer?.disconnect();
        void mountMap();
      }, { rootMargin: "320px 0px" });
      observer.observe(container);
    } else {
      void mountMap();
    }

    return () => {
      disposed = true;
      observer?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className={styles.realMap} aria-hidden="true" />;
}
