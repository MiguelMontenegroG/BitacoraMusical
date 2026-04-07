'use client';

import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Send, Music, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { useRecommendations } from '@/hooks/useRecommendations';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { searchMusic, SearchResult } from '@/lib/lastfm';

export function RecommendationForm() {
  const { submitRecommendation } = useRecommendations();
  const [isLoading, setIsLoading] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  
  // Estados para el buscador
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<SearchResult | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreResults, setHasMoreResults] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'album' | 'song'>('all');
  
  const [formData, setFormData] = useState({
    message: '',
    recommender_name: '',
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setCurrentPage(1);

    try {
      const results = await searchMusic(searchQuery, 1, filterType === 'all' ? undefined : filterType);
      
      if (results.length === 0) {
        toast.error('No se encontraron resultados. Intenta con otro término.');
        setShowResults(false);
      } else {
        setSearchResults(results);
        setHasMoreResults(results.length === 12);
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
      const moreResults = await searchMusic(searchQuery, nextPage, filterType === 'all' ? undefined : filterType);
      
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

  const handleSelectTrack = (result: SearchResult) => {
    setSelectedTrack(result);
    setShowResults(false);
    setSearchQuery('');
    toast.success(`✓ ${result.title} - ${result.artist}`);
  };

  const clearSelection = () => {
    setSelectedTrack(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTrack) {
      toast.error('Por favor busca y selecciona una canción o álbum');
      return;
    }

    setIsLoading(true);
    
    try {
      await submitRecommendation({
        title: selectedTrack.title,
        artist: selectedTrack.artist,
        message: formData.message.trim(),
        recommender_name: isAnonymous ? undefined : formData.recommender_name.trim() || undefined,
        is_anonymous: isAnonymous,
      });

      toast.success('¡Recomendación enviada con éxito! 🎵', {
        description: 'Gracias por compartir tu música conmigo',
        duration: 5000,
      });
      
      // Reset form
      setFormData({
        message: '',
        recommender_name: '',
      });
      setSelectedTrack(null);
      setIsAnonymous(false);
      
      // Scroll suave hacia arriba para que el usuario vea el toast
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al enviar la recomendación. Intenta de nuevo.', {
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-secondary to-card border-border p-6">
      <div className="flex items-center gap-2 mb-4">
        <Music className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Recomiéndame Música</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        ¿Hay algún álbum o canción que deba escuchar? ¡Déjame tu recomendación!
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Buscador de canciones */}
        {!selectedTrack ? (
          <div className="space-y-3">
            <Label>Buscar canción o álbum *</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Escribe el nombre de la canción o álbum..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch(e as any);
                    }
                  }}
                  className="pl-10 bg-secondary border-border hover:border-primary/50 focus:border-primary"
                />
              </div>
              <Button type="button" onClick={handleSearch} disabled={isSearching}>
                {isSearching ? 'Buscando...' : 'Buscar'}
              </Button>
            </div>
            
            {/* Filtros de tipo */}
            <div className="flex gap-2">
              {/* <Button
                type="button"
                variant={filterType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('all')}
                className="flex-1 text-xs"
              >
                Todos
              </Button> */}
              <Button
                type="button"
                variant={filterType === 'album' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('album')}
                className="flex-1 text-xs"
              >
                 Álbumes
              </Button>
              <Button
                type="button"
                variant={filterType === 'song' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('song')}
                className="flex-1 text-xs"
              >
                 Canciones
              </Button>
            </div>
          </div>
        ) : (
          /* Preview de selección */
          <div className="space-y-3">
            <Label>Canción seleccionada ✓</Label>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-primary/30">
              <img 
                src={selectedTrack.coverUrl} 
                alt={selectedTrack.title}
                className="w-16 h-16 rounded object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{selectedTrack.title}</p>
                <p className="text-sm text-muted-foreground truncate">{selectedTrack.artist}</p>
                <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-primary/20 text-primary">
                  {selectedTrack.type === 'album' ? '💿 Álbum' : '🎵 Canción'}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="message">Mensaje (opcional)</Label>
          <Textarea
            id="message"
            placeholder="¿Por qué me recomiendas esto? Cuéntame más..."
            value={formData.message}
            onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
            rows={3}
          />
        </div>

        <div className="space-y-3 pt-4 border-t-2 border-primary/20">
          <div className="flex items-center space-x-3 bg-secondary/50 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
            <Checkbox
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary h-5 w-5 border-2"
            />
            <Label htmlFor="anonymous" className="text-sm font-medium cursor-pointer select-none text-foreground">
              👤 Enviar como anónimo
            </Label>
          </div>

          {!isAnonymous && (
            <div className="space-y-2 animate-in slide-in-from-top-2">
              <Label htmlFor="name">Tu nombre (opcional)</Label>
              <Input
                id="name"
                placeholder="¿Cómo te llamas?"
                value={formData.recommender_name}
                onChange={(e) => setFormData(prev => ({ ...prev, recommender_name: e.target.value }))}
              />
            </div>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Enviando...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Enviar Recomendación
            </>
          )}
        </Button>
      </form>

      {/* Modal de resultados de búsqueda */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="bg-card border-border max-w-5xl h-[80vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Seleccionar canción o álbum</DialogTitle>
            <DialogDescription>
              Elige la canción o álbum que quieres recomendar.
            </DialogDescription>
          </DialogHeader>
          
          {/* Scrollable Results Area */}
          <div className="flex-1 overflow-y-auto pr-2">
            {searchResults.filter(result => 
              filterType === 'all' ? true : result.type === filterType
            ).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No hay resultados para este filtro</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {searchResults
                  .filter(result => filterType === 'all' ? true : result.type === filterType)
                  .map((result, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectTrack(result)}
                      className="group overflow-hidden rounded-lg bg-secondary hover:bg-secondary/80 transition-all text-left"
                    >
                      <div className="aspect-square overflow-hidden bg-muted relative">
                        <img
                          src={result.coverUrl}
                          alt={result.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        {/* Badge de tipo */}
                        <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/70 backdrop-blur-sm">
                          <span className="text-xs text-white font-medium">
                            {result.type === 'album' ? '💿 Álbum' : '🎵 Canción'}
                          </span>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="font-medium text-sm truncate text-foreground">
                          {result.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {result.artist}
                        </p>
                      </div>
                    </button>
                  ))}
              </div>
            )}
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
    </Card>
  );
}
