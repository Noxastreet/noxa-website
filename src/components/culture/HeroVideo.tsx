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

    const tryPlay = () => {
      if (document.visibilityState !== "visible") return;
      video.muted = true;
      void video.play().catch(() => {
        // Keep the poster/background fallback if autoplay is blocked by the browser.
      });
    };

    tryPlay();
    window.addEventListener("pageshow", tryPlay);
    document.addEventListener("visibilitychange", tryPlay);

    return () => {
      window.removeEventListener("pageshow", tryPlay);
      document.removeEventListener("visibilitychange", tryPlay);
    };
  }, []);

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
