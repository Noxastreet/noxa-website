import type { Map as MapLibreMap } from "maplibre-gl";

export const NOXA_BASEMAP_STYLE_URL = "https://tiles.openfreemap.org/styles/dark";

// Keep the basemap intentionally simple: use the stock OpenFreeMap dark style
// without repainting its roads, land, borders or labels. NOXA styling is limited
// to our own POIs rendered above the basemap.
const LAND = "#181b20";
const ROAD_MAJOR = "#a7abb2";

export function applyNoxaBasemapTheme(_map: MapLibreMap) {
  // Intentionally no-op. The previous runtime recoloring made administrative
  // boundaries and road layers visually noisy on mobile. Stock dark is clearer.
  void _map;
  void LAND;
  void ROAD_MAJOR;
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
