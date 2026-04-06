'use client';

import { useState } from 'react';
import { MusicEntry } from '@/hooks/useMusicJournal';
import { Disc, Star, Music } from 'lucide-react';
import { AlbumDetailsModal } from './AlbumDetailsModal';

interface AlbumsViewProps {
  entries: MusicEntry[];
  existingEntries: MusicEntry[];
  onAddEntry: (entry: Omit<MusicEntry, 'id' | 'date'>) => Promise<void>;
  onUpdateEntry: (id: string, updates: Partial<MusicEntry>) => Promise<void>;
}

export function AlbumsView({ entries, existingEntries, onAddEntry, onUpdateEntry }: AlbumsViewProps) {
  const [selectedAlbum, setSelectedAlbum] = useState<{
    title: string;
    artist: string;
    coverUrl: string;
  } | null>(null);
  const [showAlbumDetails, setShowAlbumDetails] = useState(false);

  // Filtrar solo álbumes (entradas de tipo 'album')
  const albums = entries.filter(entry => entry.type === 'album');

  // Agrupar por álbum único (evitar duplicados)
  const uniqueAlbums = albums.reduce((acc, album) => {
    const key = `${album.title} - ${album.artist}`;
    if (!acc[key]) {
      acc[key] = album;
    }
    return acc;
  }, {} as Record<string, MusicEntry>);

  const albumList = Object.values(uniqueAlbums);

  if (albumList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-muted-foreground text-center space-y-2">
          <Disc className="h-16 w-16 mx-auto opacity-50" />
          <p className="text-xl">📀 No albums yet</p>
          <p className="text-sm">Search for an album and rate it to see it here!</p>
        </div>
      </div>
    );
  }

  const handleOpenAlbum = (album: MusicEntry) => {
    setSelectedAlbum({
      title: album.title,
      artist: album.artist,
      coverUrl: album.coverUrl,
    });
    setShowAlbumDetails(true);
  };

  // Calcular estadísticas para cada álbum
  const getAlbumStats = (album: MusicEntry) => {
    const songs = entries.filter(
      e => e.type === 'song' && 
           entries.some(a => a.type === 'album' && a.title === album.title && a.artist === album.artist)
    );
    
    // Buscar canciones que coincidan con este álbum específico
    const albumSongs = entries.filter(e => {
      // Verificar si esta canción pertenece a este álbum
      // Usamos una heurística simple: mismo artista y la canción podría estar en el álbum
      return e.type === 'song' && e.artist === album.artist;
    });

    const ratedSongsCount = albumSongs.length;
    const averageRating = albumSongs.length > 0
      ? Math.round((albumSongs.reduce((sum, s) => sum + s.rating, 0) / albumSongs.length) * 10) / 10
      : null;

    return { ratedSongsCount, averageRating };
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {albumList.map((album) => {
          const stats = getAlbumStats(album);
          
          return (
            <div
              key={album.id}
              onClick={() => handleOpenAlbum(album)}
              className="group relative rounded-lg overflow-hidden bg-secondary border border-border hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 cursor-pointer"
            >
              {/* Cover Image */}
              <div className="aspect-square overflow-hidden bg-muted relative">
                <img
                  src={album.coverUrl}
                  alt={album.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary/90 text-primary-foreground px-4 py-2 rounded-full text-sm font-medium">
                    Ver Canciones
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-3 space-y-2">
                {/* Title and Artist */}
                <div>
                  <p className="font-semibold text-sm text-foreground truncate">
                    {album.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {album.artist}
                  </p>
                </div>

                {/* Album Rating */}
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    {album.rating.toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">/10</span>
                </div>

                {/* Songs Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <Music className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {stats.ratedSongsCount} canciones calificadas
                    </span>
                  </div>
                  
                  {stats.averageRating !== null && (
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="h-3 w-3 fill-accent text-accent" />
                      <span className="text-accent font-medium">
                        Promedio: {stats.averageRating.toFixed(1)}/10
                      </span>
                    </div>
                  )}
                </div>

                {/* Date */}
                <p className="text-xs text-muted-foreground">
                  {new Date(album.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Album Details Modal */}
      {selectedAlbum && (
        <AlbumDetailsModal
          isOpen={showAlbumDetails}
          onClose={() => {
            setShowAlbumDetails(false);
            setSelectedAlbum(null);
          }}
          album={selectedAlbum}
          onSubmit={async (entry) => {
            // Verificar si ya existe una entrada similar
            const existingEntry = existingEntries.find(
              e => e.title === entry.title && e.artist === entry.artist && e.type === entry.type
            );
            
            if (existingEntry) {
              // Actualizar entrada existente
              await onUpdateEntry(existingEntry.id, entry);
            } else {
              // Crear nueva entrada
              await onAddEntry(entry);
            }
          }}
          existingEntries={existingEntries}
        />
      )}
    </>
  );
}
