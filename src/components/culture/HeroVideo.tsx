"use client";

import { useEffect, useRef } from "react";

type Props = {
  className?: string;
  src: string;
};

export function HeroVideo({ className, src }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const mobileMedia = window.matchMedia("(max-width: 820px)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let needsGesture = reducedMotion;
    let mobileLoadTimer: number | undefined;

    const markReady = () => {
      video.dataset.ready = "true";
    };

    const tryPlay = async (allowReducedMotion = false) => {
      if (document.visibilityState !== "visible") return;
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

    const loadMobileVideo = () => {
      if (!mobileMedia.matches || reducedMotion) return;

      if (video.getAttribute("src") !== src) {
        video.src = src;
        video.load();
      }

      void tryPlay();
    };

    const scheduleMobileLoad = () => {
      if (mobileLoadTimer !== undefined) window.clearTimeout(mobileLoadTimer);
      mobileLoadTimer = window.setTimeout(loadMobileVideo, 700);
    };

    const retryVisible = () => {
      if (document.visibilityState === "visible") void tryPlay();
    };
    const retryReady = () => {
      markReady();
      void tryPlay();
    };
    const retryAfterGesture = () => {
      if (needsGesture) void tryPlay(true);
    };
    const handleViewportChange = () => {
      if (mobileMedia.matches) {
        scheduleMobileLoad();
      } else {
        if (mobileLoadTimer !== undefined) window.clearTimeout(mobileLoadTimer);
        void tryPlay();
      }
    };

    if (mobileMedia.matches) {
      scheduleMobileLoad();
    } else if (!reducedMotion) {
      void tryPlay();
    }

    video.addEventListener("loadeddata", retryReady);
    video.addEventListener("canplay", retryReady);
    window.addEventListener("pageshow", retryVisible);
    window.addEventListener("focus", retryVisible);
    document.addEventListener("visibilitychange", retryVisible);
    document.addEventListener("pointerdown", retryAfterGesture, { passive: true });
    document.addEventListener("touchstart", retryAfterGesture, { passive: true });
    mobileMedia.addEventListener("change", handleViewportChange);

    return () => {
      if (mobileLoadTimer !== undefined) window.clearTimeout(mobileLoadTimer);
      video.removeEventListener("loadeddata", retryReady);
      video.removeEventListener("canplay", retryReady);
      window.removeEventListener("pageshow", retryVisible);
      window.removeEventListener("focus", retryVisible);
      document.removeEventListener("visibilitychange", retryVisible);
      document.removeEventListener("pointerdown", retryAfterGesture);
      document.removeEventListener("touchstart", retryAfterGesture);
      mobileMedia.removeEventListener("change", handleViewportChange);
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
      tabIndex={-1}
    >
      <source media="(min-width: 821px)" src={src} type="video/mp4" />
    </video>
  );
}
