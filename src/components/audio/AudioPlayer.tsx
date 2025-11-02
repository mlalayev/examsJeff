import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';

interface AudioPlayerProps {
  src?: string | null;
  className?: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, className = "" }) => {
  if (!src) {
    return (
      <div className={`bg-white rounded-lg border p-4 w-full ${className}`}>
        <p className="text-gray-500 text-center">No audio available</p>
      </div>
    );
  }
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;

    // Reset player when src changes
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    audio.load();

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [src]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const skipBackward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, audio.currentTime - 10);
  };

  const skipForward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(duration, audio.currentTime + 10);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newVolume = parseFloat(e.target.value);
    audio.volume = newVolume;
    setVolume(newVolume);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`bg-white rounded-lg border p-4 w-full ${className}`}
         style={{
           backgroundColor: 'rgba(48, 51, 128, 0.02)',
           borderColor: 'rgba(48, 51, 128, 0.1)'
         }}>
      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #303380;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          background: #252a6b;
          transform: scale(1.1);
        }
        input[type="range"]::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #303380;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
      <audio ref={audioRef} src={src} preload="metadata" />
      
      {/* Seek Bar - Moved to top */}
      <div className="mb-4">
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
        <div className="flex justify-between text-xs mt-1"
             style={{ color: 'rgba(48, 51, 128, 0.7)' }}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Skip Backward */}
          <button
            onClick={skipBackward}
            className="p-2 rounded-full transition-colors hover:bg-opacity-20"
            style={{ 
              backgroundColor: 'rgba(48, 51, 128, 0.1)',
              color: '#303380'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(48, 51, 128, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(48, 51, 128, 0.1)';
            }}
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlayPause}
            className="p-3 rounded-full transition-all transform hover:scale-105"
            style={{ 
              backgroundColor: '#303380',
              color: 'white'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#252a6b';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#303380';
            }}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>

          {/* Skip Forward */}
          <button
            onClick={skipForward}
            className="p-2 rounded-full transition-colors hover:bg-opacity-20"
            style={{ 
              backgroundColor: 'rgba(48, 51, 128, 0.1)',
              color: '#303380'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(48, 51, 128, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(48, 51, 128, 0.1)';
            }}
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4" style={{ color: 'rgba(48, 51, 128, 0.7)' }} />
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="w-20 h-1 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #303380 0%, #303380 ${volume * 100}%, rgba(48, 51, 128, 0.2) ${volume * 100}%, rgba(48, 51, 128, 0.2) 100%)`,
              outline: 'none'
            }}
          />
        </div>
      </div>

    </div>
  );
};

export default AudioPlayer;
