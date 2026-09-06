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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let gestureRetryArmed = false;
    let sourceAttached = false;
    let posterImage: HTMLImageElement | null = null;

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
    };

    const drawCover = (source: CanvasImageSource, sourceWidth: number, sourceHeight: number) => {
      if (!sourceWidth || !sourceHeight) return;
      resizeCanvas();

      const width = canvas.width;
      const height = canvas.height;
      const scale = Math.max(width / sourceWidth, height / sourceHeight);
      const cropWidth = width / scale;
      const cropHeight = height / scale;
      const cropX = (sourceWidth - cropWidth) / 2;
      const cropY = (sourceHeight - cropHeight) / 2;

      context.drawImage(source, cropX, cropY, cropWidth, cropHeight, 0, 0, width, height);
      canvas.dataset.ready = "true";
    };

    const drawPoster = () => {
      if (!posterImage?.complete || !posterImage.naturalWidth || !posterImage.naturalHeight) return;
      drawCover(posterImage, posterImage.naturalWidth, posterImage.naturalHeight);
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

    const attachSource = () => {
      if (sourceAttached) return;
      sourceAttached = true;
      video.src = src;
      video.load();
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

    const revealVideo = () => {
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || video.paused) return;
      canvas.dataset.videoReady = "true";
    };

    const tryPlay = async () => {
      if (document.visibilityState !== "visible") return;

      configureVideo();
      attachSource();

      try {
        await video.play();
        disarmGestureRetry();
        revealVideo();
      } catch {
        armGestureRetry();
      }
    };

    function retryAfterGesture() {
      void tryPlay();
    }

    const retryVisible = () => {
      if (document.visibilityState === "visible" && sourceAttached) void tryPlay();
    };

    const handleResize = () => {
      if (canvas.dataset.videoReady !== "true") drawPoster();
    };

    posterImage = new Image();
    posterImage.decoding = "async";
    posterImage.onload = () => {
      drawPoster();
      void tryPlay();
    };
    posterImage.src = HERO_POSTER_URL;

    video.addEventListener("loadeddata", revealVideo);
    video.addEventListener("canplay", () => void tryPlay());
    video.addEventListener("playing", revealVideo);
    window.addEventListener("pageshow", retryVisible);
    window.addEventListener("focus", retryVisible);
    window.addEventListener("online", retryVisible);
    window.addEventListener("resize", handleResize, { passive: true });
    document.addEventListener("visibilitychange", retryVisible);

    if (posterImage.complete) {
      drawPoster();
      void tryPlay();
    }

    return () => {
      disarmGestureRetry();
      if (posterImage) posterImage.onload = null;
      video.removeEventListener("loadeddata", revealVideo);
      video.removeEventListener("playing", revealVideo);
      window.removeEventListener("pageshow", retryVisible);
      window.removeEventListener("focus", retryVisible);
      window.removeEventListener("online", retryVisible);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", retryVisible);
    };
  }, [src]);

  return (
    <>
      <link rel="preload" href={HERO_POSTER_URL} as="image" fetchPriority="high" />
      <video
        ref={videoRef}
        className={className}
        controls={false}
        disablePictureInPicture
        disableRemotePlayback
        loop
        muted
        playsInline
        preload="none"
        tabIndex={-1}
      />
      <canvas ref={canvasRef} className={canvasClassName} aria-hidden="true" />
    </>
  );
}
