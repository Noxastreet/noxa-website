"use client";

import { useEffect, type RefObject } from "react";

export type HeroVideoPlaybackState = "loading" | "playing" | "blocked" | "error";

type Props = {
  className?: string;
  src: string;
  poster?: string;
  videoRef: RefObject<HTMLVideoElement | null>;
  onPlaybackStateChange: (state: HeroVideoPlaybackState) => void;
};

export function HeroVideo({
  className,
  src,
  poster,
  videoRef,
  onPlaybackStateChange,
}: Props) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let disposed = false;
    let gestureRetryArmed = false;

    const report = (state: HeroVideoPlaybackState) => {
      if (!disposed) onPlaybackStateChange(state);
    };

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
      if (video.error) {
        report("error");
        return;
      }

      configureVideo();

      try {
        await video.play();
        report("playing");
        disarmGestureRetry();
      } catch (error) {
        if (video.error || (error instanceof DOMException && error.name === "NotSupportedError")) {
          report("error");
          return;
        }

        report("blocked");
        armGestureRetry();
      }
    }

    const handlePlaying = () => {
      report("playing");
      disarmGestureRetry();
    };
    const handleError = () => report("error");
    const retryVisible = () => {
      if (document.visibilityState === "visible" && video.paused) void tryPlay();
    };

    // Low Power Mode and some mobile browsers block muted autoplay.
    // Show a visible manual-play action rather than leaving a black hero.
    const loadingTimeout = window.setTimeout(() => {
      if (!video.error && video.paused) report("blocked");
    }, 5000);

    configureVideo();
    void tryPlay();

    video.addEventListener("playing", handlePlaying);
    video.addEventListener("error", handleError);
    video.addEventListener("canplay", retryVisible);
    video.addEventListener("pause", retryVisible);
    window.addEventListener("pageshow", retryVisible);
    window.addEventListener("focus", retryVisible);
    window.addEventListener("online", retryVisible);
    document.addEventListener("visibilitychange", retryVisible);

    return () => {
      disposed = true;
      window.clearTimeout(loadingTimeout);
      disarmGestureRetry();
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("error", handleError);
      video.removeEventListener("canplay", retryVisible);
      video.removeEventListener("pause", retryVisible);
      window.removeEventListener("pageshow", retryVisible);
      window.removeEventListener("focus", retryVisible);
      window.removeEventListener("online", retryVisible);
      document.removeEventListener("visibilitychange", retryVisible);
    };
  }, [src, videoRef, onPlaybackStateChange]);

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
      poster={poster}
      tabIndex={-1}
    />
  );
}
