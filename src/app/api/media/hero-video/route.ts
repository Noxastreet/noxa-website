const SOURCE_URL =
  "https://videos.pexels.com/video-files/35716927/15137301_2160_3840_29fps.mp4";

export const runtime = "edge";

export async function GET(request: Request) {
  const range = request.headers.get("range");

  const upstream = await fetch(SOURCE_URL, {
    headers: range ? { Range: range } : undefined,
    cache: "no-store",
  });

  if (!upstream.ok && upstream.status !== 206) {
    return new Response("Hero video unavailable", { status: 502 });
  }

  const headers = new Headers();
  headers.set("content-type", upstream.headers.get("content-type") ?? "video/mp4");
  headers.set("accept-ranges", upstream.headers.get("accept-ranges") ?? "bytes");
  headers.set("cache-control", "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000");

  for (const name of ["content-range", "content-length", "etag", "last-modified"]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}
