"use client";

import { useEffect, useRef, useState } from "react";

const POSTER =
  "https://images.pexels.com/videos/35716927/4k-cars-blue-car-car-aesthetics-car-show-35716927.jpeg?auto=compress&dpr=1&h=750&w=1260";
const VIDEO = "/media/noxa-hero-720p.mp4";

export default function HeroTestPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const update = () => {
      if (video.error) {
        setStatus(`error ${video.error.code}`);
        return;
      }
      if (!video.paused && video.currentTime > 0) {
        setStatus("playing");
        return;
      }
      if (video.readyState >= 2) {
        setStatus("ready · paused");
        return;
      }
      setStatus("loading");
    };

    const events = ["loadedmetadata", "loadeddata", "canplay", "playing", "pause", "timeupdate", "error"] as const;
    events.forEach((event) => video.addEventListener(event, update));
    update();

    return () => events.forEach((event) => video.removeEventListener(event, update));
  }, []);

  const play = async () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    try {
      await video.play();
      setStatus("playing");
    } catch (error) {
      setStatus(`play failed${error instanceof Error ? ` · ${error.name}` : ""}`);
    }
  };

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "#050505",
        color: "#f5f5f7",
        padding: "24px",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <p style={{ color: "#e32c49", fontWeight: 800, letterSpacing: "0.16em" }}>P2 HERO TEST · LOCAL H.264</p>
      <h1 style={{ margin: "12px 0 8px", fontSize: "32px" }}>Selected NOXA Hero</h1>
      <p style={{ color: "#a1a1a6", marginBottom: "18px" }}>Status: {status}</p>

      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        poster={POSTER}
        preload="auto"
        src={VIDEO}
        style={{
          display: "block",
          width: "100%",
          maxWidth: "720px",
          aspectRatio: "9 / 16",
          objectFit: "cover",
          borderRadius: "20px",
          background: "#111114",
        }}
      />

      <button
        onClick={play}
        type="button"
        style={{
          marginTop: "18px",
          minHeight: "52px",
          width: "100%",
          maxWidth: "720px",
          border: 0,
          borderRadius: "14px",
          background: "#c8102e",
          color: "white",
          fontSize: "18px",
          fontWeight: 800,
        }}
      >
        Play local video
      </button>

      <p style={{ color: "#a1a1a6", marginTop: "18px", lineHeight: 1.5 }}>
        Expected: H.264 High · yuv420p · 720×1280 · 9 sec · faststart · no audio.
      </p>
    </main>
  );
}
