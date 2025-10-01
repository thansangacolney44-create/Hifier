export type Song = {
  id: string;
  title: string;
  artists: string[];
  artist: string; // This will be a joined string of artists
  album: string;
  coverUrl: string;
  musicUrl: string;
  userId: string;
  userName: string;
  createdAt: any;
  metadata?: string;
  quality?: string; // e.g., FLAC, WAV, MP3
};
