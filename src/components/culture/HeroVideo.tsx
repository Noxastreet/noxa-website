"use client";

import { useEffect, useRef } from "react";

const HERO_POSTER_URL =
  "/_next/image?url=https%3A%2F%2Fimages.pexels.com%2Fphotos%2F17716197%2Fpexels-photo-17716197.jpeg%3Fauto%3Dcompress%26cs%3Dtinysrgb%26w%3D1600&w=1200&q=75";

type Props = {
  canvasClassName?: string;
  className?: string;
  src: string;
};

export function HeroVideo({ canvasClassName, className, src }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let gestureRetryArmed = false;

    const configureVideo = () => {
      video.muted = true;
      video.defaultMuted = true;
      video.autoplay = true;
      video.loop = true;
      video.playsInline = true;
      video.setAttribute("muted", "");
      video.setAttribute("autoplay", "");
      video.setAttribute("loop", "");
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
    };

    const disarmGestureRetry = () => {
      if (!gestureRetryArmed) return;
      gestureRetryArmed = false;
      document.removeEventListener("pointerdown", retryAfterGesture);
      document.removeEventListener("touchstart", retryAfterGesture);
    };

    const armGestureRetry = () => {
      if (gestureRetryArmed) return;
      gestureRetryArmed = true;
      document.addEventListener("pointerdown", retryAfterGesture, { passive: true });
      document.addEventListener("touchstart", retryAfterGesture, { passive: true });
    };

    const tryPlay = async () => {
      if (document.visibilityState !== "visible") return;

      configureVideo();

      try {
        await video.play();
        disarmGestureRetry();
      } catch {
        armGestureRetry();
      }
    };

    function retryAfterGesture() {
      void tryPlay();
    }

    const retryVisible = () => {
      if (document.visibilityState === "visible") void tryPlay();
    };

    const retryIfPaused = () => {
      if (!video.ended && video.paused && document.visibilityState === "visible") {
        void tryPlay();
      }
    };

    configureVideo();
    if (video.readyState === HTMLMediaElement.HAVE_NOTHING) video.load();
    void tryPlay();

    video.addEventListener("loadedmetadata", retryVisible);
    video.addEventListener("loadeddata", retryVisible);
    video.addEventListener("canplay", retryVisible);
    video.addEventListener("pause", retryIfPaused);
    window.addEventListener("pageshow", retryVisible);
    window.addEventListener("focus", retryVisible);
    window.addEventListener("online", retryVisible);
    document.addEventListener("visibilitychange", retryVisible);

    const retryTimer = window.setTimeout(() => void tryPlay(), 1200);

    return () => {
      window.clearTimeout(retryTimer);
      disarmGestureRetry();
      video.removeEventListener("loadedmetadata", retryVisible);
      video.removeEventListener("loadeddata", retryVisible);
      video.removeEventListener("canplay", retryVisible);
      video.removeEventListener("pause", retryIfPaused);
      window.removeEventListener("pageshow", retryVisible);
      window.removeEventListener("focus", retryVisible);
      window.removeEventListener("online", retryVisible);
      document.removeEventListener("visibilitychange", retryVisible);
    };
  }, [src]);

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        className={className}
        controls={false}
        disablePictureInPicture
        disableRemotePlayback
        loop
        muted
        playsInline
        poster={HERO_POSTER_URL}
        preload="auto"
        src={src}
        tabIndex={-1}
      />
      {canvasClassName ? <canvas className={canvasClassName} aria-hidden="true" /> : null}
    </>
  );
}
