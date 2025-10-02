import Image from 'next/image';
import Link from 'next/link';
import type { Song } from '@/lib/data';
import type { ImagePlaceholder } from '@/lib/placeholder-images';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayCircle } from 'lucide-react';
import { useMusicPlayer } from '@/contexts/music-player-context';

interface MusicCardProps {
  song: Song;
  playlist: Song[];
  coverImage?: ImagePlaceholder;
}

export function MusicCard({ song, playlist, coverImage }: MusicCardProps) {
  const { playSong } = useMusicPlayer();

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    playSong(song, playlist);
  };

  const artistLinks = song.artists.map((artist, index) => (
    <Link
      key={artist}
      href={`/artist/${encodeURIComponent(artist)}`}
      className="text-sm text-muted-foreground hover:text-primary hover:underline"
      onClick={(e) => e.stopPropagation()}
    >
      {artist}
      {index < song.artists.length - 1 && ', '}
    </Link>
  ));
  
  return (
    <Card className="group relative overflow-hidden rounded-lg border-0 bg-transparent shadow-none transition-all duration-300">
      <CardContent className="p-0">
        <div className="relative aspect-square">
          <Image
            src={song.coverUrl || (coverImage ? coverImage.imageUrl : '/placeholder.svg')}
            alt={song.album}
            fill
            className="rounded-md object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={coverImage?.imageHint}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              className="h-16 w-16 rounded-full bg-primary/80 text-primary-foreground transition-transform hover:scale-110 hover:bg-primary"
              onClick={handlePlay}
            >
              <PlayCircle className="h-10 w-10" />
            </Button>
          </div>
        </div>
        <div className="mt-3">
          <h3 className="truncate font-semibold text-base">{song.title}</h3>
          <div className="truncate">{artistLinks}</div>
        </div>
      </CardContent>
    </Card>
  );
}
