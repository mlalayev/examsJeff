"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause } from "lucide-react";

interface IELTSAudioPlayerProps {
  src?: string | null;
  className?: string;
}

export const IELTSAudioPlayer: React.FC<IELTSAudioPlayerProps> = ({ src, className = "" }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;

    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    audio.load();

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, [src]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((err) => console.error("Audio play error:", err));
    }
  };

  const seek = useCallback((clientX: number) => {
    const audio = audioRef.current;
    const bar = progressRef.current;
    if (!audio || !bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
    setCurrentTime(audio.currentTime);
  }, [duration]);

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => seek(e.clientX);

  const handleBarMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    seek(e.clientX);
    const onMove = (ev: MouseEvent) => seek(ev.clientX);
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const formatTime = (time: number) => {
    if (!isFinite(time) || isNaN(time)) return "0:00";
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const progressPct = duration ? (currentTime / duration) * 100 : 0;

  if (!src) {
    return (
      <div className={`flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 ${className}`}>
        <div className="h-12 w-12 shrink-0 rounded-full bg-gray-200 flex items-center justify-center">
          <Play className="h-5 w-5 text-gray-400 ml-0.5" fill="currentColor" />
        </div>
        <p className="text-sm text-gray-500">No audio available</p>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm ${className}`}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Play / Pause */}
      <button
        type="button"
        onClick={togglePlay}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#303380] text-white hover:bg-[#252a6b] active:scale-95 transition-all"
        title={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying
          ? <Pause className="h-5 w-5" fill="currentColor" />
          : <Play className="h-5 w-5 ml-0.5" fill="currentColor" />}
      </button>

      {/* Progress bar + timestamps */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <span className="text-xs tabular-nums text-gray-500 w-9 shrink-0">
            {formatTime(currentTime)}
          </span>

          {/* Clickable / draggable progress bar */}
          <div
            ref={progressRef}
            className="flex-1 min-w-0 h-2 rounded-full bg-gray-200 cursor-pointer relative group"
            onClick={handleBarClick}
            onMouseDown={handleBarMouseDown}
          >
            <div
              className="h-full rounded-full bg-[#303380] transition-none"
              style={{ width: `${progressPct}%` }}
            />
            {/* Thumb dot */}
            <div
              className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-[#303380] border-2 border-white shadow opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `${progressPct}%`, transform: "translate(-50%, -50%)" }}
            />
          </div>

          <span className="text-xs tabular-nums text-gray-400 w-9 shrink-0 text-right">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
};
