import type { Map as MapLibreMap } from "maplibre-gl";

export const NOXA_BASEMAP_STYLE_URL = "https://tiles.openfreemap.org/styles/dark";

const LAND = "#181b20";
const WATER = "#0b1016";
const BACKGROUND = "#0d0f12";
const ROAD_MAJOR = "#8f949d";
const ROAD_MINOR = "#454a52";
const LABEL_PRIMARY = "#bfc3ca";
const LABEL_SECONDARY = "#7d828b";
const LABEL_HALO = "rgba(8,9,11,.92)";

function safePaint(map: MapLibreMap, id: string, property: string, value: unknown) {
  try { map.setPaintProperty(id, property, value); } catch { /* style layer does not support this property */ }
}

function safeLayout(map: MapLibreMap, id: string, property: string, value: unknown) {
  try { map.setLayoutProperty(id, property, value); } catch { /* keep upstream style if unsupported */ }
}

export function applyNoxaBasemapTheme(map: MapLibreMap) {
  // Greece is the default viewport, but the Map remains globally navigable.
  map.setMaxBounds(null);

  const style = map.getStyle();
  for (const layer of style.layers ?? []) {
    const id = layer.id;
    const key = id.toLocaleLowerCase();

    if (layer.type === "background") {
      safePaint(map, id, "background-color", BACKGROUND);
      continue;
    }

    if (layer.type === "fill") {
      if (/(water|ocean|sea|river|lake)/.test(key)) {
        safePaint(map, id, "fill-color", WATER);
        safePaint(map, id, "fill-opacity", .98);
      } else if (/(land|landcover|landuse|park|wood|grass|scrub|residential)/.test(key)) {
        safePaint(map, id, "fill-color", LAND);
        safePaint(map, id, "fill-opacity", /(park|wood|grass|scrub)/.test(key) ? .58 : .82);
      } else if (/(building)/.test(key)) {
        safePaint(map, id, "fill-color", "#202329");
        safePaint(map, id, "fill-opacity", .5);
      }
      continue;
    }

    if (layer.type === "line") {
      if (/(motorway|trunk|primary|major|highway)/.test(key)) {
        safePaint(map, id, "line-color", ROAD_MAJOR);
        safePaint(map, id, "line-opacity", .62);
      } else if (/(road|street|secondary|tertiary|minor|service)/.test(key)) {
        safePaint(map, id, "line-color", ROAD_MINOR);
        safePaint(map, id, "line-opacity", .48);
      }
      continue;
    }

    if (layer.type === "symbol") {
      // Automotive data is the main visual layer: suppress low-value POI/transit noise.
      if (/(poi|transit|bus|railway|airport|shop|amenity)/.test(key) && !/(city|place|settlement)/.test(key)) {
        safeLayout(map, id, "visibility", "none");
        continue;
      }

      const isPlace = /(city|town|village|place|settlement|country|state)/.test(key);
      safePaint(map, id, "text-color", isPlace ? LABEL_PRIMARY : LABEL_SECONDARY);
      safePaint(map, id, "text-halo-color", LABEL_HALO);
      safePaint(map, id, "text-halo-width", isPlace ? 1.25 : 1);
      safePaint(map, id, "text-opacity", isPlace ? .9 : .68);
    }
  }
}

export type NoxaPoiLayer = "events" | "tracks" | "routes" | "places";

const POI_COLORS: Record<NoxaPoiLayer, string> = {
  events: "#e32c49",
  tracks: "#f5f5f7",
  routes: "#ff8a3d",
  places: "#70d6ff",
};

function drawTrack(ctx: CanvasRenderingContext2D, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3.4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(20, 39);
  ctx.bezierCurveTo(17, 27, 24, 20, 34, 22);
  ctx.bezierCurveTo(47, 24, 47, 38, 37, 42);
  ctx.bezierCurveTo(31, 45, 25, 43, 20, 39);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(27, 28);
  ctx.lineTo(38, 36);
  ctx.stroke();
}

function drawRoute(ctx: CanvasRenderingContext2D, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(20, 41);
  ctx.bezierCurveTo(19, 30, 42, 36, 43, 23);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(20, 41, 2.7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(43, 23, 2.7, 0, Math.PI * 2); ctx.fill();
}

function drawPin(ctx: CanvasRenderingContext2D, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.arc(32, 28, 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(32, 28, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(27, 35); ctx.lineTo(32, 43); ctx.lineTo(37, 35);
  ctx.stroke();
}

function drawEvent(ctx: CanvasRenderingContext2D, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3.2;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(32, 18); ctx.lineTo(46, 32); ctx.lineTo(32, 46); ctx.lineTo(18, 32); ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(32, 32, 3.7, 0, Math.PI * 2); ctx.fill();
}

export function createNoxaPoiImage(layer: NoxaPoiLayer): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");

  ctx.fillStyle = "rgba(5,5,5,.9)";
  ctx.beginPath(); ctx.arc(32, 32, 21, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.56)";
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(32, 32, 20.5, 0, Math.PI * 2); ctx.stroke();

  const color = POI_COLORS[layer];
  if (layer === "tracks") drawTrack(ctx, color);
  else if (layer === "routes") drawRoute(ctx, color);
  else if (layer === "places") drawPin(ctx, color);
  else drawEvent(ctx, color);

  return ctx.getImageData(0, 0, 64, 64);
}
