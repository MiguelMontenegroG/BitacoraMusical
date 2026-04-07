'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { MusicEntry } from '@/hooks/useMusicJournal';
import { getAlbumDetails, AlbumDetails, AlbumTrack } from '@/lib/lastfm';
import { Disc, Music, Star, Save, CheckCircle2, X, TrendingUp, Download } from 'lucide-react';
import { toast } from 'sonner';
import { generateAlbumImage } from '@/lib/albumImageGenerator';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

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
  const [trackRatings, setTrackRatings] = useState<Record<string, { rating: string; review: string; tags: string[] }>>({});
  const [albumRating, setAlbumRating] = useState<{ rating: string; review: string; tags: string[] } | null>(null);
  const [expandedTrack, setExpandedTrack] = useState<string | null>(null);
  const [tagInputs, setTagInputs] = useState<Record<string, string>>({});
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (isOpen && album.title && album.artist) {
      loadAlbumDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, album.title, album.artist]); // No incluir album completo para evitar re-renders innecesarios

  // Cargar ratings existentes cuando los detalles estén disponibles
  useEffect(() => {
    if (details && details.tracks) {
      loadExistingRatings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [details]);

  const loadExistingRatings = () => {
    // Cargar ratings existentes del álbum
    const albumEntry = existingEntries.find(
      e => e.title === album.title && e.type === 'album'
    );
    
    if (albumEntry) {
      setAlbumRating({
        rating: albumEntry.rating.toString(),
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
          rating: trackEntry.rating.toString(),
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
      setAlbumRating({ rating: '', review: '', tags: [] });
    }
  };

  const handleSaveAlbum = () => {
    if (!albumRating || !albumRating.rating) return;
    
    const numRating = parseFloat(albumRating.rating);
    if (isNaN(numRating)) return;
    
    // Clasificar según número de tracks
    const trackCount = details?.tracks?.length || 0;
    let type: 'album' | 'song' | 'ep' = 'album';
    
    if (trackCount === 1) {
      type = 'song'; // Single
    } else if (trackCount >= 2 && trackCount <= 4) {
      type = 'ep'; // EP
    } else {
      type = 'album'; // Álbum completo
    }
    
    onSubmit({
      title: album.title,
      artist: album.artist,
      coverUrl: album.coverUrl,
      rating: Math.round(numRating * 10) / 10,
      review: albumRating.review,
      type,
      mood: albumRating.tags.join(', '),
      trackCount,
    });
    
    toast.success(`¡${type === 'song' ? 'Single' : type === 'ep' ? 'EP' : 'Álbum'} guardado exitosamente!`);
    setAlbumRating(null);
  };

  const handleExpandTrack = (trackName: string) => {
    setExpandedTrack(expandedTrack === trackName ? null : trackName);
    
    // Inicializar rating si no existe
    if (!trackRatings[trackName]) {
      setTrackRatings(prev => ({
        ...prev,
        [trackName]: { rating: '', review: '', tags: [] },
      }));
    }
  };

  const handleAddTag = (trackName: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInputs[trackName]?.trim()) {
      e.preventDefault();
      const tag = tagInputs[trackName].trim();
      
      setTrackRatings(prev => {
        const current = prev[trackName] || { rating: '', review: '', tags: [] };
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

  const handleDownloadSummary = async () => {
    if (!details) return;
    
    setIsDownloading(true);
    
    try {
      // Obtener SOLO las canciones de ESTE álbum específico
      // Filtramos por nombre de track que coincida con las del álbum actual
      const albumTrackNames = details.tracks.map(track => track.name.toLowerCase());
      
      // Primero filtramos las canciones que pertenecen a este álbum
      const filteredSongs = existingEntries.filter(e => {
        return e.type === 'song' && 
               e.artist === album.artist && 
               albumTrackNames.includes(e.title.toLowerCase());
      });
      
      // Luego las ORDENAMOS según el orden de tracks del álbum (de Last.fm)
      const albumSongs = details.tracks
        .map((track, index) => {
          const song = filteredSongs.find(s => s.title.toLowerCase() === track.name.toLowerCase());
          return song ? { title: song.title, rating: song.rating, trackNumber: index + 1 } : null;
        })
        .filter((song): song is { title: string; rating: number; trackNumber: number } => song !== null);

      // Generar imagen
      const blob = await generateAlbumImage(
        {
          title: album.title,
          artist: album.artist,
          coverUrl: album.coverUrl,
          rating: albumRating ? parseFloat(albumRating.rating) : 0,
          date: new Date().toISOString(),
        },
        albumSongs,
        existingEntries.filter(e => e.artist === album.artist)
      );

      // Descargar imagen
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${album.title} - ${album.artist}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('¡Imagen descargada exitosamente! 📸');
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error('Error al descargar la imagen. Intenta de nuevo.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRatingInputChange = (
    trackName: string | 'album',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    
    // Permitir espacio en blanco
    if (value === '') {
      if (trackName === 'album') {
        setAlbumRating(prev => prev ? {...prev, rating: ''} : null);
      } else {
        setTrackRatings(prev => ({
          ...prev,
          [trackName]: { ...prev[trackName], rating: '' },
        }));
      }
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    const limitedValue = Math.round(numValue * 10) / 10;

    if (trackName === 'album') {
      setAlbumRating(prev => prev ? {...prev, rating: limitedValue.toString()} : null);
    } else {
      setTrackRatings(prev => ({
        ...prev,
        [trackName]: { ...prev[trackName], rating: limitedValue.toString() },
      }));
    }
  };

  // Preparar datos para la gráfica
  const getChartData = () => {
    if (!details || !details.tracks) return null;

    const chartData = details.tracks.map((track, index) => {
      const trackEntry = existingEntries.find(
        e => e.title === track.name && e.artist === album.artist && e.type === 'song'
      );
      return {
        name: track.name,
        trackNumber: index + 1,
        rating: trackEntry ? trackEntry.rating : null,
      };
    });

    // Calcular media del álbum
    const ratedTracks = chartData.filter(d => d.rating !== null);
    const albumAvg = ratedTracks.length > 0
      ? Math.round((ratedTracks.reduce((sum, d) => sum + (d.rating || 0), 0) / ratedTracks.length) * 10) / 10
      : 0;

    // Calcular media del artista
    const artistEntries = existingEntries.filter(e => 
      e.artist.toLowerCase() === album.artist.toLowerCase()
    );
    const artistAvg = artistEntries.length > 0
      ? Math.round((artistEntries.reduce((sum, e) => sum + e.rating, 0) / artistEntries.length) * 10) / 10
      : 0;

    console.log('Chart Data:', { chartData, albumAvg, artistAvg, ratedTracksCount: ratedTracks.length });

    return { chartData, albumAvg, artistAvg };
  };

  const handleSaveTrack = (track: AlbumTrack) => {
    const rating = trackRatings[track.name];
    if (!rating || !rating.rating) return;
    
    const numRating = parseFloat(rating.rating);
    if (isNaN(numRating)) return;
    
    console.log('💾 Intentando guardar canción:', track.name);
    console.log('📊 Rating:', numRating);
    
    onSubmit({
      title: track.name,
      artist: album.artist,
      coverUrl: album.coverUrl,
      rating: Math.round(numRating * 10) / 10,
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
          <DialogHeader className="flex-shrink-0 flex flex-row items-center justify-between">
            <div>
              <DialogTitle>Detalles del álbum</DialogTitle>
              <DialogDescription>
                Visualiza las canciones y califica este álbum o canciones individuales
              </DialogDescription>
            </div>
            <Button
              onClick={handleDownloadSummary}
              disabled={isDownloading || !details}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {isDownloading ? 'Generando...' : 'Descargar Resumen'}
            </Button>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="inline-block">
                  <div className="h-8 w-8 rounded-full border-4 border-primary border-t-accent animate-spin"></div>
                </div>
                <p className="text-muted-foreground">Cargando detalles del álbum...</p>
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
                            // Clasificar según número de tracks
                            const trackCount = details?.tracks?.length || 0;
                            let type: 'album' | 'song' | 'ep' = 'album';
                            
                            if (trackCount === 1) {
                              type = 'song'; // Single
                            } else if (trackCount >= 2 && trackCount <= 4) {
                              type = 'ep'; // EP
                            } else {
                              type = 'album'; // Álbum completo
                            }
                            
                            // Guardar con el promedio automáticamente
                            onSubmit({
                              title: album.title,
                              artist: album.artist,
                              coverUrl: album.coverUrl,
                              rating: averageRating,
                              review: `Promedio automático de ${getCalifiedTracksCount()} canciones`,
                              type,
                              mood: '',
                              trackCount,
                            });
                            toast.success(`¡${type === 'song' ? 'Single' : type === 'ep' ? 'EP' : 'Álbum'} guardado con promedio ${averageRating.toFixed(1)}/10!`);
                          }}
                          className="w-full bg-primary hover:bg-primary/90"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Guardar {details?.tracks && details.tracks.length === 1 ? 'Single' : details?.tracks && details.tracks.length <= 4 ? 'EP' : 'Álbum'} con Promedio ({averageRating.toFixed(1)})
                        </Button>
                      )}
                    </div>
                    
                    {albumRating && (
                      <div className="space-y-3 p-3 bg-card rounded-lg border border-border">
                        <div>
                          <label className="text-xs font-medium text-foreground mb-1 block">
                            Rating del Álbum (0-10)
                          </label>
                          <div className="relative">
                            <Input
                              type="number"
                              min="0"
                              max="10"
                              step="0.1"
                              value={albumRating.rating}
                              onChange={(e) => handleRatingInputChange('album', e)}
                              placeholder="Ej: 7.5"
                              className="bg-secondary border-border text-sm font-semibold"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                              /10
                            </span>
                          </div>
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
                <div className="space-y-4">
                  {/* Chart Section */}
                  {(() => {
                    const chartInfo = getChartData();
                    if (!chartInfo) return null;
                    
                    const { chartData, albumAvg, artistAvg } = chartInfo;
                    
                    // Si no hay ninguna canción calificada, mostrar mensaje
                    const hasRatings = chartData.some(d => d.rating !== null);
                    if (!hasRatings) {
                      return (
                        <div className="bg-secondary/50 border border-border rounded-lg p-6 text-center">
                          <TrendingUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                          <p className="text-sm text-muted-foreground">Aún no has calificado ninguna canción de este álbum</p>
                          <p className="text-xs text-muted-foreground mt-1">Califica algunas canciones para ver la gráfica</p>
                        </div>
                      );
                    }
                    
                    return (
                      <div className="bg-secondary/50 border border-border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-4">
                          <TrendingUp className="h-5 w-5 text-primary" />
                          <h4 className="text-sm font-semibold text-foreground">Distribución de Ratings</h4>
                        </div>
                        
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#404040" opacity={0.3} />
                              <XAxis
                                dataKey="trackNumber"
                                tickFormatter={(value) => `#${value}`}
                                stroke="#a3a3a3"
                                fontSize={12}
                                angle={-45}
                                textAnchor="end"
                                height={60}
                              />
                              <YAxis
                                domain={[0, 10]}
                                tickCount={11}
                                stroke="#a3a3a3"
                                fontSize={12}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: '#171717',
                                  border: '1px solid #404040',
                                  borderRadius: '8px',
                                  color: '#fafafa',
                                }}
                                labelStyle={{ color: '#fafafa', fontWeight: 'bold' }}
                                itemStyle={{ color: '#fafafa' }}
                                formatter={(value: number | null) => {
                                  if (value === null) return ['No calificado', 'Rating'];
                                  return [value.toFixed(1), 'Rating'];
                                }}
                                labelFormatter={(label) => {
                                  const track = chartData.find(d => d.trackNumber === label);
                                  return track ? `${track.name}` : `Track #${label}`;
                                }}
                              />
                              <Legend 
                                wrapperStyle={{ color: '#a3a3a3' }}
                              />
                              
                              <Line
                                type="monotone"
                                dataKey="rating"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={{ fill: '#3b82f6', r: 4, stroke: '#171717', strokeWidth: 2 }}
                                activeDot={{ r: 6, fill: '#3b82f6', stroke: '#171717', strokeWidth: 2 }}
                                name="Rating Canción"
                                connectNulls={false}
                              />
                              
                              <ReferenceLine
                                y={albumAvg}
                                stroke="#06b6d4"
                                strokeDasharray="5 5"
                                strokeWidth={2}
                                label={{
                                  value: `Media Álbum: ${albumAvg.toFixed(1)}`,
                                  position: 'right',
                                  fill: '#06b6d4',
                                  fontSize: 11,
                                  fontWeight: 'bold',
                                  background: { fill: '#171717', opacity: 0.8 },
                                }}
                              />
                              
                              <ReferenceLine
                                y={artistAvg}
                                stroke="#f97316"
                                strokeDasharray="3 3"
                                strokeWidth={2}
                                label={{
                                  value: `Media Artista: ${artistAvg.toFixed(1)}`,
                                  position: 'left',
                                  fill: '#f97316',
                                  fontSize: 11,
                                  fontWeight: 'bold',
                                  background: { fill: '#171717', opacity: 0.8 },
                                }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        
                        <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-0.5 bg-blue-500"></div>
                            <span>Rating Canción</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-0.5 border-t-2 border-dashed border-cyan-500"></div>
                            <span>Media Álbum ({albumAvg.toFixed(1)})</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-0.5 border-t-2 border-dashed border-orange-500"></div>
                            <span>Media Artista ({artistAvg.toFixed(1)})</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

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
                                  Rating (0-10)
                                </label>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    min="0"
                                    max="10"
                                    step="0.1"
                                    value={trackData.rating}
                                    onChange={(e) => handleRatingInputChange(track.name, e)}
                                    placeholder="Ej: 7.5"
                                    className="bg-secondary border-border text-sm font-semibold"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                                    /10
                                  </span>
                                </div>
                              </div>
                              
                              <Textarea
                                placeholder="Review de la canción (opcional)..."
                                value={trackData.review}
                                onChange={(e) => setTrackRatings(prev => ({
                                  ...prev,
                                  [track.name]: { ...prev[track.name], review: e.target.value },
                                }))}
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
