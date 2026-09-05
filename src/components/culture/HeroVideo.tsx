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

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let needsGesture = reducedMotion;

    const prepareVideo = () => {
      video.muted = true;
      video.defaultMuted = true;
      video.setAttribute("muted", "");
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
    };

    const tryPlay = () => {
      if (document.visibilityState !== "visible" || reducedMotion) return;
      prepareVideo();
      void video.play().then(() => {
        needsGesture = false;
      }).catch(() => {
        needsGesture = true;
      });
    };

    const retryAfterGesture = () => {
      if (!needsGesture) return;
      prepareVideo();
      void video.play().then(() => {
        needsGesture = false;
      }).catch(() => {
        // Keep the poster visible if Safari still refuses playback.
      });
    };

    prepareVideo();
    video.load();
    tryPlay();

    window.addEventListener("pageshow", tryPlay);
    window.addEventListener("focus", tryPlay);
    document.addEventListener("visibilitychange", tryPlay);
    document.addEventListener("pointerdown", retryAfterGesture, { passive: true });
    document.addEventListener("touchstart", retryAfterGesture, { passive: true });

    return () => {
      window.removeEventListener("pageshow", tryPlay);
      window.removeEventListener("focus", tryPlay);
      document.removeEventListener("visibilitychange", tryPlay);
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
      poster={poster}
      preload="auto"
      tabIndex={-1}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
