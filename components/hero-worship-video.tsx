"use client";

import { useRef, useState } from "react";

export function HeroWorshipVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);

  function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      void video.play();
      setPaused(false);
    } else {
      video.pause();
      setPaused(true);
    }
  }

  return (
    <>
      <video
        ref={videoRef}
        className="editorialHeroVideo"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      >
        <source src="/media/hero-worship.mp4" type="video/mp4" />
      </video>

      <button
        type="button"
        className="editorialVideoControl"
        onClick={togglePlayback}
        aria-label={paused ? "Reproduzir vídeo de fundo" : "Pausar vídeo de fundo"}
        aria-pressed={paused}
      >
        <span aria-hidden="true">{paused ? "▶" : "Ⅱ"}</span>
        {paused ? "Reproduzir" : "Pausar vídeo"}
      </button>
    </>
  );
}
