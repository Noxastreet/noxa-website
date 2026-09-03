const VIDEO_ID = "35716927";
const BASE = `https://videos.pexels.com/video-files/${VIDEO_ID}`;

export const runtime = "edge";

const resolutions = [
  [720, 1280],
  [1080, 1920],
  [540, 960],
  [360, 640],
] as const;

const fpsValues = [29, 30, 25] as const;

export async function GET() {
  const ids = Array.from({ length: 25 }, (_, index) => 15137289 + index);
  const candidates = ids.flatMap((id) =>
    resolutions.flatMap(([width, height]) =>
      fpsValues.map((fps) => ({
        id,
        width,
        height,
        fps,
        url: `${BASE}/${id}_${width}_${height}_${fps}fps.mp4`,
      })),
    ),
  );

  const results = await Promise.all(
    candidates.map(async (candidate) => {
      try {
        const response = await fetch(candidate.url, {
          method: "GET",
          headers: { Range: "bytes=0-0" },
          cache: "no-store",
        });
        if (response.status !== 200 && response.status !== 206) return null;
        const contentType = response.headers.get("content-type") ?? "";
        if (!contentType.includes("video")) return null;
        return {
          ...candidate,
          status: response.status,
          contentType,
          contentRange: response.headers.get("content-range"),
          contentLength: response.headers.get("content-length"),
        };
      } catch {
        return null;
      }
    }),
  );

  return Response.json({ matches: results.filter(Boolean) });
}
