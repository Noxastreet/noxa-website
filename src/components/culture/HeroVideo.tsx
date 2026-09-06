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
    const currentVideo = videoRef.current;
    if (!currentVideo) return;
    const video: HTMLVideoElement = currentVideo;

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

    function retryAfterGesture() {
      void tryPlay();
    }

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

    async function tryPlay() {
      if (document.visibilityState !== "visible") return;
      configureVideo();

      try {
        await video.play();
        disarmGestureRetry();
      } catch {
        armGestureRetry();
      }
    }

    const retryVisible = () => {
      if (document.visibilityState === "visible") void tryPlay();
    };

    configureVideo();
    void tryPlay();

    video.addEventListener("canplay", retryVisible);
    video.addEventListener("pause", retryVisible);
    window.addEventListener("pageshow", retryVisible);
    window.addEventListener("focus", retryVisible);
    window.addEventListener("online", retryVisible);
    document.addEventListener("visibilitychange", retryVisible);

    return () => {
      disarmGestureRetry();
      video.removeEventListener("canplay", retryVisible);
      video.removeEventListener("pause", retryVisible);
      window.removeEventListener("pageshow", retryVisible);
      window.removeEventListener("focus", retryVisible);
      window.removeEventListener("online", retryVisible);
      document.removeEventListener("visibilitychange", retryVisible);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      className={className}
      src={src}
      autoPlay
      controls={false}
      disablePictureInPicture
      disableRemotePlayback
      loop
      muted
      playsInline
      preload="auto"
      tabIndex={-1}
    />
  );
}
