"use client";

import { useEffect, useRef } from "react";

type Props = {
  canvasClassName?: string;
  className?: string;
  src: string;
};

export function HeroVideo({ canvasClassName, className, src }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const mobileMedia = window.matchMedia("(max-width: 820px)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let needsGesture = reducedMotion;
    let mobileLoadTimer: number | undefined;
    let animationFrame: number | undefined;
    let lastFrameAt = 0;

    const drawMobileFrame = () => {
      if (!mobileMedia.matches || reducedMotion || video.readyState < 2 || !video.videoWidth || !video.videoHeight) return;

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

      context.drawImage(
        video,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        width,
        height,
      );
      canvas.dataset.ready = "true";
    };

    const renderMobileFrame = (timestamp: number) => {
      if (!mobileMedia.matches || reducedMotion) {
        animationFrame = undefined;
        return;
      }

      if (timestamp - lastFrameAt >= 33) {
        drawMobileFrame();
        lastFrameAt = timestamp;
      }
      animationFrame = window.requestAnimationFrame(renderMobileFrame);
    };

    const startMobileRenderer = () => {
      if (!mobileMedia.matches || reducedMotion) return;
      drawMobileFrame();
      if (animationFrame === undefined) {
        animationFrame = window.requestAnimationFrame(renderMobileFrame);
      }
    };

    const stopMobileRenderer = () => {
      if (animationFrame !== undefined) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = undefined;
      }
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
        startMobileRenderer();
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
      mobileLoadTimer = window.setTimeout(loadMobileVideo, 1100);
    };

    const retryVisible = () => {
      if (document.visibilityState === "visible") void tryPlay();
      else stopMobileRenderer();
    };
    const retryReady = () => {
      drawMobileFrame();
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
        stopMobileRenderer();
        void tryPlay();
      }
    };
    const handleResize = () => drawMobileFrame();

    if (mobileMedia.matches) {
      scheduleMobileLoad();
    } else if (!reducedMotion) {
      void tryPlay();
    }

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

    return () => {
      if (mobileLoadTimer !== undefined) window.clearTimeout(mobileLoadTimer);
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
        tabIndex={-1}
      >
        <source media="(min-width: 821px)" src={src} type="video/mp4" />
      </video>
      <canvas ref={canvasRef} className={canvasClassName} aria-hidden="true" />
    </>
  );
}
