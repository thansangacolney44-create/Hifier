import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/header';
import { AuthProvider } from '@/contexts/auth-context';
import { MusicPlayerProvider } from '@/contexts/music-player-context';
import MusicPlayer from '@/components/music-player';

export const metadata: Metadata = {
  title: 'Hifier - High Fidelity Music',
  description: 'Stream and download high-quality audio.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/icon-192x192.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="theme-color" content="#00a0a0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn('min-h-screen bg-background font-body antialiased')}>
        <AuthProvider>
          <MusicPlayerProvider>
            <div className="relative flex min-h-screen flex-col">
              <Header />
              <main className="flex-1 pb-24">{children}</main>
              <MusicPlayer />
            </div>
            <Toaster />
          </MusicPlayerProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
