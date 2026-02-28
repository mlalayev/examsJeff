"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play } from "lucide-react";

interface IELTSAudioPlayerProps {
  src?: string | null;
  className?: string;
}

export const IELTSAudioPlayer: React.FC<IELTSAudioPlayerProps> = ({ src, className = "" }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;

    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setHasStarted(false);
    audio.load();

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [src]);

  const handlePlay = () => {
    const audio = audioRef.current;
    if (!audio || hasStarted) return;

    setHasStarted(true);
    audio.controls = false;
    audio.addEventListener("seeking", (e) => {
      e.preventDefault();
      audio.currentTime = currentTime;
    });

    audio.play().catch((err) => console.error("Error playing audio:", err));
    setIsPlaying(true);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

  if (!src) {
    return (
      <div className={`flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 ${className}`}>
        <div className="h-12 w-12 shrink-0 rounded-full bg-gray-200 flex items-center justify-center">
          <Play className="h-5 w-5 text-gray-400 ml-0.5" fill="currentColor" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500">No audio available</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm ${className}`}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        controls={false}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
      />

      {/* Play button – disabled after first click */}
      <button
        type="button"
        onClick={handlePlay}
        disabled={hasStarted}
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
          hasStarted
            ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
            : "border-[#303380] bg-[#303380] text-white hover:bg-[#252a6b] hover:border-[#252a6b] active:scale-95"
        }`}
      >
        {hasStarted && isPlaying ? (
          <span className="h-5 w-5 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
        ) : hasStarted && !isPlaying ? (
          <span className="text-[10px] font-medium text-gray-400">Ended</span>
        ) : (
          <Play className="h-6 w-6 ml-0.5" fill="currentColor" />
        )}
      </button>

      {/* Progress bar + time (classic player layout) */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <span className="text-sm tabular-nums text-gray-600 w-9 shrink-0">
            {formatTime(currentTime)}
          </span>
          <div className="flex-1 min-w-0 h-2 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#303380] transition-all duration-150 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <span className="text-sm tabular-nums text-gray-500 w-9 shrink-0 text-right">
            {formatTime(duration)}
          </span>
        </div>
        {hasStarted && (
          <p className="text-xs text-gray-400">
            {isPlaying ? "Playing — you cannot pause or skip" : "Playback finished"}
          </p>
        )}
      </div>
    </div>
  );
}
