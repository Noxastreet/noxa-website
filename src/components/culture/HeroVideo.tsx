"use client";

import { useEffect, useRef } from "react";

type Props = {
  canvasClassName?: string;
  className?: string;
  src: string;
};

export function HeroVideo({ className, src }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let needsGesture = false;

    const tryPlay = async () => {
      if (reducedMotion.matches || document.visibilityState !== "visible") return;

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

    const retryReady = () => void tryPlay();
    const retryVisible = () => {
      if (document.visibilityState === "visible") void tryPlay();
      else video.pause();
    };
    const retryAfterGesture = () => {
      if (needsGesture) void tryPlay();
    };
    const handleMotionPreference = () => {
      if (reducedMotion.matches) {
        video.pause();
        needsGesture = false;
      } else {
        void tryPlay();
      }
    };

    void tryPlay();

    video.addEventListener("loadeddata", retryReady);
    video.addEventListener("canplay", retryReady);
    window.addEventListener("pageshow", retryVisible);
    window.addEventListener("focus", retryVisible);
    document.addEventListener("visibilitychange", retryVisible);
    document.addEventListener("pointerdown", retryAfterGesture, { passive: true });
    document.addEventListener("touchstart", retryAfterGesture, { passive: true });
    reducedMotion.addEventListener("change", handleMotionPreference);

    return () => {
      video.removeEventListener("loadeddata", retryReady);
      video.removeEventListener("canplay", retryReady);
      window.removeEventListener("pageshow", retryVisible);
      window.removeEventListener("focus", retryVisible);
      document.removeEventListener("visibilitychange", retryVisible);
      document.removeEventListener("pointerdown", retryAfterGesture);
      document.removeEventListener("touchstart", retryAfterGesture);
      reducedMotion.removeEventListener("change", handleMotionPreference);
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
      preload="metadata"
      src={src}
      tabIndex={-1}
    />
  );
}
