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

  /** Track if we've loaded the saved position to avoid overwriting it */
  const hasLoadedSavedPositionRef = useRef(false);
  /** isDragging in ref so the audio setup effect does not re-run (re-running calls load() and resets audio). */
  const isDraggingRef = useRef(false);
  /** Persist audio time periodically and on important events */
  const lastPersistedTimeRef = useRef<number>(0);
  /** Track if we're currently restoring position to avoid loops */
  const isRestoringRef = useRef(false);

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

    // Check if we have a saved position BEFORE doing anything
    const storageKey = getAudioTimeStorageKey();
    let savedTimeValue = 0;
    
    if (storageKey && typeof window !== "undefined") {
      const savedTime = localStorage.getItem(storageKey);
      if (savedTime) {
        const time = parseFloat(savedTime);
        if (!isNaN(time) && time > 0) {
          savedTimeValue = time;
          console.log(`🎧 Found saved position: ${time.toFixed(2)}s`);
        }
      }
    }

    hasLoadedSavedPositionRef.current = false;
    lastPersistedTimeRef.current = 0;

    setError(null);
    setIsPlaying(false);
    setDuration(0);
    
    // CRITICAL: Only call load() if the source has changed or is not set
    const needsLoad = !audio.src || audio.src !== normalizedSrc;
    
    if (needsLoad) {
      console.log(`🎧 Loading new audio source: ${normalizedSrc}`);
      audio.src = normalizedSrc;
      audio.load();
    } else {
      console.log(`🎧 Audio source unchanged, skipping load()`);
    }

    const restoreSavedPosition = () => {
      if (hasLoadedSavedPositionRef.current) return;
      if (isRestoringRef.current) {
        console.log("🔄 Already restoring, skipping");
        return;
      }
      
      const storageKey = getAudioTimeStorageKey();
      if (!storageKey || typeof window === "undefined") {
        hasLoadedSavedPositionRef.current = true;
        console.log("🎧 No storage key available");
        return;
      }

      try {
        const savedTime = localStorage.getItem(storageKey);
        if (!savedTime) {
          console.log("🎧 No saved audio position found - starting from beginning");
          hasLoadedSavedPositionRef.current = true;
          return;
        }

        const time = parseFloat(savedTime);
        if (isNaN(time) || time <= 0) {
          console.log(`🎧 Invalid or zero saved time (${savedTime}), clearing and starting from beginning`);
          localStorage.removeItem(storageKey);
          hasLoadedSavedPositionRef.current = true;
          return;
        }

        const dur = audio.duration;
        console.log(`🎧 Attempting to restore position: ${time.toFixed(2)}s (duration: ${dur && isFinite(dur) ? dur.toFixed(2) : 'unknown'}s)`);

        // If saved time is at the end, clear it
        if (Number.isFinite(dur) && dur > 0 && time >= dur - 0.5) {
          localStorage.removeItem(storageKey);
          console.log("🎧 Saved position is at end of audio, cleared");
          hasLoadedSavedPositionRef.current = true;
          return;
        }
        
        // Mark that we're restoring to prevent loops
        isRestoringRef.current = true;
        
        // Restore position - this is CRITICAL
        if (Number.isFinite(dur) && dur > 0 && time < dur) {
          try {
            audio.currentTime = time;
            setCurrentTime(time);
            lastPersistedTimeRef.current = time;
            console.log(`✅ Restored audio position: ${time.toFixed(2)}s / ${dur.toFixed(2)}s`);
            hasLoadedSavedPositionRef.current = true;
            
            // Clear the restoring flag after a short delay
            setTimeout(() => {
              isRestoringRef.current = false;
            }, 100);
          } catch (e) {
            console.error("❌ Error setting audio.currentTime:", e);
            hasLoadedSavedPositionRef.current = true;
            isRestoringRef.current = false;
          }
        } else if (time > 0) {
          // Duration not ready yet, try anyway
          try {
            audio.currentTime = time;
            setCurrentTime(time);
            lastPersistedTimeRef.current = time;
            console.log(`✅ Restored audio position (no duration yet): ${time.toFixed(2)}s`);
            hasLoadedSavedPositionRef.current = true;
            
            // Clear the restoring flag after a short delay
            setTimeout(() => {
              isRestoringRef.current = false;
            }, 100);
          } catch (e) {
            console.error("❌ Error setting audio.currentTime:", e);
            hasLoadedSavedPositionRef.current = true;
            isRestoringRef.current = false;
          }
        }
      } catch (error) {
        console.error("❌ Failed to restore audio position:", error);
        hasLoadedSavedPositionRef.current = true;
        isRestoringRef.current = false;
      }
    };

    const persistCurrentTime = () => {
      const storageKey = getAudioTimeStorageKey();
      if (!storageKey || typeof window === "undefined" || !audio) return;
      
      // CRITICAL: Don't persist until we've loaded the saved position
      // Otherwise we'll overwrite the saved position with 0
      if (!hasLoadedSavedPositionRef.current) {
        console.log("⏸️ Skipping persist - haven't loaded saved position yet");
        return;
      }
      
      const currentTime = audio.currentTime;
      
      // Don't save if time is 0 or invalid
      if (!isFinite(currentTime) || currentTime <= 0) {
        console.log(`⏸️ Skipping persist - invalid time: ${currentTime}`);
        return;
      }
      
      // Only persist if the time has changed by at least 0.5 seconds
      if (Math.abs(currentTime - lastPersistedTimeRef.current) < 0.5) return;
      
      try {
        localStorage.setItem(storageKey, currentTime.toString());
        lastPersistedTimeRef.current = currentTime;
        console.log(`💾 Saved audio position: ${currentTime.toFixed(2)}s`);
      } catch (error) {
        console.error("Failed to persist audio time:", error);
      }
    };

    const onTimeUpdate = () => {
      if (!isDraggingRef.current) {
        const time = audio.currentTime;
        setCurrentTime(time);
        persistCurrentTime();
      }
    };

    const onLoadedMetadata = () => {
      const dur = audio.duration;
      setDuration(dur);
      console.log(`🎧 Audio metadata loaded, duration: ${dur.toFixed(2)}s`);
      // Don't restore immediately - wait for all load events
    };

    const onLoadedData = () => {
      console.log("🎧 Audio data loaded");
      // Don't restore here either
    };

    const onCanPlay = () => {
      console.log("🎧 Audio can play");
      // Restore position here - this is the final loading event
      if (!hasLoadedSavedPositionRef.current) {
        // Use setTimeout to ensure load() has completely finished
        setTimeout(() => {
          if (!hasLoadedSavedPositionRef.current) {
            restoreSavedPosition();
          }
        }, 50);
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      const storageKey = getAudioTimeStorageKey();
      if (storageKey && typeof window !== "undefined") {
        try {
          localStorage.removeItem(storageKey);
          console.log("🎧 Audio ended, cleared saved position");
        } catch {
          /* ignore */
        }
      }
    };

    const onPlay = () => {
      setIsPlaying(true);
      console.log(`✓ Playback started at: ${audio.currentTime.toFixed(2)}s`);
    };

    const onPause = () => {
      setIsPlaying(false);
      persistCurrentTime();
    };

    const onSeeking = () => {
      const currentTime = audio.currentTime;
      console.log(`🎧 Seeking to: ${currentTime.toFixed(2)}s`);
    };

    const onSeeked = () => {
      const currentTime = audio.currentTime;
      console.log(`🎧 Seeked to: ${currentTime.toFixed(2)}s`);
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
      // Force persist on page hide/refresh
      const storageKey = getAudioTimeStorageKey();
      if (storageKey && typeof window !== "undefined" && audio && hasLoadedSavedPositionRef.current) {
        try {
          const currentTime = audio.currentTime;
          if (isFinite(currentTime) && currentTime > 0) {
            localStorage.setItem(storageKey, currentTime.toString());
            console.log(`💾 Page hide: saved position ${currentTime.toFixed(2)}s`);
          }
        } catch {
          /* ignore */
        }
      }
    };

    const onBeforeUnload = () => {
      // Force persist on page unload
      const storageKey = getAudioTimeStorageKey();
      if (storageKey && typeof window !== "undefined" && audio && hasLoadedSavedPositionRef.current) {
        try {
          const currentTime = audio.currentTime;
          if (isFinite(currentTime) && currentTime > 0) {
            localStorage.setItem(storageKey, currentTime.toString());
            console.log(`💾 Before unload: saved position ${currentTime.toFixed(2)}s`);
          }
        } catch {
          /* ignore */
        }
      }
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("loadeddata", onLoadedData);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("seeking", onSeeking);
    audio.addEventListener("seeked", onSeeked);
    audio.addEventListener("error", onError);
    
    if (typeof window !== "undefined") {
      window.addEventListener("pagehide", onPageHide);
      window.addEventListener("beforeunload", onBeforeUnload);
    }

    return () => {
      // Force persist on cleanup
      if (hasLoadedSavedPositionRef.current) {
        const storageKey = getAudioTimeStorageKey();
        if (storageKey && typeof window !== "undefined" && audio) {
          try {
            const currentTime = audio.currentTime;
            if (isFinite(currentTime) && currentTime > 0) {
              localStorage.setItem(storageKey, currentTime.toString());
              console.log(`💾 Component cleanup: saved position ${currentTime.toFixed(2)}s`);
            }
          } catch {
            /* ignore */
          }
        }
      }
      
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("loadeddata", onLoadedData);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("seeking", onSeeking);
      audio.removeEventListener("seeked", onSeeked);
      audio.removeEventListener("error", onError);
      
      if (typeof window !== "undefined") {
        window.removeEventListener("pagehide", onPageHide);
        window.removeEventListener("beforeunload", onBeforeUnload);
      }
    };
  }, [normalizedSrc]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      // CRITICAL: Restore position right before playing if needed
      if (hasLoadedSavedPositionRef.current && lastPersistedTimeRef.current > 0) {
        const currentPos = audio.currentTime;
        const expectedPos = lastPersistedTimeRef.current;
        
        console.log(`▶️ Play: current=${currentPos.toFixed(2)}s, expected=${expectedPos.toFixed(2)}s`);
        
        // If position is wrong, fix it immediately before playing
        if (Math.abs(currentPos - expectedPos) > 0.5) {
          console.log(`⚠️ Fixing position before play: ${expectedPos.toFixed(2)}s`);
          audio.currentTime = expectedPos;
          setCurrentTime(expectedPos);
        }
      }
      
      audio.play().catch((err) => console.error("Audio play error:", err));
    }
  };

  const handleRestart = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrentTime(0);
    
    // Clear saved position on restart (don't save 0)
    const storageKey = getAudioTimeStorageKey();
    if (storageKey && typeof window !== "undefined") {
      try {
        localStorage.removeItem(storageKey);
        lastPersistedTimeRef.current = 0;
        console.log("🔄 Restarted audio, cleared saved position");
      } catch {
        /* ignore */
      }
    }
  };

  const handleSkipBackward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = Math.max(0, audio.currentTime - 10);
    audio.currentTime = newTime;
    
    // Only persist if greater than 0
    if (newTime > 0) {
      const storageKey = getAudioTimeStorageKey();
      if (storageKey && typeof window !== "undefined") {
        try {
          localStorage.setItem(storageKey, newTime.toString());
          lastPersistedTimeRef.current = newTime;
          console.log(`💾 Skipped backward to: ${newTime.toFixed(2)}s`);
        } catch {
          /* ignore */
        }
      }
    } else {
      // If we skipped back to 0, clear the saved position
      const storageKey = getAudioTimeStorageKey();
      if (storageKey && typeof window !== "undefined") {
        try {
          localStorage.removeItem(storageKey);
          lastPersistedTimeRef.current = 0;
          console.log("🔄 Skipped to start, cleared saved position");
        } catch {
          /* ignore */
        }
      }
    }
  };

  const handleSkipForward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = Math.min(duration, audio.currentTime + 10);
    audio.currentTime = newTime;
    
    // Persist immediately
    if (newTime > 0) {
      const storageKey = getAudioTimeStorageKey();
      if (storageKey && typeof window !== "undefined") {
        try {
          localStorage.setItem(storageKey, newTime.toString());
          lastPersistedTimeRef.current = newTime;
          console.log(`💾 Skipped forward to: ${newTime.toFixed(2)}s`);
        } catch {
          /* ignore */
        }
      }
    }
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
    
    // Persist immediately when seeking (only if > 0)
    if (newTime > 0) {
      const storageKey = getAudioTimeStorageKey();
      if (storageKey && typeof window !== "undefined") {
        try {
          localStorage.setItem(storageKey, newTime.toString());
          lastPersistedTimeRef.current = newTime;
          console.log(`💾 Seeked to: ${newTime.toFixed(2)}s`);
        } catch {
          /* ignore */
        }
      }
    } else {
      // If seeking to 0, clear saved position
      const storageKey = getAudioTimeStorageKey();
      if (storageKey && typeof window !== "undefined") {
        try {
          localStorage.removeItem(storageKey);
          lastPersistedTimeRef.current = 0;
        } catch {
          /* ignore */
        }
      }
    }
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
