"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play } from "lucide-react";

interface IELTSAudioPlayerProps {
  src?: string | null;
  className?: string;
}

export const IELTSAudioPlayer: React.FC<IELTSAudioPlayerProps> = ({ src, className = "" }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;

    setHasStarted(false);
    setCurrentTime(0);
    setDuration(0);
    audio.load();

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => { /* keep hasStarted true, just stopped */ };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, [src]);

  const handlePlay = () => {
    const audio = audioRef.current;
    if (!audio || hasStarted) return;
    setHasStarted(true);
    audio.play().catch((err) => console.error("Audio play error:", err));
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
      />

      {/* Play button — once clicked, disabled for the rest of the section */}
      <button
        type="button"
        onClick={handlePlay}
        disabled={hasStarted}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#303380] text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none hover:bg-[#252a6b] active:scale-95"
        title={hasStarted ? "Playing — cannot stop or restart" : "Play (once only)"}
      >
        <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
      </button>

      {/* Read-only progress (no seek / no drag) */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <span className="text-xs tabular-nums text-gray-500 w-9 shrink-0">
            {formatTime(currentTime)}
          </span>
          <div className="flex-1 min-w-0 h-2 rounded-full bg-gray-200 overflow-hidden pointer-events-none">
            <div
              className="h-full rounded-full bg-[#303380] transition-none"
              style={{ width: `${progressPct}%` }}
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
