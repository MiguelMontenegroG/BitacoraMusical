'use client';

import { useState } from 'react';
import { MusicEntry } from '@/hooks/useMusicJournal';
import { Disc, Star, Music, Search, X } from 'lucide-react';
import { AlbumDetailsModal } from './AlbumDetailsModal';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

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
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrar álbumes y EPs (entradas de tipo 'album' o 'ep')
  const allAlbums = entries.filter(entry => entry.type === 'album' || entry.type === 'ep');

  // Agrupar por álbum único (evitar duplicados)
  const uniqueAlbumsMap = allAlbums.reduce((acc, album) => {
    const key = `${album.title} - ${album.artist}`;
    if (!acc[key]) {
      acc[key] = album;
    }
    return acc;
  }, {} as Record<string, MusicEntry>);

  let albumList = Object.values(uniqueAlbumsMap);

  // Filtrar por búsqueda si hay query
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    
    // Encontrar artistas que tienen canciones que coinciden con la búsqueda
    const artistsWithMatchingSongs = new Set(
      entries
        .filter(e => e.type === 'song' && e.title.toLowerCase().includes(query))
        .map(song => song.artist.toLowerCase())
    );
    
    albumList = albumList.filter(album => {
      // Buscar por nombre de álbum
      const matchTitle = album.title.toLowerCase().includes(query);
      
      // Buscar por artista
      const matchArtist = album.artist.toLowerCase().includes(query);
      
      // Buscar si este artista tiene canciones que coinciden
      const hasMatchingSongs = artistsWithMatchingSongs.has(album.artist.toLowerCase());
      
      return matchTitle || matchArtist || hasMatchingSongs;
    });
  }

  if (allAlbums.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-muted-foreground text-center space-y-2">
          <Disc className="h-16 w-16 mx-auto opacity-50" />
          <p className="text-xl">📀 Aún no hay álbumes o EPs</p>
          <p className="text-sm">¡Busca un álbum o EP y califícalo para verlo aquí!</p>
        </div>
      </div>
    );
  }

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleOpenAlbum = (album: MusicEntry) => {
    setSelectedAlbum({
      title: album.title,
      artist: album.artist,
      coverUrl: album.coverUrl,
    });
    setShowAlbumDetails(true);
  };

  // Calcular estadísticas para cada álbum/EP
  const getAlbumStats = (album: MusicEntry) => {
    // Buscar canciones que coincidan con este álbum específico
    const albumSongs = entries.filter(e => {
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
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por álbum, artista o canción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 bg-secondary border-border hover:border-primary/50 focus:border-primary"
          />
          {searchQuery && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {searchQuery && (
          <p className="text-xs text-muted-foreground mt-2">
            {albumList.length} resultado{albumList.length !== 1 ? 's' : ''} encontrado{albumList.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {albumList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="text-muted-foreground text-center space-y-2">
            <Search className="h-16 w-16 mx-auto opacity-50" />
            <p className="text-xl">No se encontraron resultados</p>
            <p className="text-sm">Intenta con otro término de búsqueda</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {albumList.map((album) => {
          const stats = getAlbumStats(album);
          
          return (
            <div
              key={album.id}
              onClick={() => handleOpenAlbum(album)}
              className="group relative rounded-xl overflow-hidden bg-secondary border border-border hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 cursor-pointer"
            >
              {/* Cover Image */}
              <div className="aspect-square overflow-hidden bg-muted relative">
                <img
                  src={album.coverUrl}
                  alt={album.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                {/* Overlay con botón de ver canciones */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                  <span className="text-white font-medium text-sm flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    Ver canciones
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                {/* Title and Artist */}
                <div>
                  <p className="font-semibold text-base text-foreground truncate" title={album.title}>
                    {album.title}
                  </p>
                  <p className="text-sm text-muted-foreground truncate" title={album.artist}>
                    {album.artist}
                  </p>
                </div>

                {/* Match Badges - Solo mostrar cuando hay búsqueda */}
                {searchQuery && (
                  <div className="flex flex-wrap gap-1">
                    {/* Verificar match por título */}
                    {album.title.toLowerCase().includes(searchQuery.toLowerCase()) && (
                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-blue-500/20 text-blue-600 border-blue-500/30">
                        💿 Álbum
                      </Badge>
                    )}
                    {/* Verificar match por artista (solo si no hay match por título) */}
                    {!album.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
                     album.artist.toLowerCase().includes(searchQuery.toLowerCase()) && (
                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-purple-500/20 text-purple-600 border-purple-500/30">
                        👤 Artista
                      </Badge>
                    )}
                    {/* Verificar si el artista tiene canciones que coinciden */}
                    {entries.some(e => 
                      e.type === 'song' && 
                      e.artist.toLowerCase() === album.artist.toLowerCase() &&
                      e.title.toLowerCase().includes(searchQuery.toLowerCase())
                    ) && !album.title.toLowerCase().includes(searchQuery.toLowerCase()) && (
                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-green-500/20 text-green-600 border-green-500/30">
                        🎵 Tiene canción(es)
                      </Badge>
                    )}
                  </div>
                )}

                {/* Album Rating */}
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-primary text-primary" />
                  <span className="text-base font-bold text-foreground">
                    {album.rating.toFixed(1)}
                  </span>
                  <span className="text-sm text-muted-foreground">/10</span>
                </div>

                {/* Songs Info */}
                <div className="space-y-2 pt-1 border-t border-border/50">
                  <div className="flex items-center gap-2 text-sm">
                    <Music className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {stats.ratedSongsCount} canciones calificadas
                    </span>
                  </div>
                  
                  {stats.averageRating !== null && (
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="h-4 w-4 fill-accent text-accent" />
                      <span className="text-accent font-semibold">
                        Promedio: {stats.averageRating.toFixed(1)}/10
                      </span>
                    </div>
                  )}
                </div>

                {/* Date */}
                <p className="text-xs text-muted-foreground pt-1">
                  {new Date(album.date).toLocaleDateString('es-ES', {
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
      )}

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
            
            let result;
            if (existingEntry) {
              // Actualizar entrada existente
              result = await onUpdateEntry(existingEntry.id, entry);
            } else {
              // Crear nueva entrada
              result = await onAddEntry(entry);
            }
            
            if (!result) {
              toast.error('Debes iniciar sesión para guardar');
            }
          }}
          existingEntries={existingEntries}
        />
      )}
    </>
  );
}
