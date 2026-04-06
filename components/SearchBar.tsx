'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { RatingModal } from './RatingModal';
import { AlbumDetailsModal } from './AlbumDetailsModal';
import { MusicEntry } from '@/hooks/useMusicJournal';
import { toast } from 'sonner';
import { searchMusic, SearchResult } from '@/lib/lastfm';

interface SearchBarProps {
  onAddEntry: (entry: Omit<MusicEntry, 'id' | 'date'>) => void;
  existingEntries: MusicEntry[];
}

export function SearchBar({ onAddEntry, existingEntries }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showAlbumDetails, setShowAlbumDetails] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreResults, setHasMoreResults] = useState(true);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setCurrentPage(1);

    try {
      const results = await searchMusic(searchQuery, 1);
      
      if (results.length === 0) {
        toast.error('No se encontraron resultados. Intenta con otro término.');
        setShowResults(false);
      } else {
        setSearchResults(results);
        setHasMoreResults(results.length === 12); // Si hay 12 resultados, probablemente hay más
        setShowResults(true);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Error al buscar. Intenta de nuevo.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleLoadMore = async () => {
    const nextPage = currentPage + 1;
    setIsSearching(true);

    try {
      const moreResults = await searchMusic(searchQuery, nextPage);
      
      if (moreResults.length > 0) {
        setSearchResults(prev => [...prev, ...moreResults]);
        setCurrentPage(nextPage);
        setHasMoreResults(moreResults.length === 12);
      } else {
        setHasMoreResults(false);
        toast.info('No hay más resultados');
      }
    } catch (error) {
      console.error('Load more error:', error);
      toast.error('Error al cargar más resultados');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    setSelectedResult(result);
    
    // Si es un álbum, mostrar detalles con tracklist
    if (result.type === 'album') {
      setShowAlbumDetails(true);
      setShowResults(false); // Cerrar modal de búsqueda
    } else {
      // Si es una canción, ir directo al rating
      setShowRatingModal(true);
    }
  };

  const handleAddEntry = async (entry: Omit<MusicEntry, 'id' | 'date'>) => {
    try {
      await onAddEntry(entry);
      toast.success('¡Entrada agregada exitosamente!');
      setShowRatingModal(false);
      setSearchQuery('');
      setSearchResults([]);
      setShowResults(false);
      setSelectedResult(null);
    } catch (error) {
      if (error instanceof Error && error.message.includes('iniciar sesión')) {
        toast.error('Debes iniciar sesión para agregar entradas');
      } else {
        toast.error('Error al agregar la entrada. Intenta de nuevo.');
      }
      console.error('Error adding entry:', error);
    }
  };

  // Handler especial para canciones dentro del AlbumDetailsModal (no cierra el modal)
  const handleAddTrackFromAlbum = async (entry: Omit<MusicEntry, 'id' | 'date'>) => {
    console.log('🎵 Guardando canción desde álbum:', entry.title);
    try {
      await onAddEntry(entry);
      console.log('✅ Canción guardada correctamente, modal permanece abierto');
      // No mostramos toast aquí porque AlbumDetailsModal ya lo hace
      // No cerramos ningún modal - permitimos seguir calificando canciones
    } catch (error) {
      console.error('❌ Error adding track:', error);
      toast.error('Error al guardar la canción');
    }
  };

  return (
    <>
      <form onSubmit={handleSearch} className="w-full">
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for albums or songs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary border-border hover:border-primary/50 focus:border-primary"
            />
          </div>
          <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isSearching}>
            {isSearching ? 'Buscando...' : 'Search'}
          </Button>
        </div>
      </form>

      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="bg-card border-border max-w-5xl h-[80vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Search Results</DialogTitle>
            <DialogDescription>
              Select an album or song to add to your journal.
            </DialogDescription>
          </DialogHeader>
          
          {/* Scrollable Results Area */}
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {searchResults.map((result, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectResult(result)}
                  className="group overflow-hidden rounded-lg bg-secondary hover:bg-secondary/80 transition-all"
                >
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img
                      src={result.coverUrl}
                      alt={result.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="p-3 text-left">
                    <p className="font-medium text-sm truncate text-foreground">
                      {result.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {result.artist}
                    </p>
                    <p className="text-xs text-primary mt-1">
                      {result.type === 'album' ? '💿 Album' : '🎵 Canción'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Load More Button - Fixed at bottom */}
          {hasMoreResults && (
            <div className="flex-shrink-0 mt-4 pt-4 border-t border-border">
              <Button
                onClick={handleLoadMore}
                disabled={isSearching}
                variant="outline"
                className="w-full"
              >
                {isSearching ? 'Cargando...' : 'Cargar más resultados'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {selectedResult && (
        <>
          {/* Rating Modal for Songs */}
          <RatingModal
            isOpen={showRatingModal}
            onClose={() => setShowRatingModal(false)}
            music={selectedResult}
            onSubmit={handleAddEntry}
          />
          
          {/* Album Details Modal with Tracklist */}
          <AlbumDetailsModal
            isOpen={showAlbumDetails}
            onClose={() => {
              setShowAlbumDetails(false);
              setShowResults(true); // Volver a mostrar resultados de búsqueda
            }}
            album={selectedResult}
            onSubmit={handleAddEntry}
            existingEntries={existingEntries}
          />
        </>
      )}
    </>
  );
}
