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

// Utility function to clear audio time from localStorage
export const clearAudioTime = (attemptId?: string, sectionId?: string) => {
  if (!attemptId || !sectionId || typeof window === "undefined") return;
  const key = `audio_time_${attemptId}_${sectionId}`;
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Failed to clear audio time:", error);
  }
};

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

  /** Track if we've checked localStorage for saved position on play button press */
  const hasCheckedSavedPositionRef = useRef(false);
  /** isDragging in ref so the audio setup effect does not re-run (re-running calls load() and resets audio). */
  const isDraggingRef = useRef(false);
  /** Persist audio time periodically and on important events */
  const lastPersistedTimeRef = useRef<number>(0);
  /** Throttle React updates from `timeupdate` (fires very often during playback) */
  const lastUiUpdateMsRef = useRef(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
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

    // Reset flags when audio source changes
    hasCheckedSavedPositionRef.current = false;
    lastPersistedTimeRef.current = 0;
    lastUiUpdateMsRef.current = 0;

    setError(null);
    setIsPlaying(false);
    setDuration(0);

    // CRITICAL: Only call load() if the source has changed or is not set
    const needsLoad = !audio.src || audio.src !== normalizedSrc;

    if (needsLoad) {
      audio.src = normalizedSrc;
      audio.load();
    }

    const persistCurrentTime = (opts?: { force?: boolean }) => {
      const storageKey = getAudioTimeStorageKey();
      if (!storageKey || typeof window === "undefined" || !audio) return;

      const currentTime = audio.currentTime;

      // Don't save if time is 0 or invalid
      if (!isFinite(currentTime) || currentTime <= 0) {
        return;
      }

      // While playing, avoid localStorage on every `timeupdate` tick — only when >= 0.5s moved
      if (
        !opts?.force &&
        Math.abs(currentTime - lastPersistedTimeRef.current) < 0.5
      ) {
        return;
      }

      try {
        localStorage.setItem(storageKey, currentTime.toString());
        lastPersistedTimeRef.current = currentTime;
      } catch (error) {
        console.error("Failed to persist audio time:", error);
      }
    };

    const UI_UPDATE_INTERVAL_MS = 100;

    const onTimeUpdate = () => {
      if (isDraggingRef.current) return;

      const time = audio.currentTime;
      const now =
        typeof performance !== "undefined" && typeof performance.now === "function"
          ? performance.now()
          : Date.now();

      // `timeupdate` can fire many times per second — only re-render the UI ~10/s for time + bar
      if (now - lastUiUpdateMsRef.current >= UI_UPDATE_INTERVAL_MS) {
        lastUiUpdateMsRef.current = now;
        setCurrentTime(time);
      }

      // Skip persist on most ticks; only when playback moved enough (same as before, without extra work)
      if (isFinite(time) && time > 0 && Math.abs(time - lastPersistedTimeRef.current) >= 0.5) {
        persistCurrentTime();
      }
    };

    const onLoadedMetadata = () => {
      const dur = audio.duration;
      if (Number.isFinite(dur) && dur > 0) setDuration(dur);
    };

    const onDurationChange = () => {
      const dur = audio.duration;
      if (Number.isFinite(dur) && dur > 0) setDuration(dur);
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
      persistCurrentTime({ force: true });
    };

    const onSeeked = () => {
      persistCurrentTime({ force: true });
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
      if (storageKey && typeof window !== "undefined" && audio) {
        try {
          const currentTime = audio.currentTime;
          if (isFinite(currentTime) && currentTime > 0) {
            localStorage.setItem(storageKey, currentTime.toString());
          }
        } catch {
          /* ignore */
        }
      }
    };

    const onBeforeUnload = () => {
      // Force persist on page unload
      const storageKey = getAudioTimeStorageKey();
      if (storageKey && typeof window !== "undefined" && audio) {
        try {
          const currentTime = audio.currentTime;
          if (isFinite(currentTime) && currentTime > 0) {
            localStorage.setItem(storageKey, currentTime.toString());
          }
        } catch {
          /* ignore */
        }
      }
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("seeked", onSeeked);
    audio.addEventListener("error", onError);

    if (typeof window !== "undefined") {
      window.addEventListener("pagehide", onPageHide);
      window.addEventListener("beforeunload", onBeforeUnload);
    }

    return () => {
      // Force persist on cleanup
      const storageKey = getAudioTimeStorageKey();
      if (storageKey && typeof window !== "undefined" && audio) {
        try {
          const currentTime = audio.currentTime;
          if (isFinite(currentTime) && currentTime > 0) {
            localStorage.setItem(storageKey, currentTime.toString());
          }
        } catch {
          /* ignore */
        }
      }

      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
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
      if (!hasCheckedSavedPositionRef.current) {
        const storageKey = getAudioTimeStorageKey();

        if (storageKey && typeof window !== "undefined") {
          try {
            const savedTime = localStorage.getItem(storageKey);

            if (savedTime) {
              const time = parseFloat(savedTime);

              if (!isNaN(time) && time > 0) {
                const dur = audio.duration;

                // Only restore if within valid range
                if (Number.isFinite(dur) && dur > 0 && time < dur - 0.5) {
                  audio.currentTime = time;
                  setCurrentTime(time);
                  lastPersistedTimeRef.current = time;
                } else if (time > 0 && (!Number.isFinite(dur) || dur === 0)) {
                  // Duration not ready yet, try anyway
                  audio.currentTime = time;
                  setCurrentTime(time);
                  lastPersistedTimeRef.current = time;
                }
              }
            }
          } catch (error) {
            console.error("❌ Failed to restore audio position on play:", error);
          }
        }
        hasCheckedSavedPositionRef.current = true;
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
        } catch {
          /* ignore */
        }
      }
    }
  };

  /** Never return Infinity/NaN — assigning currentTime to Infinity resets playback to 0 in browsers. */
  const getSeekableEnd = (audio: HTMLAudioElement): number => {
    const d = audio.duration;
    if (Number.isFinite(d) && d > 0 && d !== Number.POSITIVE_INFINITY) return d;
    try {
      const r = audio.seekable;
      for (let i = r.length - 1; i >= 0; i--) {
        const end = r.end(i);
        if (Number.isFinite(end) && end > 0 && end !== Number.POSITIVE_INFINITY) return end;
      }
    } catch {
      /* ignore */
    }
    return Number.isFinite(duration) && duration > 0 ? duration : 0;
  };

  const handleSkipForward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const end = getSeekableEnd(audio);
    if (!end) return;
    const newTime = Math.min(end, audio.currentTime + 10);
    audio.currentTime = newTime;

    // Persist immediately
    if (newTime > 0) {
      const storageKey = getAudioTimeStorageKey();
      if (storageKey && typeof window !== "undefined") {
        try {
          localStorage.setItem(storageKey, newTime.toString());
          lastPersistedTimeRef.current = newTime;
        } catch {
          /* ignore */
        }
      }
    }
  };

  const handleSeek = (clientX: number) => {
    const audio = audioRef.current;
    const progressBar = progressBarRef.current;
    if (!audio || !progressBar) return;

    // Use element duration / seekable range — React `duration` is often still 0 on first clicks
    const end = getSeekableEnd(audio);
    if (!Number.isFinite(end) || end <= 0) return;

    const rect = progressBar.getBoundingClientRect();
    if (rect.width <= 0) return;
    const pos = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const newTime = Math.min(end, Math.max(0, pos * end));
    if (!Number.isFinite(newTime)) return;

    audio.currentTime = newTime;
    setCurrentTime(newTime);
    if (Number.isFinite(audio.duration) && audio.duration > 0 && audio.duration !== Number.POSITIVE_INFINITY) {
      setDuration(audio.duration);
    } else if (end > 0 && (!Number.isFinite(duration) || duration <= 0)) {
      setDuration(end);
    }

    // Persist immediately when seeking (only if > 0)
    if (newTime > 0) {
      const storageKey = getAudioTimeStorageKey();
      if (storageKey && typeof window !== "undefined") {
        try {
          localStorage.setItem(storageKey, newTime.toString());
          lastPersistedTimeRef.current = newTime;
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

  /** Seek / scrub: pointer capture so drag works for mouse, touch, and pen without document listeners */
  const handleProgressPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (playOnly) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    handleSeek(e.clientX);
  };

  const handleProgressPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    handleSeek(e.clientX);
  };

  const endProgressDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.hasPointerCapture(e.pointerId)) {
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
    isDraggingRef.current = false;
  };

  const handleProgressPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    endProgressDrag(e);
  };

  const handleProgressPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    endProgressDrag(e);
  };

  const handleProgressLostPointerCapture = () => {
    isDraggingRef.current = false;
  };

  const formatTime = (time: number) => {
    if (!isFinite(time) || isNaN(time)) return "0:00";
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const durationForBar =
    audioRef.current &&
    Number.isFinite(audioRef.current.duration) &&
    audioRef.current.duration > 0 &&
    audioRef.current.duration !== Number.POSITIVE_INFINITY
      ? audioRef.current.duration
      : duration > 0 && Number.isFinite(duration)
        ? duration
        : 0;
  const progressPct = durationForBar ? (currentTime / durationForBar) * 100 : 0;

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
      <audio ref={audioRef} src={normalizedSrc || undefined} preload="auto" />

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

      {/* Progress bar: click / tap / drag to seek (wider touch target when seeking enabled) */}
      <div className="space-y-2">
        <div className={playOnly ? "" : "touch-none py-2 -my-2"}>
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
            onPointerDown={playOnly ? undefined : handleProgressPointerDown}
            onPointerMove={playOnly ? undefined : handleProgressPointerMove}
            onPointerUp={playOnly ? undefined : handleProgressPointerUp}
            onPointerCancel={playOnly ? undefined : handleProgressPointerCancel}
            onLostPointerCapture={playOnly ? undefined : handleProgressLostPointerCapture}
            title={
              playOnly
                ? "Progress (seek disabled for this exam)"
                : "Click or drag on the bar to jump to that position in the audio"
            }
          >
            {/* Progress fill — pointer-events-none so input goes to the track */}
            <div
              className="pointer-events-none absolute top-0 left-0 bottom-0 bg-[#303380] transition-all"
              style={{ width: `${progressPct}%` }}
            />

            {!playOnly && (
              <div
                className="pointer-events-none absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-[#303380] rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `${progressPct}%`, transform: `translateX(-50%) translateY(-50%)` }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
