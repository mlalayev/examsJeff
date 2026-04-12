"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, RotateCcw, SkipBack, SkipForward } from "lucide-react";

interface IELTSAudioPlayerProps {
  src?: string | null;
  className?: string;
}

export const IELTSAudioPlayer: React.FC<IELTSAudioPlayerProps> = ({ src, className = "" }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Normalize audio URL - convert old paths to new API paths
  const normalizeAudioUrl = (audioPath: string | null | undefined): string | null => {
    if (!audioPath) return null;
    
    // If already a full URL or base64, return as-is
    if (audioPath.startsWith("http://") || audioPath.startsWith("https://") || audioPath.startsWith("data:")) {
      return audioPath;
    }
    
    // Convert old /audio/ paths to /api/audio/ for reliable serving
    if (audioPath.startsWith("/audio/")) {
      const filename = audioPath.replace("/audio/", "");
      return `/api/audio/${filename}`;
    }
    
    // If it's /api/images/ (wrong path for audio), fix it
    if (audioPath.startsWith("/api/images/")) {
      const filename = audioPath.replace("/api/images/", "");
      // Check if it's actually an audio file
      if (filename.match(/\.(mp3|wav|ogg|m4a|aac|flac|wma|webm)$/i)) {
        return `/api/audio/${filename}`;
      }
    }
    
    // If already /api/audio/, return as-is
    if (audioPath.startsWith("/api/audio/")) {
      return audioPath;
    }
    
    // Fallback: assume it's relative and prepend /api/audio/
    return audioPath;
  };

  const normalizedSrc = normalizeAudioUrl(src);

  console.log("🎧 IELTSAudioPlayer render:", { originalSrc: src, normalizedSrc, hasAudio: !!normalizedSrc });

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !normalizedSrc) return;

    console.log("🎧 Loading audio:", normalizedSrc);
    setError(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    audio.load();

    const onTimeUpdate = () => {
      if (!isDragging) {
        setCurrentTime(audio.currentTime);
      }
    };
    const onLoadedMetadata = () => {
      console.log("🎧 Audio metadata loaded, duration:", audio.duration);
      setDuration(audio.duration);
    };
    const onEnded = () => setIsPlaying(false);
    const onPlay = () => {
      console.log("🎧 Audio playing");
      setIsPlaying(true);
    };
    const onPause = () => {
      console.log("🎧 Audio paused");
      setIsPlaying(false);
    };
    const onError = (e: Event) => {
      console.error("🎧 Audio error:", e);
      const audioElement = e.target as HTMLAudioElement;
      const errorMsg = audioElement.error 
        ? `Error ${audioElement.error.code}: ${audioElement.error.message}` 
        : "Unknown audio error";
      setError(errorMsg);
      console.error("🎧 Audio error details:", errorMsg);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
    };
  }, [normalizedSrc, isDragging]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((err) => console.error("Audio play error:", err));
    }
  };

  const handleRestart = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrentTime(0);
  };

  const handleSkipBackward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, audio.currentTime - 10);
  };

  const handleSkipForward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(duration, audio.currentTime + 10);
  };

  const handleSeek = (clientX: number) => {
    const audio = audioRef.current;
    const progressBar = progressBarRef.current;
    if (!audio || !progressBar || !duration) return;

    const rect = progressBar.getBoundingClientRect();
    const pos = (clientX - rect.left) / rect.width;
    const newTime = Math.max(0, Math.min(duration, pos * duration));
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    handleSeek(e.clientX);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleSeek(e.clientX);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleSeek(e.clientX);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, duration]);

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
    <div className={`flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm ${className}`}>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <p className="text-xs text-red-700">Audio Error: {error}</p>
          <p className="text-xs text-red-600 mt-1">Original URL: {src}</p>
          <p className="text-xs text-red-600">Normalized URL: {normalizedSrc}</p>
        </div>
      )}
      <audio
        ref={audioRef}
        src={normalizedSrc || undefined}
        preload="metadata"
      />

      {/* Controls Row */}
      <div className="flex items-center gap-3">
        {/* Restart Button */}
        <button
          type="button"
          onClick={handleRestart}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-all hover:bg-gray-200 active:scale-95"
          title="Əvvəldən başlat"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        {/* Skip Backward 10s */}
        <button
          type="button"
          onClick={handleSkipBackward}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-all hover:bg-gray-200 active:scale-95"
          title="10 saniyə geri"
        >
          <SkipBack className="h-4 w-4" />
        </button>

        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={handlePlayPause}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#303380] text-white transition-all hover:bg-[#252a6b] active:scale-95"
          title={isPlaying ? "Dayandır" : "Oynat"}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" fill="currentColor" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
          )}
        </button>

        {/* Skip Forward 10s */}
        <button
          type="button"
          onClick={handleSkipForward}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-all hover:bg-gray-200 active:scale-95"
          title="10 saniyə irəli"
        >
          <SkipForward className="h-4 w-4" />
        </button>

        {/* Time Display */}
        <div className="flex items-center gap-2 text-sm tabular-nums text-gray-600">
          <span>{formatTime(currentTime)}</span>
          <span className="text-gray-400">/</span>
          <span className="text-gray-400">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Interactive Waveform-style Progress Bar */}
      <div className="space-y-2">
        <div 
          ref={progressBarRef}
          className="relative h-20 rounded-lg bg-gradient-to-b from-gray-50 to-gray-100 overflow-hidden cursor-pointer group border border-gray-200 hover:border-[#303380] transition-colors"
          onClick={handleProgressClick}
          onMouseDown={handleMouseDown}
          title="Audio üzərinə klikləyərək istədiyiniz yerə keçin"
        >
          {/* Waveform visualization */}
          <div className="absolute inset-0 flex items-center justify-around px-1">
            {Array.from({ length: 60 }).map((_, i) => {
              const height = Math.sin(i * 0.5) * 30 + 40;
              const isPast = (i / 60) * 100 <= progressPct;
              return (
                <div
                  key={i}
                  className={`w-0.5 rounded-full transition-colors ${
                    isPast 
                      ? 'bg-[#303380]' 
                      : 'bg-gray-300'
                  }`}
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>

          {/* Current position indicator */}
          <div 
            className="absolute top-0 bottom-0 w-1 bg-[#303380] shadow-lg z-10"
            style={{ left: `${progressPct}%` }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-[#303380] rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Hover effect */}
          <div className="absolute inset-0 bg-[#303380] opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none" />
        </div>

        {/* Helper Text */}
        <p className="text-xs text-gray-500 text-center">
          Audio dalğalarının üzərinə klikləyərək və ya sürüşdürərək istədiyiniz yerə keçə bilərsiniz
        </p>
      </div>
    </div>
  );
};
