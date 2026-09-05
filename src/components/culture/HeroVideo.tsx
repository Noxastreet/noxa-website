"use client";

import { useEffect, useRef } from "react";

type Props = {
  className?: string;
  poster: string;
  src: string;
};

export function HeroVideo({ className, poster, src }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const desktopMedia = window.matchMedia("(min-width: 821px)");
    if (!desktopMedia.matches) {
      video.pause();
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let needsGesture = reducedMotion;

    const tryPlay = async (allowReducedMotion = false) => {
      if (!desktopMedia.matches || document.visibilityState !== "visible") return;
      if (reducedMotion && !allowReducedMotion) return;

      video.muted = true;
      video.defaultMuted = true;
      video.setAttribute("muted", "");
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");

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
    const handleViewportChange = () => {
      if (desktopMedia.matches) void tryPlay();
      else video.pause();
    };

    if (!reducedMotion) void tryPlay();

    video.addEventListener("loadeddata", retryReady);
    video.addEventListener("canplay", retryReady);
    window.addEventListener("pageshow", retryVisible);
    window.addEventListener("focus", retryVisible);
    document.addEventListener("visibilitychange", retryVisible);
    document.addEventListener("pointerdown", retryAfterGesture, { passive: true });
    document.addEventListener("touchstart", retryAfterGesture, { passive: true });
    desktopMedia.addEventListener("change", handleViewportChange);

    return () => {
      video.removeEventListener("loadeddata", retryReady);
      video.removeEventListener("canplay", retryReady);
      window.removeEventListener("pageshow", retryVisible);
      window.removeEventListener("focus", retryVisible);
      document.removeEventListener("visibilitychange", retryVisible);
      document.removeEventListener("pointerdown", retryAfterGesture);
      document.removeEventListener("touchstart", retryAfterGesture);
      desktopMedia.removeEventListener("change", handleViewportChange);
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
      poster={poster}
      preload="metadata"
      tabIndex={-1}
    >
      <source media="(min-width: 821px)" src={src} type="video/mp4" />
    </video>
  );
}
