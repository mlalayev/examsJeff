"use client";

import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Lock } from "lucide-react";

interface IELTSAudioPlayerProps {
  src?: string | null;
  className?: string;
  /**
   * If true, enables full controls (for teacher/admin preview)
   * If false (default), enforces IELTS restrictions (student mode)
   */
  allowFullControls?: boolean;
  /**
   * Callback when audio ends
   */
  onEnded?: () => void;
  /**
   * Initial time to start from (for page reload recovery)
   */
  initialTime?: number;
  /**
   * Callback to save current time (for auto-save)
   */
  onTimeUpdate?: (currentTime: number) => void;
}

/**
 * IELTS-compliant audio player with strict playback restrictions for students.
 * 
 * Student restrictions:
 * - No pause
 * - No seek/rewind
 * - No speed control
 * - No download
 * - Auto-play on mount
 * - Blocks keyboard shortcuts
 * 
 * Teacher/Admin mode:
 * - Full controls enabled
 */
const IELTSAudioPlayer: React.FC<IELTSAudioPlayerProps> = ({ 
  src, 
  className = "",
  allowFullControls = false,
  onEnded,
  initialTime = 0,
  onTimeUpdate,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  
  // Track the maximum time the user has reached (forward-only for students)
  const [lastAllowedTime, setLastAllowedTime] = useState(initialTime);
  const lastAllowedTimeRef = useRef(initialTime);

  // Auto-play for students on mount
  useEffect(() => {
    if (!allowFullControls && src && audioRef.current) {
      // Auto-play after a short delay (browser policy)
      const timer = setTimeout(() => {
        audioRef.current?.play()
          .then(() => setIsPlaying(true))
          .catch(err => {
            console.warn("Auto-play blocked by browser:", err);
            // Show play button if auto-play fails
          });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [src, allowFullControls]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;

    // Set initial time if provided
    if (initialTime > 0) {
      audio.currentTime = initialTime;
      setLastAllowedTime(initialTime);
      lastAllowedTimeRef.current = initialTime;
    }

    // Time update handler
    const handleTimeUpdate = () => {
      const currentTime = audio.currentTime;
      setCurrentTime(currentTime);
      
      // Update lastAllowedTime (forward progress only)
      if (currentTime > lastAllowedTimeRef.current) {
        lastAllowedTimeRef.current = currentTime;
        setLastAllowedTime(currentTime);
      }
      
      // Callback for auto-save
      if (onTimeUpdate) {
        onTimeUpdate(currentTime);
      }
    };

    // Prevent seeking backwards (student mode only)
    const handleSeeking = () => {
      if (!allowFullControls) {
        const currentTime = audio.currentTime;
        
        // If user tries to seek beyond lastAllowedTime, clamp it
        if (currentTime > lastAllowedTimeRef.current + 0.5) {
          // Allow small forward jumps (buffering), but not manual seeks
          audio.currentTime = lastAllowedTimeRef.current;
        } else if (currentTime < lastAllowedTimeRef.current - 0.5) {
          // Block backward seeks
          audio.currentTime = lastAllowedTimeRef.current;
        }
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (onEnded) {
        onEnded();
      }
    };

    // Block context menu (prevent download)
    const handleContextMenu = (e: Event) => {
      if (!allowFullControls) {
        e.preventDefault();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('seeking', handleSeeking);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('contextmenu', handleContextMenu);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('seeking', handleSeeking);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [src, allowFullControls, onEnded, onTimeUpdate, initialTime]);

  // Block keyboard shortcuts (student mode)
  useEffect(() => {
    if (!allowFullControls) {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Block space, arrows, etc.
        if (
          e.code === 'Space' || 
          e.code === 'ArrowLeft' || 
          e.code === 'ArrowRight' ||
          e.code === 'ArrowUp' ||
          e.code === 'ArrowDown'
        ) {
          e.preventDefault();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [allowFullControls]);

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.error("Play error:", err));
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume || 0.5;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  // Teacher mode: allow seeking
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!allowFullControls) return; // Block for students
    
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const allowedProgressPercentage = duration > 0 ? (lastAllowedTime / duration) * 100 : 0;

  if (!src) {
    return (
      <div className={`bg-white rounded-lg border p-4 w-full ${className}`}>
        <p className="text-gray-500 text-center">No audio available</p>
      </div>
    );
  }

  return (
    <div 
      className={`bg-white rounded-lg border p-4 w-full ${className}`}
      style={{
        backgroundColor: 'rgba(48, 51, 128, 0.02)',
        borderColor: 'rgba(48, 51, 128, 0.1)'
      }}
      onContextMenu={(e) => !allowFullControls && e.preventDefault()}
    >
      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #303380;
          cursor: ${allowFullControls ? 'pointer' : 'not-allowed'};
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          background: ${allowFullControls ? '#252a6b' : '#303380'};
          transform: ${allowFullControls ? 'scale(1.1)' : 'scale(1)'};
        }
        input[type="range"]::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #303380;
          cursor: ${allowFullControls ? 'pointer' : 'not-allowed'};
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
      
      <audio 
        ref={audioRef} 
        src={src} 
        preload="metadata"
        // No controls attribute - we handle everything
      />

      {/* IELTS Lock Notice (Student Mode) */}
      {!allowFullControls && (
        <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
          <Lock className="w-4 h-4 text-amber-600" />
          <p className="text-xs text-amber-800 font-medium">
            🎧 Audio is locked (IELTS rules) — No pause, rewind, or seeking allowed
          </p>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-4">
        {allowFullControls ? (
          // Teacher: Full seek bar
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #303380 0%, #303380 ${progressPercentage}%, rgba(48, 51, 128, 0.2) ${progressPercentage}%, rgba(48, 51, 128, 0.2) 100%)`,
              outline: 'none'
            }}
          />
        ) : (
          // Student: Read-only progress bar (shows allowed progress)
          <div className="relative w-full h-1 rounded-lg bg-gray-200">
            <div 
              className="absolute top-0 left-0 h-full rounded-lg transition-all"
              style={{
                width: `${allowedProgressPercentage}%`,
                backgroundColor: '#303380'
              }}
            />
            <div 
              className="absolute top-0 left-0 h-full rounded-lg"
              style={{
                width: `${progressPercentage}%`,
                backgroundColor: 'rgba(48, 51, 128, 0.5)'
              }}
            />
          </div>
        )}
        <div className="flex justify-between text-xs mt-1"
             style={{ color: 'rgba(48, 51, 128, 0.7)' }}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        {/* Play/Pause - Only show if teacher mode OR if auto-play failed */}
        {(allowFullControls || !isPlaying) && (
          <button
            onClick={togglePlayPause}
            className="p-3 rounded-full transition-all hover:scale-105"
            style={{
              backgroundColor: '#303380',
              color: 'white'
            }}
            title={allowFullControls ? (isPlaying ? "Pause" : "Play") : "Play (auto-play may be blocked)"}
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
        )}

        {/* Volume Control */}
        <div className="flex items-center gap-2 flex-1">
          <button
            onClick={toggleMute}
            className="p-2 rounded-full hover:bg-gray-100 transition"
            style={{ color: '#303380' }}
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="flex-1 h-1 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #303380 0%, #303380 ${(isMuted ? 0 : volume) * 100}%, rgba(48, 51, 128, 0.2) ${(isMuted ? 0 : volume) * 100}%, rgba(48, 51, 128, 0.2) 100%)`,
              outline: 'none'
            }}
          />
        </div>

        {/* Mode indicator */}
        {!allowFullControls && isPlaying && (
          <div className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium">
            Playing
          </div>
        )}
      </div>
    </div>
  );
};

export default IELTSAudioPlayer;



