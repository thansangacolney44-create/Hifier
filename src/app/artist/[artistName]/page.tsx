'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Song } from '@/lib/data';
import { MusicCard } from '@/components/music-card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function ArtistPage() {
  const params = useParams();
  const artistName = decodeURIComponent(params.artistName as string);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!artistName) return;

    const fetchSongs = async () => {
      setLoading(true);
      const songsQuery = query(collection(db, 'songs'), where('artists', 'array-contains', artistName));
      const querySnapshot = await getDocs(songsQuery);
      const songsData: Song[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        songsData.push({
          id: doc.id,
          title: data.title,
          artists: data.artists,
          artist: data.artists.join(', '),
          album: data.album,
          coverUrl: data.coverUrl,
          musicUrl: data.musicUrl,
          userId: data.userId,
          userName: data.userName,
          createdAt: data.createdAt,
          quality: data.musicUrl.split('.').pop()?.toUpperCase(),
        });
      });
      setSongs(songsData);
      setLoading(false);
    };

    fetchSongs();
  }, [artistName]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center gap-6">
        <Avatar className="h-32 w-32">
            <AvatarFallback className="text-5xl">{artistName?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
            <p className="text-sm text-muted-foreground">Artist</p>
            <h1 className="text-6xl font-bold tracking-tight">{artistName}</h1>
        </div>
      </div>
      
      <div>
        <h2 className="mb-4 text-2xl font-bold tracking-tight">Songs</h2>
        {songs.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {songs.map((song, index) => (
              <MusicCard key={song.id} song={song} playlist={songs} coverImage={PlaceHolderImages[index % PlaceHolderImages.length]} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No songs found for this artist.</p>
        )}
      </div>
    </div>
  );
}
