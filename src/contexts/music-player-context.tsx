'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Song } from '@/lib/data';

type RepeatMode = 'off' | 'all' | 'one';

interface MusicPlayerContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  queue: Song[];
  isShuffling: boolean;
  repeatMode: RepeatMode;
  volume: number;
  isMuted: boolean;
  playSong: (song: Song, playlist: Song[]) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrev: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<Song[]>([]);
  const [originalQueue, setOriginalQueue] = useState<Song[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const playSong = (song: Song, playlist: Song[]) => {
    setCurrentSong(song);
    setQueue(playlist);
    setOriginalQueue(playlist);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (currentSong) {
      setIsPlaying(!isPlaying);
    }
  };

  const playNext = () => {
    if (!currentSong) return;

    if (repeatMode === 'one' && isPlaying) {
      // handled in player component, but as a fallback
      const audio = document.querySelector('audio');
      if(audio) audio.currentTime = 0;
      return;
    }

    const currentIndex = queue.findIndex(s => s.id === currentSong.id);
    let nextIndex = currentIndex + 1;
    
    if (nextIndex >= queue.length) {
        if (repeatMode === 'all') {
            nextIndex = 0;
        } else {
            setIsPlaying(false);
            return;
        }
    }
    
    setCurrentSong(queue[nextIndex]);
    setIsPlaying(true);
  };

  const playPrev = () => {
    if (!currentSong) return;
    
    const currentIndex = queue.findIndex(s => s.id === currentSong.id);
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = queue.length - 1;
    }
    
    setCurrentSong(queue[prevIndex]);
    setIsPlaying(true);
  };

  const toggleShuffle = () => {
    setIsShuffling(prev => {
        const isShufflingNow = !prev;
        if (isShufflingNow) {
            const currentSongIndex = originalQueue.findIndex(s => s.id === currentSong?.id);
            const shuffled = [...originalQueue].sort(() => Math.random() - 0.5);
            // Move current song to the beginning of the shuffled queue
            const newCurrentIndex = shuffled.findIndex(s => s.id === currentSong?.id);
            if(newCurrentIndex > -1) {
                [shuffled[0], shuffled[newCurrentIndex]] = [shuffled[newCurrentIndex], shuffled[0]];
            }
            setQueue(shuffled);
        } else {
            setQueue(originalQueue);
        }
        return isShufflingNow;
    });
  };

  const toggleRepeat = () => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  const handleSetVolume = (vol: number) => {
    setVolume(vol);
    if (vol > 0) setIsMuted(false);
  }

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  const value = {
    currentSong,
    isPlaying,
    queue,
    isShuffling,
    repeatMode,
    volume,
    isMuted,
    playSong,
    togglePlay,
    playNext,
    playPrev,
    toggleShuffle,
    toggleRepeat,
    setVolume: handleSetVolume,
    toggleMute,
  };

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
    </MusicPlayerContext.Provider>
  );
}

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (context === undefined) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
};
