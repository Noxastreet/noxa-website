import type { Map as MapLibreMap } from "maplibre-gl";

export const NOXA_BASEMAP_STYLE_URL = "https://tiles.openfreemap.org/styles/dark";

const WATER = "#080a0d";
const LAND = "#181b20";
const LAND_SECONDARY = "#1d2126";
const LAND_GREEN = "#1b211f";
const BUILDING = "#24282e";
const ROAD_MAJOR = "#a7abb2";
const ROAD_MEDIUM = "#747981";
const ROAD_MINOR = "#50555d";
const BOUNDARY = "#3d424a";
const LABEL = "#8f949d";
const LABEL_SECONDARY = "#686e78";
const LABEL_HALO = "#0b0d10";

function safeSetPaint(map: MapLibreMap, layerId: string, property: string, value: unknown) {
  try {
    map.setPaintProperty(layerId, property, value);
  } catch {
    // OpenFreeMap can rename or specialize layers over time. Theme only known-compatible layers.
  }
}

function layerName(layer: { id: string; "source-layer"?: string }) {
  return `${layer.id} ${layer["source-layer"] ?? ""}`.toLowerCase();
}

export function applyNoxaBasemapTheme(map: MapLibreMap) {
  const style = map.getStyle();
  for (const layer of style.layers ?? []) {
    const name = layerName(layer as { id: string; "source-layer"?: string });

    if (layer.type === "background") {
      safeSetPaint(map, layer.id, "background-color", WATER);
      continue;
    }

    if (layer.type === "fill") {
      if (/water|ocean|sea|lake|river/.test(name)) {
        safeSetPaint(map, layer.id, "fill-color", WATER);
        safeSetPaint(map, layer.id, "fill-opacity", 1);
      } else if (/building/.test(name)) {
        safeSetPaint(map, layer.id, "fill-color", BUILDING);
        safeSetPaint(map, layer.id, "fill-opacity", 0.72);
      } else if (/park|forest|wood|grass|green|landcover|landuse|natural/.test(name)) {
        safeSetPaint(map, layer.id, "fill-color", LAND_GREEN);
        safeSetPaint(map, layer.id, "fill-opacity", 0.84);
      } else if (/land|earth|place|urban|residential|background-land|landmass/.test(name)) {
        safeSetPaint(map, layer.id, "fill-color", LAND_SECONDARY);
        safeSetPaint(map, layer.id, "fill-opacity", 0.95);
      }
      continue;
    }

    if (layer.type === "line") {
      if (/motorway|trunk|primary|highway/.test(name)) {
        safeSetPaint(map, layer.id, "line-color", ROAD_MAJOR);
        safeSetPaint(map, layer.id, "line-opacity", 0.82);
      } else if (/secondary|tertiary|road|street/.test(name)) {
        safeSetPaint(map, layer.id, "line-color", ROAD_MEDIUM);
        safeSetPaint(map, layer.id, "line-opacity", 0.7);
      } else if (/path|track|service|minor/.test(name)) {
        safeSetPaint(map, layer.id, "line-color", ROAD_MINOR);
        safeSetPaint(map, layer.id, "line-opacity", 0.56);
      } else if (/admin|boundary|border/.test(name)) {
        safeSetPaint(map, layer.id, "line-color", BOUNDARY);
        safeSetPaint(map, layer.id, "line-opacity", 0.68);
      } else if (/water|river|stream/.test(name)) {
        safeSetPaint(map, layer.id, "line-color", "#1a1e24");
      }
      continue;
    }

    if (layer.type === "symbol") {
      if (/country|state|city|town|place|settlement/.test(name)) {
        safeSetPaint(map, layer.id, "text-color", LABEL);
        safeSetPaint(map, layer.id, "text-halo-color", LABEL_HALO);
        safeSetPaint(map, layer.id, "text-halo-width", 1.15);
      } else if (/road|street|poi|label/.test(name)) {
        safeSetPaint(map, layer.id, "text-color", LABEL_SECONDARY);
        safeSetPaint(map, layer.id, "text-halo-color", LABEL_HALO);
        safeSetPaint(map, layer.id, "text-halo-width", 1);
      }
    }
  }

  // Keep the fallback conservative: never recolor an arbitrary first fill layer.
  // LAND is intentionally retained as the canonical base-land token for future style adapters.
  void LAND;
}

export type NoxaPoiLayer = "events" | "tracks" | "routes" | "places";

const POI_COLORS: Record<NoxaPoiLayer, string> = {
  events: "#e32c49",
  tracks: "#f5f5f7",
  routes: "#ff8a3d",
  places: "#70d6ff",
};

function drawFlag(ctx: CanvasRenderingContext2D, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(23, 43);
  ctx.lineTo(23, 20);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(25, 21);
  ctx.lineTo(43, 25);
  ctx.lineTo(25, 31);
  ctx.closePath();
  ctx.fill();
}

function drawRoute(ctx: CanvasRenderingContext2D, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(20, 41);
  ctx.bezierCurveTo(19, 30, 42, 36, 43, 23);
  ctx.stroke();
}

function drawPin(ctx: CanvasRenderingContext2D, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.arc(32, 28, 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(32, 28, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(27, 35);
  ctx.lineTo(32, 43);
  ctx.lineTo(37, 35);
  ctx.stroke();
}

function drawEvent(ctx: CanvasRenderingContext2D, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.arc(32, 32, 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(32, 32, 4, 0, Math.PI * 2);
  ctx.fill();
}

export function createNoxaPoiImage(layer: NoxaPoiLayer): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");

  ctx.fillStyle = "rgba(5, 5, 5, .92)";
  ctx.beginPath();
  ctx.arc(32, 32, 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(32, 32, 21, 0, Math.PI * 2);
  ctx.stroke();

  const color = POI_COLORS[layer];
  if (layer === "tracks") drawFlag(ctx, color);
  else if (layer === "routes") drawRoute(ctx, color);
  else if (layer === "places") drawPin(ctx, color);
  else drawEvent(ctx, color);

  return ctx.getImageData(0, 0, 64, 64);
}
