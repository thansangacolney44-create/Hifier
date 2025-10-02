'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useMusicPlayer } from '@/contexts/music-player-context';
import { Slider } from '@/components/ui/slider';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Repeat1,
  Download,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { formatTime } from '@/lib/utils';
import Link from 'next/link';

export default function MusicPlayer() {
  const {
    currentSong,
    isPlaying,
    togglePlay,
    playNext,
    playPrev,
    isShuffling,
    toggleShuffle,
    repeatMode,
    toggleRepeat,
    volume,
    setVolume,
    isMuted,
    toggleMute,
  } = useMusicPlayer();
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(e => console.error("Audio play failed:", e));
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSong]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setProgress(value[0]);
    }
  };
  
  const handleSongEnd = () => {
    if (repeatMode === 'one') {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
        }
    } else {
        playNext();
    }
  };

  const handleDownload = async () => {
    if (!currentSong) return;
    try {
      // Firebase Storage URLs need to be fetched via proxy to bypass CORS issues for direct download
      const response = await fetch(currentSong.musicUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${currentSong.title} - ${currentSong.artist}.${currentSong.musicUrl.split('.').pop()?.split('?')[0]}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (!currentSong) {
    return null;
  }

  const artistLinks = currentSong.artists.map((artist, index) => (
    <Link
      key={artist}
      href={`/artist/${encodeURIComponent(artist)}`}
      className="hover:text-primary hover:underline"
      onClick={() => setIsNowPlayingOpen(false)}
    >
      {artist}
      {index < currentSong.artists.length - 1 && ', '}
    </Link>
  ));

  const PlayerControls = ({ isModal = false }: { isModal?: boolean }) => (
    <div className={`flex items-center gap-4 ${isModal ? 'justify-center' : ''}`}>
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleShuffle}
            className={isShuffling ? 'text-primary' : ''}
        >
            <Shuffle className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={playPrev}>
            <SkipBack className="h-6 w-6" />
        </Button>
        <Button
            variant="default"
            size="icon"
            className="h-14 w-14 rounded-full"
            onClick={togglePlay}
        >
            {isPlaying ? (
                <Pause className="h-8 w-8 fill-current" />
            ) : (
                <Play className="h-8 w-8 fill-current" />
            )}
        </Button>
        <Button variant="ghost" size="icon" onClick={playNext}>
            <SkipForward className="h-6 w-6" />
        </Button>
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleRepeat}
            className={repeatMode !== 'off' ? 'text-primary' : ''}
        >
            {repeatMode === 'one' ? (
                <Repeat1 className="h-5 w-5" />
            ) : (
                <Repeat className="h-5 w-5" />
            )}
        </Button>
    </div>
  );

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 flex h-24 items-center border-t border-border/40 bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex w-1/4 items-center gap-4">
          <button onClick={() => setIsNowPlayingOpen(true)} className="block">
            <Image
              src={currentSong.coverUrl}
              alt={currentSong.album}
              width={56}
              height={56}
              className="rounded-md object-cover"
            />
          </button>
          <div className="flex flex-col">
            <button onClick={() => setIsNowPlayingOpen(true)} className="block text-left">
                <p className="truncate font-semibold hover:underline">{currentSong.title}</p>
            </button>
            <div className="truncate text-sm text-muted-foreground">{artistLinks}</div>
          </div>
        </div>
        <div className="flex w-1/2 flex-col items-center gap-2">
          <PlayerControls />
          <div className="flex w-full items-center gap-4">
            <span className="text-xs text-muted-foreground">{formatTime(progress)}</span>
            <Slider
              value={[progress]}
              max={duration}
              step={1}
              onValueChange={handleSeek}
              className="w-full"
            />
            <span className="text-xs text-muted-foreground">{formatTime(duration)}</span>
          </div>
        </div>
        <div className="flex w-1/4 items-center justify-end gap-4">
          <Button variant="ghost" size="icon" onClick={handleDownload}>
            <Download className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2" style={{width: '150px'}}>
            <Button variant="ghost" size="icon" onClick={toggleMute}>
                {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
            <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.01}
                onValueChange={(value) => setVolume(value[0])}
            />
          </div>
        </div>
      </div>
      
      <Dialog open={isNowPlayingOpen} onOpenChange={setIsNowPlayingOpen}>
        <DialogContent className="h-screen max-h-screen w-screen max-w-full border-0 bg-gradient-to-b from-primary/20 to-background p-0 sm:rounded-none">
          <div className="container relative mx-auto flex h-full flex-col justify-center gap-12 pt-14 text-center">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsNowPlayingOpen(false)}
                className="absolute right-6 top-6"
            >
                <X className="h-6 w-6" />
            </Button>
            <div className="flex flex-col items-center gap-8">
                <Image
                    src={currentSong.coverUrl}
                    alt={currentSong.album}
                    width={400}
                    height={400}
                    className="rounded-lg object-cover shadow-2xl"
                />
                <div>
                    <h2 className="text-4xl font-bold tracking-tight">{currentSong.title}</h2>
                    <p className="mt-2 text-2xl text-muted-foreground">{artistLinks}</p>
                    <p className="mt-1 text-lg text-muted-foreground/70">{currentSong.album}</p>
                </div>
            </div>

            <div className="flex flex-col items-center gap-4">
                 <div className="flex w-full max-w-lg items-center gap-4">
                    <span className="text-xs text-muted-foreground">{formatTime(progress)}</span>
                    <Slider
                        value={[progress]}
                        max={duration}
                        step={1}
                        onValueChange={handleSeek}
                        className="w-full"
                    />
                    <span className="text-xs text-muted-foreground">{formatTime(duration)}</span>
                </div>
                <PlayerControls isModal />
            </div>

            <div className="absolute bottom-10 right-10 flex items-center gap-4">
                <Button variant="outline" onClick={handleDownload}>
                    <Download className="mr-2 h-5 w-5" />
                    Download
                </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <audio
        ref={audioRef}
        src={currentSong.musicUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleSongEnd}
      />
    </>
  );
}
