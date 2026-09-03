export const dynamic = "force-static";

const VIDEO_ID = "35716927";
const BASE = `https://videos.pexels.com/video-files/${VIDEO_ID}`;

const resolutions = [
  [1080, 1920],
  [720, 1280],
  [540, 960],
  [360, 640],
] as const;

async function probe() {
  const ids = Array.from({ length: 17 }, (_, index) => 15137293 + index);
  const candidates = ids.flatMap((id) =>
    resolutions.map(([width, height]) => ({
      id,
      width,
      height,
      url: `${BASE}/${id}_${width}_${height}_29fps.mp4`,
    })),
  );

  const matches = (
    await Promise.all(
      candidates.map(async (candidate) => {
        try {
          const response = await fetch(candidate.url, {
            headers: { Range: "bytes=0-0" },
            cache: "force-cache",
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
    )
  ).filter(Boolean);

  console.log("NOXA_PEXELS_VARIANTS", JSON.stringify(matches));
  return matches;
}

export default async function PexelsProbePage() {
  const matches = await probe();
  return <pre>{JSON.stringify(matches, null, 2)}</pre>;
}
