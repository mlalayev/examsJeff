"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, RotateCcw, SkipBack, SkipForward } from "lucide-react";

interface IELTSAudioPlayerProps {
  src?: string | null;
  className?: string;
  attemptId?: string; // For localStorage persistence
  sectionId?: string; // For localStorage persistence
  /** When true, only play/pause works; seek, skips, and restart are disabled (e.g. IELTS listening). */
  playOnly?: boolean;
}

export const IELTSAudioPlayer: React.FC<IELTSAudioPlayerProps> = ({
  src,
  className = "",
  attemptId,
  sectionId,
  playOnly = false,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const attemptIdRef = useRef(attemptId);
  const sectionIdRef = useRef(sectionId);
  attemptIdRef.current = attemptId;
  sectionIdRef.current = sectionId;

  /** Avoid persisting 0 to localStorage before resume runs (overwrites saved position). */
  const resumeCompleteRef = useRef(false);
  /** isDragging in ref so the audio setup effect does not re-run (re-running calls load() and resets audio). */
  const isDraggingRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get localStorage key for audio time
  const getAudioTimeStorageKey = () => {
    const a = attemptIdRef.current;
    const s = sectionIdRef.current;
    if (!a || !s) return null;
    return `audio_time_${a}_${s}`;
  };

  // Normalize audio URL - memoized to prevent infinite re-renders
  const normalizedSrc = React.useMemo(() => {
    if (!src) return null;
    
    // If already a full URL or base64, return as-is
    if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")) {
      return src;
    }
    
    // Convert old /audio/ paths to /api/audio/ for reliable serving
    if (src.startsWith("/audio/")) {
      const filename = src.replace("/audio/", "");
      return `/api/audio/${filename}`;
    }
    
    // If it's /api/images/ (wrong path for audio), fix it
    if (src.startsWith("/api/images/")) {
      const filename = src.replace("/api/images/", "");
      // Check if it's actually an audio file
      if (filename.match(/\.(mp3|wav|ogg|m4a|aac|flac|wma|webm)$/i)) {
        return `/api/audio/${filename}`;
      }
    }
    
    // If already /api/audio/, return as-is
    if (src.startsWith("/api/audio/")) {
      return src;
    }
    
    // Fallback
    return src;
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !normalizedSrc) return;

    resumeCompleteRef.current = false;

    setError(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    audio.load();

    const applyResumeFromStorage = () => {
      const storageKey = getAudioTimeStorageKey();
      if (!storageKey || typeof window === "undefined") {
        resumeCompleteRef.current = true;
        return;
      }
      const savedTime = localStorage.getItem(storageKey);
      if (!savedTime) {
        resumeCompleteRef.current = true;
        return;
      }
      const time = parseFloat(savedTime);
      if (isNaN(time) || time < 0) {
        resumeCompleteRef.current = true;
        return;
      }
      const dur = audio.duration;
      if (Number.isFinite(dur) && dur > 0) {
        if (time >= dur - 0.05) {
          try {
            localStorage.removeItem(storageKey);
          } catch {
            /* ignore */
          }
          resumeCompleteRef.current = true;
          return;
        }
        if (time > 0 && time < dur) {
          try {
            audio.currentTime = time;
            setCurrentTime(time);
          } catch {
            /* ignore */
          }
        }
      } else {
        // Duration not ready yet — try seek anyway (some streams)
        if (time > 0) {
          try {
            audio.currentTime = time;
            setCurrentTime(time);
          } catch {
            /* ignore */
          }
        }
      }
      resumeCompleteRef.current = true;
    };

    const persistCurrentTime = () => {
      if (!resumeCompleteRef.current) return;
      const storageKey = getAudioTimeStorageKey();
      if (!storageKey || typeof window === "undefined") return;
      try {
        localStorage.setItem(storageKey, audio.currentTime.toString());
      } catch {
        /* ignore */
      }
    };

    const onTimeUpdate = () => {
      if (!isDraggingRef.current) {
        setCurrentTime(audio.currentTime);
        persistCurrentTime();
      }
    };
    const onLoadedMetadata = () => {
      setDuration(audio.duration);
      if (!resumeCompleteRef.current) {
        applyResumeFromStorage();
      }
    };
    const onLoadedData = () => {
      if (!resumeCompleteRef.current) {
        applyResumeFromStorage();
      }
    };
    const onCanPlay = () => {
      if (!resumeCompleteRef.current) {
        applyResumeFromStorage();
      }
    };
    const onEnded = () => {
      setIsPlaying(false);
      const storageKey = getAudioTimeStorageKey();
      if (storageKey && typeof window !== "undefined") {
        try {
          localStorage.removeItem(storageKey);
        } catch {
          /* ignore */
        }
      }
    };
    const onPlay = () => {
      setIsPlaying(true);
    };
    const onPause = () => {
      setIsPlaying(false);
      persistCurrentTime();
    };
    const onError = (e: Event) => {
      const audioElement = e.target as HTMLAudioElement;
      const errorMsg = audioElement.error 
        ? `Error ${audioElement.error.code}: ${audioElement.error.message}` 
        : "Unknown audio error";
      setError(errorMsg);
      console.error("🎧 Audio error:", errorMsg, "URL:", normalizedSrc);
    };

    const onPageHide = () => {
      persistCurrentTime();
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("loadeddata", onLoadedData);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);
    if (typeof window !== "undefined") {
      window.addEventListener("pagehide", onPageHide);
    }

    return () => {
      persistCurrentTime();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("loadeddata", onLoadedData);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
      if (typeof window !== "undefined") {
        window.removeEventListener("pagehide", onPageHide);
      }
    };
  }, [normalizedSrc]);

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
    isDraggingRef.current = true;
    setIsDragging(true);
    handleSeek(e.clientX);
  };

  useEffect(() => {
    if (playOnly) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleSeek(e.clientX);
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
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
  }, [isDragging, duration, playOnly]);

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
          disabled={playOnly}
          onClick={handleRestart}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-all hover:bg-gray-200 active:scale-95 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40"
          title="Əvvəldən başlat"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        {/* Skip Backward 10s */}
        <button
          type="button"
          disabled={playOnly}
          onClick={handleSkipBackward}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-all hover:bg-gray-200 active:scale-95 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40"
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
          disabled={playOnly}
          onClick={handleSkipForward}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-all hover:bg-gray-200 active:scale-95 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40"
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

      {/* Simple Progress Bar (read-only when playOnly) */}
      <div className="space-y-2">
        <div
          ref={progressBarRef}
          role={playOnly ? "progressbar" : undefined}
          aria-valuenow={playOnly ? Math.round(progressPct) : undefined}
          aria-valuemin={playOnly ? 0 : undefined}
          aria-valuemax={playOnly ? 100 : undefined}
          className={`relative h-2 rounded-full bg-gray-200 overflow-hidden transition-all ${
            playOnly
              ? "cursor-default pointer-events-none"
              : "cursor-pointer group hover:h-3"
          }`}
          onClick={playOnly ? undefined : handleProgressClick}
          onMouseDown={playOnly ? undefined : handleMouseDown}
          title={
            playOnly
              ? "Progress (seek disabled for this exam)"
              : "Audio üzərinə klikləyərək istədiyiniz yerə keçin"
          }
        >
          {/* Progress fill */}
          <div
            className="absolute top-0 left-0 bottom-0 bg-[#303380] transition-all"
            style={{ width: `${progressPct}%` }}
          />

          {/* Current position indicator */}
          {!playOnly && (
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-[#303380] rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `${progressPct}%`, transform: `translateX(-50%) translateY(-50%)` }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
