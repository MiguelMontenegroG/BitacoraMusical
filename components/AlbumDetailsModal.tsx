'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { MusicEntry } from '@/hooks/useMusicJournal';
import { getAlbumDetails, AlbumDetails, AlbumTrack } from '@/lib/lastfm';
import { Disc, Music, Star, Save, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';

interface AlbumDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  album: {
    title: string;
    artist: string;
    coverUrl: string;
  };
  onSubmit: (entry: Omit<MusicEntry, 'id' | 'date'>) => void;
  existingEntries: MusicEntry[]; // Para verificar qué canciones ya están calificadas
}

export function AlbumDetailsModal({
  isOpen,
  onClose,
  album,
  onSubmit,
  existingEntries,
}: AlbumDetailsModalProps) {
  const [details, setDetails] = useState<AlbumDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado para ratings individuales de cada track
  const [trackRatings, setTrackRatings] = useState<Record<string, { rating: number; review: string; tags: string[] }>>({});
  const [albumRating, setAlbumRating] = useState<{ rating: number; review: string; tags: string[] } | null>(null);
  const [expandedTrack, setExpandedTrack] = useState<string | null>(null);
  const [tagInputs, setTagInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && album.title && album.artist) {
      loadAlbumDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, album.title, album.artist]); // No incluir album completo para evitar re-renders innecesarios

  const loadExistingRatings = () => {
    // Cargar ratings existentes del álbum
    const albumEntry = existingEntries.find(
      e => e.title === album.title && e.type === 'album'
    );
    
    if (albumEntry) {
      setAlbumRating({
        rating: albumEntry.rating,
        review: albumEntry.review,
        tags: albumEntry.mood ? albumEntry.mood.split(', ').filter(Boolean) : [],
      });
    }

    // Cargar ratings existentes de las canciones
    const trackRatingsMap: Record<string, any> = {};
    details?.tracks.forEach(track => {
      const trackEntry = existingEntries.find(
        e => e.title === track.name && e.artist === album.artist && e.type === 'song'
      );
      
      if (trackEntry) {
        trackRatingsMap[track.name] = {
          rating: trackEntry.rating,
          review: trackEntry.review,
          tags: trackEntry.mood ? trackEntry.mood.split(', ').filter(Boolean) : [],
        };
      }
    });
    
    setTrackRatings(trackRatingsMap);
  };

  const loadAlbumDetails = async () => {
    setIsLoading(true);
    try {
      const data = await getAlbumDetails(album.artist, album.title);
      setDetails(data);
      
      if (!data) {
        toast.error('No se pudo cargar la información del álbum');
      }
    } catch (error) {
      console.error('Error loading album details:', error);
      toast.error('Error al cargar detalles del álbum');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRateAlbum = () => {
    if (!albumRating) {
      setAlbumRating({ rating: 7.0, review: '', tags: [] });
    }
  };

  const handleSaveAlbum = () => {
    if (!albumRating) return;
    
    onSubmit({
      title: album.title,
      artist: album.artist,
      coverUrl: album.coverUrl,
      rating: albumRating.rating,
      review: albumRating.review,
      type: 'album',
      mood: albumRating.tags.join(', '),
    });
    
    toast.success('¡Álbum guardado exitosamente!');
    setAlbumRating(null);
  };

  const handleExpandTrack = (trackName: string) => {
    setExpandedTrack(expandedTrack === trackName ? null : trackName);
    
    // Inicializar rating si no existe
    if (!trackRatings[trackName]) {
      setTrackRatings(prev => ({
        ...prev,
        [trackName]: { rating: 7.0, review: '', tags: [] },
      }));
    }
  };

  const handleUpdateTrackRating = (trackName: string, field: 'rating' | 'review', value: any) => {
    setTrackRatings(prev => ({
      ...prev,
      [trackName]: {
        ...prev[trackName],
        [field]: value,
      },
    }));
  };

  const handleAddTag = (trackName: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInputs[trackName]?.trim()) {
      e.preventDefault();
      const tag = tagInputs[trackName].trim();
      
      setTrackRatings(prev => {
        const current = prev[trackName] || { rating: 7.0, review: '', tags: [] };
        if (!current.tags.includes(tag)) {
          return {
            ...prev,
            [trackName]: {
              ...current,
              tags: [...current.tags, tag],
            },
          };
        }
        return prev;
      });
      
      setTagInputs(prev => ({ ...prev, [trackName]: '' }));
    }
  };

  const handleRemoveTag = (trackName: string, tagToRemove: string) => {
    setTrackRatings(prev => {
      const current = prev[trackName];
      if (!current) return prev;
      
      return {
        ...prev,
        [trackName]: {
          ...current,
          tags: current.tags.filter(tag => tag !== tagToRemove),
        },
      };
    });
  };

  const handleSaveTrack = (track: AlbumTrack) => {
    const rating = trackRatings[track.name];
    if (!rating) return;
    
    console.log('💾 Intentando guardar canción:', track.name);
    console.log('📊 Rating:', rating.rating);
    
    onSubmit({
      title: track.name,
      artist: album.artist,
      coverUrl: album.coverUrl,
      rating: rating.rating,
      review: rating.review,
      type: 'song',
      mood: rating.tags.join(', '),
    });
    
    toast.success(`¡"${track.name}" guardada!`);
    setExpandedTrack(null);
    console.log('✅ Canción guardada, expandedTrack limpiado, modal debería seguir abierto');
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCalifiedTracksCount = () => {
    if (!details?.tracks) return 0;
    return details.tracks.filter(track => 
      existingEntries.some(e => e.title === track.name && e.artist === album.artist && e.type === 'song')
    ).length;
  };

  // Calcular promedio de ratings de canciones
  const calculateAverageRating = () => {
    if (!details?.tracks) return null;
    
    const ratedTracks = details.tracks
      .map(track => {
        const entry = existingEntries.find(
          e => e.title === track.name && e.artist === album.artist && e.type === 'song'
        );
        return entry ? entry.rating : null;
      })
      .filter((rating): rating is number => rating !== null);
    
    if (ratedTracks.length === 0) return null;
    
    const sum = ratedTracks.reduce((acc, rating) => acc + rating, 0);
    return Math.round((sum / ratedTracks.length) * 10) / 10;
  };

  const averageRating = calculateAverageRating();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-card border-border max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Album Details</DialogTitle>
            <DialogDescription>
              View tracks and rate this album or individual songs
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="inline-block">
                  <div className="h-8 w-8 rounded-full border-4 border-primary border-t-accent animate-spin"></div>
                </div>
                <p className="text-muted-foreground">Loading album details...</p>
              </div>
            </div>
          ) : details ? (
            <div className="flex-1 overflow-y-auto pr-2">
              {/* Album Header */}
              <div className="flex gap-6 mb-6 p-4 bg-secondary/50 rounded-lg">
                <div className="w-48 h-48 rounded-lg overflow-hidden flex-shrink-0 bg-muted shadow-lg">
                  <img
                    src={details.coverUrl}
                    alt={details.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">
                      {details.name}
                    </h3>
                    <p className="text-lg text-muted-foreground mb-2">
                      {details.artist}
                    </p>
                    {details.tracks && details.tracks.length > 0 && (
                      <p className="text-sm text-primary">
                        {getCalifiedTracksCount()} de {details.tracks.length} canciones calificadas
                      </p>
                    )}
                  </div>
                  
                  {/* Album Rating Section */}
                  <div className="space-y-3 mt-4">
                    <div className="space-y-2">
                      <Button onClick={handleRateAlbum} variant="outline" className="w-full sm:w-auto">
                        <Disc className="h-4 w-4 mr-2" />
                        {existingEntries.some(e => e.title === album.title && e.type === 'album') ? 'Editar Álbum Manualmente' : 'Calificar Álbum Manualmente'}
                      </Button>
                      
                      {averageRating !== null && getCalifiedTracksCount() > 0 && (
                        <Button 
                          onClick={() => {
                            // Guardar álbum con el promedio automáticamente
                            onSubmit({
                              title: album.title,
                              artist: album.artist,
                              coverUrl: album.coverUrl,
                              rating: averageRating,
                              review: `Promedio automático de ${getCalifiedTracksCount()} canciones`,
                              type: 'album',
                              mood: '',
                            });
                            toast.success(`¡Álbum guardado con promedio ${averageRating.toFixed(1)}/10!`);
                          }}
                          className="w-full bg-primary hover:bg-primary/90"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Guardar Álbum con Promedio ({averageRating.toFixed(1)})
                        </Button>
                      )}
                    </div>
                    
                    {albumRating && (
                      <div className="space-y-3 p-3 bg-card rounded-lg border border-border">
                        <div>
                          <label className="text-xs font-medium text-foreground mb-1 block">
                            Rating: <span className="text-primary">{albumRating.rating.toFixed(1)}</span>/10
                          </label>
                          <Slider
                            min={0}
                            max={10}
                            step={0.1}
                            value={[albumRating.rating]}
                            onValueChange={(value) => setAlbumRating(prev => prev ? {...prev, rating: value[0]} : null)}
                          />
                        </div>
                        
                        <Textarea
                          placeholder="Review del álbum (opcional)..."
                          value={albumRating.review}
                          onChange={(e) => setAlbumRating(prev => prev ? {...prev, review: e.target.value} : null)}
                          rows={2}
                          className="text-sm"
                        />
                        
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveAlbum} className="flex-1">
                            <Save className="h-4 w-4 mr-2" />
                            Guardar Álbum
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setAlbumRating(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Track List */}
              {details.tracks && details.tracks.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    Tracks ({details.tracks.length})
                  </h4>
                  
                  <div className="space-y-2">
                    {details.tracks.map((track, index) => {
                      const isRated = existingEntries.some(
                        e => e.title === track.name && e.artist === album.artist && e.type === 'song'
                      );
                      const isExpanded = expandedTrack === track.name;
                      const trackData = trackRatings[track.name];
                      
                      return (
                        <div key={index} className="space-y-2">
                          {/* Track Header */}
                          <div
                            onClick={() => handleExpandTrack(track.name)}
                            className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                              isExpanded ? 'bg-primary/10 border border-primary/30' : 'bg-secondary hover:bg-secondary/80'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <span className="text-sm text-muted-foreground w-6 text-right flex-shrink-0">
                                {index + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {track.name}
                                  </p>
                                  {isRated && (
                                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 ml-4">
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                {formatDuration(track.duration)}
                              </span>
                              {isRated && !isExpanded && (
                                <span className="text-xs text-primary font-medium">
                                  ★ {existingEntries.find(e => e.title === track.name && e.type === 'song')?.rating.toFixed(1)}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Expanded Track Rating */}
                          {isExpanded && trackData && (
                            <div className="ml-9 p-3 bg-card border border-border rounded-lg space-y-3 animate-in slide-in-from-top-2">
                              <div>
                                <label className="text-xs font-medium text-foreground mb-1 block">
                                  Rating: <span className="text-primary">{trackData.rating.toFixed(1)}</span>/10
                                </label>
                                <Slider
                                  min={0}
                                  max={10}
                                  step={0.1}
                                  value={[trackData.rating]}
                                  onValueChange={(value) => handleUpdateTrackRating(track.name, 'rating', value[0])}
                                />
                              </div>
                              
                              <Textarea
                                placeholder="Review de la canción (opcional)..."
                                value={trackData.review}
                                onChange={(e) => handleUpdateTrackRating(track.name, 'review', e.target.value)}
                                rows={2}
                                className="text-sm"
                              />
                              
                              <div>
                                <Input
                                  placeholder="Tags (presiona Enter)..."
                                  value={tagInputs[track.name] || ''}
                                  onChange={(e) => setTagInputs(prev => ({ ...prev, [track.name]: e.target.value }))}
                                  onKeyDown={(e) => handleAddTag(track.name, e)}
                                  className="text-sm"
                                />
                                {trackData.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {trackData.tags.map((tag, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/20 text-primary rounded-full text-xs"
                                      >
                                        {tag}
                                        <button
                                          onClick={() => handleRemoveTag(track.name, tag)}
                                          className="hover:bg-primary/30 rounded-full p-0.5"
                                        >
                                          <X className="h-2 w-2" />
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleSaveTrack(track)} className="flex-1">
                                  <Save className="h-4 w-4 mr-2" />
                                  Guardar Canción
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setExpandedTrack(null)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Music className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No track information available for this album</p>
                  <Button onClick={handleRateAlbum} variant="outline" className="mt-4">
                    Rate the Album Anyway
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Could not load album details</p>
              <Button onClick={handleRateAlbum} variant="outline" className="mt-4">
                Rate Album Without Details
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
