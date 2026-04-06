'use client';

import { useState } from 'react';
import { MusicEntry } from '@/hooks/useMusicJournal';
import { Card } from './ui/card';
import { Disc, Music, Star, TrendingUp, Award } from 'lucide-react';
import { getArtistInfo } from '@/lib/lastfm';

interface ArtistData {
  name: string;
  entries: MusicEntry[];
  albumCount: number;
  songCount: number;
  averageRating: number;
  coverUrl?: string;
}

interface ArtistDetailsModalProps {
  artist: ArtistData;
  onClose: () => void;
}

function ArtistDetailsModal({ artist, onClose }: ArtistDetailsModalProps) {
  const albums = artist.entries.filter(e => e.type === 'album').sort((a, b) => b.rating - a.rating);
  const songs = artist.entries.filter(e => e.type === 'song').sort((a, b) => b.rating - a.rating);
  
  const albumAvgRating = albums.length > 0 
    ? Math.round((albums.reduce((sum, e) => sum + e.rating, 0) / albums.length) * 10) / 10 
    : 0;
  
  const songAvgRating = songs.length > 0 
    ? Math.round((songs.reduce((sum, e) => sum + e.rating, 0) / songs.length) * 10) / 10 
    : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-card border border-border rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {artist.coverUrl ? (
              <img 
                src={artist.coverUrl} 
                alt={artist.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-primary/20 flex items-center justify-center">
                <span className="text-3xl">🎤</span>
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-foreground">{artist.name}</h2>
              <p className="text-sm text-muted-foreground">
                {artist.entries.length} entradas • {artist.albumCount} álbumes • {artist.songCount} canciones
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b border-border">
          <Card className="bg-secondary border-border p-4 text-center">
            <p className="text-xs text-muted-foreground">Rating General</p>
            <p className="text-2xl font-bold text-primary">{artist.averageRating.toFixed(1)}</p>
          </Card>
          <Card className="bg-secondary border-border p-4 text-center">
            <p className="text-xs text-muted-foreground">Rating Álbumes</p>
            <p className="text-2xl font-bold text-accent">{albumAvgRating.toFixed(1)}</p>
          </Card>
          <Card className="bg-secondary border-border p-4 text-center">
            <p className="text-xs text-muted-foreground">Rating Canciones</p>
            <p className="text-2xl font-bold text-accent">{songAvgRating.toFixed(1)}</p>
          </Card>
          <Card className="bg-secondary border-border p-4 text-center">
            <p className="text-xs text-muted-foreground">Mejor Rating</p>
            <p className="text-2xl font-bold text-primary">
              {Math.max(...artist.entries.map(e => e.rating)).toFixed(1)}
            </p>
          </Card>
        </div>

        {/* Albums Section */}
        {albums.length > 0 && (
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Disc className="h-5 w-5" />
              Álbumes ({albums.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {albums.map((album) => (
                <Card key={album.id} className="bg-secondary border-border overflow-hidden">
                  <div className="aspect-square relative">
                    {album.coverUrl ? (
                      <img 
                        src={album.coverUrl} 
                        alt={album.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Disc className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-primary px-2 py-1 rounded-md">
                      <span className="text-xs font-bold text-primary-foreground">★ {album.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="font-semibold text-sm text-foreground truncate">{album.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(album.date).toLocaleDateString('es-ES', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </p>
                    {album.review && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{album.review}</p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Songs Section */}
        {songs.length > 0 && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Music className="h-5 w-5" />
              Canciones ({songs.length})
            </h3>
            <div className="space-y-2">
              {songs.map((song, index) => (
                <div 
                  key={song.id}
                  className="flex items-center gap-4 p-3 bg-secondary rounded-lg border border-border"
                >
                  <span className="text-sm text-muted-foreground w-6 text-right">#{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{song.title}</p>
                    {song.mood && (
                      <p className="text-xs text-muted-foreground mt-1">Tags: {song.mood}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-accent text-accent" />
                    <span className="text-sm font-bold text-foreground">{song.rating.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface ArtistsViewProps {
  entries: MusicEntry[];
}

export function ArtistsView({ entries }: ArtistsViewProps) {
  const [selectedArtist, setSelectedArtist] = useState<ArtistData | null>(null);

  // Agrupar entradas por artista
  const artistsMap = entries.reduce((acc, entry) => {
    if (!acc[entry.artist]) {
      acc[entry.artist] = [];
    }
    acc[entry.artist].push(entry);
    return acc;
  }, {} as Record<string, MusicEntry[]>);

  // Convertir a array y calcular estadísticas
  const artists: ArtistData[] = Object.entries(artistsMap)
    .map(([name, artistEntries]) => {
      const albums = artistEntries.filter(e => e.type === 'album');
      const songs = artistEntries.filter(e => e.type === 'song');
      const avgRating = Math.round((artistEntries.reduce((sum, e) => sum + e.rating, 0) / artistEntries.length) * 10) / 10;
      
      // Usar la carátula del álbum mejor calificado o la primera disponible
      const bestAlbum = [...albums].sort((a, b) => b.rating - a.rating)[0];
      const coverUrl = bestAlbum?.coverUrl || artistEntries[0]?.coverUrl;

      return {
        name,
        entries: artistEntries,
        albumCount: albums.length,
        songCount: songs.length,
        averageRating: avgRating,
        coverUrl,
      };
    })
    .sort((a, b) => b.entries.length - a.entries.length);

  if (artists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-muted-foreground text-center space-y-2">
          <Award className="h-16 w-16 mx-auto opacity-50" />
          <p className="text-xl">🎤 No hay artistas aún</p>
          <p className="text-sm">Agrega álbumes o canciones para ver tus artistas aquí</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {artists.map((artist, index) => (
          <Card 
            key={artist.name}
            className="bg-gradient-to-br from-secondary/80 to-card/80 backdrop-blur-sm border-border/50 overflow-hidden hover:border-primary/60 transition-all duration-300 cursor-pointer group hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-2 animate-in fade-in zoom-in-95 fill-mode-backwards"
            style={{ animationDelay: `${index * 50}ms` }}
            onClick={() => setSelectedArtist(artist)}
          >
            {/* Cover Image */}
            <div className="aspect-video relative overflow-hidden bg-muted">
              {artist.coverUrl ? (
                <img 
                  src={artist.coverUrl}
                  alt={artist.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl">🎤</span>
                </div>
              )}
              
              {/* Overlay with rating */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-white font-bold">{artist.averageRating.toFixed(1)}</span>
                </div>
              </div>
            </div>

            {/* Artist Info */}
            <div className="p-4">
              <h3 className="font-semibold text-foreground truncate mb-2" title={artist.name}>
                {artist.name}
              </h3>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  {artist.albumCount > 0 && (
                    <span className="flex items-center gap-1">
                      <Disc className="h-3 w-3" />
                      {artist.albumCount}
                    </span>
                  )}
                  {artist.songCount > 0 && (
                    <span className="flex items-center gap-1">
                      <Music className="h-3 w-3" />
                      {artist.songCount}
                    </span>
                  )}
                </div>
                <span className="text-primary font-medium">
                  {artist.entries.length} entradas
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Artist Details Modal */}
      {selectedArtist && (
        <ArtistDetailsModal 
          artist={selectedArtist} 
          onClose={() => setSelectedArtist(null)} 
        />
      )}
    </>
  );
}
