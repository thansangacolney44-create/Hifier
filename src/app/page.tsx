'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Music, Upload, Loader2 } from 'lucide-react';
import { MusicCard } from '@/components/music-card';
import type { Song } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function Home() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'songs'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const songsData: Song[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        songsData.push({
          id: doc.id,
          title: data.title,
          artists: data.artists,
          artist: data.artists.join(', '), // Create a string of artists
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
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[450px] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Home</h1>
          <p className="text-muted-foreground">
            Discover new music and upload your own.
          </p>
        </div>
        {songs.length > 0 && (
          <Button asChild>
            <Link href="/upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload Music
            </Link>
          </Button>
        )}
      </div>
      {songs.length === 0 ? (
        <div className="flex min-h-[450px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Music className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="mt-6 text-xl font-semibold">
            Your music library is empty
          </h2>
          <p className="mt-2 text-center text-muted-foreground">
            Upload your first track to get started.
          </p>
          <Button className="mt-6" asChild>
            <Link href="/upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload Music
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {songs.map((song, index) => (
            <MusicCard
              key={song.id}
              song={song}
              playlist={songs}
              coverImage={PlaceHolderImages[index % PlaceHolderImages.length]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
