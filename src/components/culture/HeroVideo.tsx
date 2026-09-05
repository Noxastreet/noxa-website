"use client";

import { useEffect, useRef } from "react";

type Props = {
  className?: string;
  poster: string;
  src: string;
};

export function HeroVideo({ className, poster, src }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const effectivePoster = poster.includes("images.pexels.com")
    ? "/api/media/culture-image?asset=hero"
    : poster;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let needsGesture = false;

    const tryPlay = async (allowReducedMotion = false) => {
      if (document.visibilityState !== "visible") return;
      if (reducedMotion && !allowReducedMotion) return;

      video.muted = true;
      video.defaultMuted = true;

      try {
        await video.play();
        needsGesture = false;
      } catch {
        needsGesture = true;
      }
    };

    const retryVisible = () => {
      if (document.visibilityState === "visible") void tryPlay();
    };
    const retryReady = () => void tryPlay();
    const retryAfterGesture = () => {
      if (needsGesture) void tryPlay(true);
    };

    if (!reducedMotion) void tryPlay();

    video.addEventListener("loadeddata", retryReady);
    video.addEventListener("canplay", retryReady);
    window.addEventListener("pageshow", retryVisible);
    document.addEventListener("visibilitychange", retryVisible);
    document.addEventListener("pointerdown", retryAfterGesture, { passive: true });
    document.addEventListener("touchstart", retryAfterGesture, { passive: true });

    return () => {
      video.removeEventListener("loadeddata", retryReady);
      video.removeEventListener("canplay", retryReady);
      window.removeEventListener("pageshow", retryVisible);
      document.removeEventListener("visibilitychange", retryVisible);
      document.removeEventListener("pointerdown", retryAfterGesture);
      document.removeEventListener("touchstart", retryAfterGesture);
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      autoPlay
      className={className}
      disablePictureInPicture
      loop
      muted
      playsInline
      poster={effectivePoster}
      preload="auto"
      src={src}
      tabIndex={-1}
    />
  );
}
