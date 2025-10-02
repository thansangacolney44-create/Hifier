'use client';

import { Input } from '@/components/ui/input';
import { Loader2, SearchIcon } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { MusicCard } from '@/components/music-card';
import type { Song } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { searchMusic } from '@/ai/flows/search-flow';
import { useDebounce } from '@/hooks/use-debounce';

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    const fetchSongs = async () => {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'songs'));
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
      setAllSongs(songsData);
      setFilteredSongs(songsData); // Initially show all songs
      setLoading(false);
    };

    fetchSongs();
  }, []);

  const handleSearch = async (term: string) => {
    if (term.trim() === '') {
      setFilteredSongs(allSongs);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const aiResponse = await searchMusic({ query: term });
      const correctedQuery = aiResponse.correctedQuery.toLowerCase();
      
      const results = allSongs.filter(
        (song) =>
          song.title.toLowerCase().includes(correctedQuery) ||
          song.artists.some(artist => artist.toLowerCase().includes(correctedQuery)) ||
          song.album.toLowerCase().includes(correctedQuery)
      );
      setFilteredSongs(results);
    } catch (error) {
      console.error('AI search failed, falling back to basic search:', error);
      const basicQuery = term.toLowerCase();
      const results = allSongs.filter(
        (song) =>
          song.title.toLowerCase().includes(basicQuery) ||
          song.artists.some(artist => artist.toLowerCase().includes(basicQuery)) ||
          song.album.toLowerCase().includes(basicQuery)
      );
      setFilteredSongs(results);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    handleSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, allSongs]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="relative mb-8">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search for songs, artists, or albums..."
          className="w-full rounded-full bg-muted pl-10 pr-4 py-6 text-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {isSearching && (
           <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-bold tracking-tight">
          {searchTerm ? `Results for "${searchTerm}"` : 'Browse all music'}
        </h2>
        {loading ? (
          <div className="flex justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : filteredSongs.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filteredSongs.map((song, index) => (
              <MusicCard key={song.id} song={song} playlist={filteredSongs} coverImage={PlaceHolderImages[index % PlaceHolderImages.length]} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No results found.</p>
        )}
      </div>
    </div>
  );
}
