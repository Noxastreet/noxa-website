"use client";

import { useEffect, useRef } from "react";

type Props = {
  canvasClassName?: string;
  className?: string;
  src: string;
};

type VideoWithFrameCallback = HTMLVideoElement & {
  requestVideoFrameCallback?: (callback: (now: DOMHighResTimeStamp) => void) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
};

export function HeroVideo({ canvasClassName, className, src }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const video = videoRef.current as VideoWithFrameCallback | null;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const mobileMedia = window.matchMedia("(max-width: 820px)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let needsGesture = false;
    let videoFrameHandle: number | undefined;
    let animationFrameHandle: number | undefined;

    const drawMobileFrame = () => {
      if (!mobileMedia.matches || reducedMotion.matches || video.readyState < 2 || !video.videoWidth || !video.videoHeight) return;

      const width = Math.max(1, Math.round(canvas.clientWidth));
      const height = Math.max(1, Math.round(canvas.clientHeight));
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;

      const context = canvas.getContext("2d", { alpha: false });
      if (!context) return;

      const scale = Math.max(width / video.videoWidth, height / video.videoHeight);
      const sourceWidth = width / scale;
      const sourceHeight = height / scale;
      const sourceX = (video.videoWidth - sourceWidth) / 2;
      const sourceY = (video.videoHeight - sourceHeight) / 2;

      context.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
      canvas.dataset.ready = "true";
    };

    const stopMobileRenderer = () => {
      if (videoFrameHandle !== undefined && video.cancelVideoFrameCallback) {
        video.cancelVideoFrameCallback(videoFrameHandle);
      }
      if (animationFrameHandle !== undefined) {
        window.cancelAnimationFrame(animationFrameHandle);
      }
      videoFrameHandle = undefined;
      animationFrameHandle = undefined;
    };

    const scheduleMobileFrame = () => {
      if (!mobileMedia.matches || reducedMotion.matches || video.paused || video.ended) return;

      if (video.requestVideoFrameCallback) {
        videoFrameHandle = video.requestVideoFrameCallback(() => {
          videoFrameHandle = undefined;
          drawMobileFrame();
          scheduleMobileFrame();
        });
      } else {
        animationFrameHandle = window.requestAnimationFrame(() => {
          animationFrameHandle = undefined;
          drawMobileFrame();
          scheduleMobileFrame();
        });
      }
    };

    const startMobileRenderer = () => {
      if (!mobileMedia.matches || reducedMotion.matches) return;
      drawMobileFrame();
      if (videoFrameHandle === undefined && animationFrameHandle === undefined) scheduleMobileFrame();
    };

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
        startMobileRenderer();
      } catch {
        needsGesture = true;
      }
    };

    const retryReady = () => {
      drawMobileFrame();
      void tryPlay();
    };
    const retryVisible = () => {
      if (document.visibilityState === "visible") void tryPlay();
      else {
        stopMobileRenderer();
        video.pause();
      }
    };
    const retryAfterGesture = () => {
      if (needsGesture) void tryPlay();
    };
    const handleViewportChange = () => {
      stopMobileRenderer();
      canvas.removeAttribute("data-ready");
      void tryPlay();
    };
    const handleMotionPreference = () => {
      stopMobileRenderer();
      canvas.removeAttribute("data-ready");
      if (reducedMotion.matches) {
        video.pause();
        needsGesture = false;
      } else {
        void tryPlay();
      }
    };
    const handleResize = () => drawMobileFrame();

    void tryPlay();

    video.addEventListener("loadeddata", retryReady);
    video.addEventListener("canplay", retryReady);
    video.addEventListener("playing", startMobileRenderer);
    window.addEventListener("pageshow", retryVisible);
    window.addEventListener("focus", retryVisible);
    window.addEventListener("resize", handleResize, { passive: true });
    document.addEventListener("visibilitychange", retryVisible);
    document.addEventListener("pointerdown", retryAfterGesture, { passive: true });
    document.addEventListener("touchstart", retryAfterGesture, { passive: true });
    mobileMedia.addEventListener("change", handleViewportChange);
    reducedMotion.addEventListener("change", handleMotionPreference);

    return () => {
      stopMobileRenderer();
      video.removeEventListener("loadeddata", retryReady);
      video.removeEventListener("canplay", retryReady);
      video.removeEventListener("playing", startMobileRenderer);
      window.removeEventListener("pageshow", retryVisible);
      window.removeEventListener("focus", retryVisible);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", retryVisible);
      document.removeEventListener("pointerdown", retryAfterGesture);
      document.removeEventListener("touchstart", retryAfterGesture);
      mobileMedia.removeEventListener("change", handleViewportChange);
      reducedMotion.removeEventListener("change", handleMotionPreference);
    };
  }, [src]);

  return (
    <>
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
      <canvas ref={canvasRef} className={canvasClassName} aria-hidden="true" />
    </>
  );
}
