"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Play } from 'lucide-react';

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

    // Reset player when src changes
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

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [src]);

  const handlePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!hasStarted) {
      setHasStarted(true);
      // Disable pause and seek controls
      audio.controls = false;
      // Prevent seeking
      audio.addEventListener('seeking', (e) => {
        e.preventDefault();
        audio.currentTime = currentTime;
      });
    }
    
    audio.play().catch((err) => {
      console.error("Error playing audio:", err);
    });
    setIsPlaying(true);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

  if (!src) {
    return (
      <div className={`bg-white rounded-lg border p-4 w-full ${className}`}>
        <p className="text-gray-500 text-center">No audio available</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border p-4 w-full ${className}`}
         style={{
           backgroundColor: 'rgba(48, 51, 128, 0.02)',
           borderColor: 'rgba(48, 51, 128, 0.1)'
         }}>
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
      
      {/* Progress Bar - Read only, no interaction */}
      <div className="mb-4">
        <div
          className="w-full h-2 rounded-lg pointer-events-none"
          style={{
            background: `linear-gradient(to right, #303380 0%, #303380 ${progressPercentage}%, rgba(48, 51, 128, 0.2) ${progressPercentage}%, rgba(48, 51, 128, 0.2) 100%)`,
          }}
        />
        <div className="flex justify-between text-xs mt-1"
             style={{ color: 'rgba(48, 51, 128, 0.7)' }}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Play Button Only */}
      <div className="flex items-center justify-center">
        <button
          onClick={handlePlay}
          disabled={isPlaying}
          className="p-4 rounded-full transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ 
            backgroundColor: isPlaying ? '#10b981' : '#303380',
            color: 'white'
          }}
          onMouseEnter={(e) => {
            if (!isPlaying) {
              e.currentTarget.style.backgroundColor = '#252a6b';
            }
          }}
          onMouseLeave={(e) => {
            if (!isPlaying) {
              e.currentTarget.style.backgroundColor = '#303380';
            }
          }}
        >
          {isPlaying ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="ml-1">Playing...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              <span className="ml-1">{hasStarted ? 'Resume' : 'Start Listening'}</span>
            </div>
          )}
        </button>
      </div>

      {isPlaying && (
        <p className="text-center text-xs text-gray-500 mt-2">
          Audio is playing. You cannot pause or skip.
        </p>
      )}
    </div>
  );
};

