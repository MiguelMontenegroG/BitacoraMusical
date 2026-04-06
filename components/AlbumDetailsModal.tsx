'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { RatingModal } from './RatingModal';
import { MusicEntry } from '@/hooks/useMusicJournal';
import { getAlbumDetails, AlbumDetails, AlbumTrack } from '@/lib/lastfm';
import { Disc, Music, Star } from 'lucide-react';
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
}

export function AlbumDetailsModal({
  isOpen,
  onClose,
  album,
  onSubmit,
}: AlbumDetailsModalProps) {
  const [details, setDetails] = useState<AlbumDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<AlbumTrack | null>(null);

  useEffect(() => {
    if (isOpen && album.title && album.artist) {
      loadAlbumDetails();
    }
  }, [isOpen, album]);

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
    setSelectedTrack(null);
    setShowRatingModal(true);
  };

  const handleRateTrack = (track: AlbumTrack) => {
    setSelectedTrack(track);
    setShowRatingModal(true);
  };

  const handleSubmitRating = (entry: Omit<MusicEntry, 'id' | 'date'>) => {
    onSubmit(entry);
    setShowRatingModal(false);
    
    if (selectedTrack) {
      toast.success(`¡Canción "${selectedTrack.name}" agregada!`);
    } else {
      toast.success('¡Álbum agregado exitosamente!');
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
                    <p className="text-lg text-muted-foreground mb-4">
                      {details.artist}
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <Button onClick={handleRateAlbum} className="w-full sm:w-auto">
                      <Disc className="h-4 w-4 mr-2" />
                      Rate Full Album
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Or scroll down to rate individual tracks
                    </p>
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
                  
                  <div className="space-y-1">
                    {details.tracks.map((track, index) => (
                      <div
                        key={index}
                        className="group flex items-center justify-between p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-all"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-sm text-muted-foreground w-6 text-right flex-shrink-0">
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {track.name}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 ml-4">
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {formatDuration(track.duration)}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRateTrack(track)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Star className="h-3 w-3 mr-1" />
                            Rate
                          </Button>
                        </div>
                      </div>
                    ))}
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

      {/* Rating Modal for Album or Track */}
      {showRatingModal && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setSelectedTrack(null);
          }}
          music={{
            title: selectedTrack ? selectedTrack.name : details?.name || album.title,
            artist: details?.artist || album.artist,
            coverUrl: album.coverUrl,
            type: selectedTrack ? 'song' : 'album',
          }}
          onSubmit={handleSubmitRating}
        />
      )}
    </>
  );
}
