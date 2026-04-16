import React, { useState, useRef, useEffect } from 'react';

interface VoiceBubbleProps {
  url: string;
  duration?: number;
  timestamp?: string;
  isOwn?: boolean;
}

export default function VoiceBubble({ url, duration, timestamp, isOwn }: VoiceBubbleProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      const p = (audio.currentTime / audio.duration) * 100;
      setProgress(p || 0);
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Static waveform for visual feedback
  const barCount = 24;
  const bars = [12, 18, 14, 22, 16, 26, 20, 28, 22, 24, 18, 20, 16, 22, 18, 24, 20, 26, 22, 18, 14, 20, 16, 12];

  return (
    <div className={`flex items-center gap-3 py-2 px-1 min-w-[200px] ${isOwn ? 'text-white' : 'text-gray-900'}`}>
      <audio ref={audioRef} src={url} preload="metadata" />
      
      <button 
        onClick={togglePlay}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          isOwn ? 'bg-white/20 hover:bg-white/30' : 'bg-primary/10 hover:bg-primary/20 text-primary'
        }`}
      >
        <span className="material-symbols-outlined text-[24px]">
          {isPlaying ? 'pause' : 'play_arrow'}
        </span>
      </button>

      <div className="flex-1">
        <div className="flex items-center gap-[3px] h-8 mb-1">
          {bars.map((h, i) => (
            <div 
              key={i} 
              className="w-[3px] rounded-full transition-all duration-300" 
              style={{ 
                height: `${h}px`,
                backgroundColor: (i / barCount * 100 < progress) 
                  ? (isOwn ? '#fff' : 'var(--color-primary)') 
                  : (isOwn ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)')
              }} 
            />
          ))}
        </div>
        <div className="flex justify-between items-center text-[10px] font-bold opacity-60">
          <span>{isPlaying ? formatDuration(currentTime) : (duration ? formatDuration(duration) : '0:00')}</span>
          {timestamp && <span>{timestamp}</span>}
        </div>
      </div>
    </div>
  );
}
