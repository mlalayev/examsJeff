"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Headphones } from "lucide-react";

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
    if (!audio) return;

    if (!hasStarted) {
      setHasStarted(true);
      audio.controls = false;
      audio.addEventListener("seeking", (e) => {
        e.preventDefault();
        audio.currentTime = currentTime;
      });
    }

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
      <div className={`rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-center ${className}`}>
        <p className="text-sm text-gray-500">No audio available</p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-gray-200 bg-white p-5 ${className}`}>
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

      {/* Progress */}
      <div className="mb-4">
        <div className="h-1 w-full rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-gray-800 transition-all duration-150"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-xs tabular-nums text-gray-500">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Play control */}
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={handlePlay}
          disabled={isPlaying}
          className="flex h-11 min-w-[140px] items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPlaying ? (
            <>
              <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              <span>Playing</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4" fill="currentColor" />
              <span>{hasStarted ? "Resume" : "Start"}</span>
            </>
          )}
        </button>
        {isPlaying && (
          <p className="text-xs text-gray-400">Playback cannot be paused or skipped</p>
        )}
      </div>
    </div>
  );
}
