'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Playlist, PlaylistItem, usePlaylists } from '@/hooks/usePlaylists';
import { useMusicJournal, MusicEntry } from '@/hooks/useMusicJournal';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { toast } from 'sonner';
import {
  Music,
  Trash2,
  Edit,
  EyeOff,
  Plus,
  Search,
  GripVertical,
  X
} from 'lucide-react';

interface PlaylistDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: Playlist;
  onUpdate: () => void;
  onDelete: () => void;
}

export default function PlaylistDetailsModal({
  isOpen,
  onClose,
  playlist,
  onUpdate,
  onDelete
}: PlaylistDetailsModalProps) {
  const { loadPlaylistWithItems, updatePlaylist, deletePlaylist, addSongToPlaylist, removeSongFromPlaylist, moveSongInPlaylist } = usePlaylists();
  const { entries } = useMusicJournal();
  
  const [playlistDetails, setPlaylistDetails] = useState<Playlist | null>(null);
  const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSongs, setFilteredSongs] = useState<MusicEntry[]>([]);
  const [showAddSongs, setShowAddSongs] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  // Ref para evitar recargas infinitas por cambio de referencia del objeto playlist
  const playlistIdRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false);

  // Cargar detalles de la playlist - solo depende de isOpen y playlist.id
  useEffect(() => {
    if (isOpen && playlist) {
      const currentId = playlist.id;
      if (currentId !== playlistIdRef.current) {
        playlistIdRef.current = currentId;
        loadPlaylistDetails(currentId);
      }
    }

    if (!isOpen) {
      playlistIdRef.current = null;
      setLoadError(false);
    }
  }, [isOpen, playlist?.id]);

  // Filtrar canciones disponibles
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSongs(entries);
    } else {
      const filtered = entries.filter(entry =>
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.artist.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSongs(filtered);
    }
  }, [entries, searchQuery]);

  const loadPlaylistDetails = useCallback(async (playlistId: string, isRetry: boolean = false) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setIsLoading(true);
    setLoadError(false);

    try {
      const details = await loadPlaylistWithItems(playlistId);
      if (details) {
        setPlaylistDetails(details);
        setPlaylistItems(details.items);
        setEditName(details.name);
        setEditDescription(details.description || '');
        setEditIsPublic(details.is_public);
      } else {
        // Si no es un reintento, intentar una vez mas
        if (!isRetry) {
          await new Promise(resolve => setTimeout(resolve, 500));
          isLoadingRef.current = false;
          await loadPlaylistDetails(playlistId, true);
          return;
        }
        setLoadError(true);
      }
    } catch (error) {
      // Si no es un reintento, intentar una vez mas
      if (!isRetry) {
        await new Promise(resolve => setTimeout(resolve, 500));
        isLoadingRef.current = false;
        await loadPlaylistDetails(playlistId, true);
        return;
      }
      setLoadError(true);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [loadPlaylistWithItems]);

  const handleSaveEdit = async () => {
    if (!playlistDetails) return;

    setIsSaving(true);
    try {
      await updatePlaylist(playlistDetails.id, {
        name: editName.trim(),
        description: editDescription.trim(),
        is_public: editIsPublic,
      });
      
      setIsEditing(false);
      // Actualizar estado local sin recargar desde la BD
      setPlaylistDetails(prev => prev ? {
        ...prev,
        name: editName.trim(),
        description: editDescription.trim(),
        is_public: editIsPublic,
      } : null);
      onUpdate();
      toast.success('Playlist actualizada correctamente');
    } catch (error) {
      toast.error('Error al actualizar la playlist');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!playlistDetails) return;

    if (!confirm(`¿Estas seguro de que quieres eliminar la playlist "${playlistDetails.name}"?`)) {
      return;
    }

    try {
      await deletePlaylist(playlistDetails.id);
      onDelete();
      onClose();
    } catch (error) {
      toast.error('Error al eliminar la playlist');
    }
  };

  const handleAddSong = async (song: MusicEntry) => {
    try {
      await addSongToPlaylist(playlist.id, song.id);
      if (playlist.id === playlistIdRef.current) {
        await loadPlaylistDetails(playlist.id);
      }
      toast.success(`"${song.title}" agregada a la playlist`);
    } catch (error) {
      toast.error('Error al agregar la cancion');
    }
  };

  const handleRemoveSong = async (itemId: string, songTitle: string) => {
    try {
      await removeSongFromPlaylist(playlist.id, itemId);
      if (playlist.id === playlistIdRef.current) {
        await loadPlaylistDetails(playlist.id);
      }
      toast.success(`"${songTitle}" eliminada de la playlist`);
    } catch (error) {
      toast.error('Error al eliminar la cancion');
    }
  };

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetPosition: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    const draggedItemData = playlistItems.find(item => item.id === draggedItem);
    if (!draggedItemData) return;

    try {
      await moveSongInPlaylist(playlist.id, draggedItem, targetPosition);
      if (playlist.id === playlistIdRef.current) {
        await loadPlaylistDetails(playlist.id);
      }
    } catch (error) {
      toast.error('Error al reordenar la playlist');
    } finally {
      setDraggedItem(null);
    }
  };

  const isSongInPlaylist = (songId: string) => {
    return playlistItems.some(item => item.music_entry_id === songId);
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="sr-only">Cargando detalles de playlist</DialogTitle>
            <DialogDescription className="sr-only">Cargando informacion de la playlist</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-40 w-full" />
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (loadError) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Error al cargar</DialogTitle>
            <DialogDescription>
              No se pudieron cargar los detalles de esta playlist
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-6">
            <Music className="h-12 w-12 text-muted-foreground" />
            <p className="text-center text-muted-foreground">
              Ocurrio un error al cargar los detalles de la playlist. Intenta de nuevo.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            <Button onClick={() => loadPlaylistDetails(playlist.id)}>
              Reintentar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (!playlistDetails) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto p-3 md:p-6">
        <DialogHeader>
          <DialogTitle className="sr-only">
            {isEditing ? 'Editando playlist' : `Detalles de playlist: ${playlistDetails.name}`}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isEditing ? 'Formulario para editar los detalles de la playlist' : `Informacion detallada de la playlist ${playlistDetails.name}`}
          </DialogDescription>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-4">
                  <h2 className="text-sm font-medium text-muted-foreground mb-2">Editando playlist</h2>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-2xl font-bold"
                    disabled={isSaving}
                    placeholder="Nombre de la playlist"
                  />
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Descripcion de la playlist..."
                    disabled={isSaving}
                    rows={2}
                  />
                </div>
              ) : (
                <>
                  <h2 className="text-lg md:text-2xl font-bold text-foreground truncate">{playlistDetails.name}</h2>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1 md:mt-2 line-clamp-2">
                    {playlistDetails.description || 'Sin descripcion'}
                  </p>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0 pr-10 md:pr-12">
              {!isEditing && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 md:h-9 md:w-9"
                    onClick={() => setIsEditing(true)}
                    title="Editar playlist"
                  >
                    <Edit className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 md:h-9 md:w-9"
                    onClick={handleDelete}
                    title="Eliminar playlist"
                  >
                    <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </Button>
                </>
              )}
              {!playlistDetails.is_public && (
                <EyeOff className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" title="Privada" />
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Mini info compacta al lado del titulo */}
        {!isEditing && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4 pb-3 border-b border-border/50">
            <span className="font-medium text-foreground">{playlistItems.length} canciones</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
            <span>{playlistDetails.is_public ? 'Publica' : 'Privada'}</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
            <span>Actualizada {new Date(playlistDetails.updated_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
          </div>
        )}

        {/* Edit Controls */}
        {isEditing && (
          <div className="space-y-4 p-4 border rounded-lg mb-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Visibilidad</Label>
                <p className="text-sm text-muted-foreground">
                  {editIsPublic 
                    ? 'Cualquiera puede ver esta playlist'
                    : 'Solo tu puedes ver esta playlist'
                  }
                </p>
              </div>
              <Switch
                checked={editIsPublic}
                onCheckedChange={setEditIsPublic}
                disabled={isSaving}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditName(playlistDetails.name);
                  setEditDescription(playlistDetails.description || '');
                  setEditIsPublic(playlistDetails.is_public);
                }}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </div>
        )}

        {/* Songs Management */}
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm md:text-lg font-semibold">Canciones</h3>
            <Button
              variant="outline"
              size="sm"
              className="h-7 md:h-9 text-xs md:text-sm gap-1 md:gap-2"
              onClick={() => setShowAddSongs(!showAddSongs)}
            >
              {showAddSongs ? <X className="h-3 w-3 md:h-4 md:w-4" /> : <Plus className="h-3 w-3 md:h-4 md:w-4" />}
              {showAddSongs ? 'Cerrar' : 'Agregar'}
            </Button>
          </div>

          {/* Add Songs Section */}
          {showAddSongs && (
            <div className="space-y-3 p-3 md:p-4 border rounded-lg">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar canciones para agregar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="max-h-48 md:max-h-60 overflow-y-auto space-y-2">
                {filteredSongs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    {searchQuery ? 'No se encontraron canciones' : 'No hay canciones disponibles'}
                  </p>
                ) : (
                  filteredSongs.map((song) => (
                    <div
                      key={song.id}
                      className="flex items-center justify-between p-2 md:p-3 rounded-lg border hover:bg-secondary/50"
                    >
                      <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                        <img
                          src={song.coverUrl || '/placeholder.jpg'}
                          alt={song.title}
                          className="w-8 h-8 md:w-10 md:h-10 rounded object-cover flex-shrink-0"
                          onError={(e) => { e.currentTarget.src = '/placeholder.jpg'; }}
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-xs md:text-sm truncate">{song.title}</p>
                          <p className="text-[10px] md:text-xs text-muted-foreground truncate">{song.artist}</p>
                        </div>
                      </div>
                      
                      <Button
                        variant={isSongInPlaylist(song.id) ? "secondary" : "default"}
                        size="sm"
                        className="text-xs h-7 md:h-9 px-2 md:px-4 flex-shrink-0"
                        onClick={() => handleAddSong(song)}
                        disabled={isSongInPlaylist(song.id)}
                      >
                        {isSongInPlaylist(song.id) ? 'Agregada' : 'Agregar'}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Playlist Songs List */}
          {playlistItems.length === 0 ? (
            <div className="text-center py-4 md:py-8 border rounded-lg">
              <Music className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground mx-auto mb-2 md:mb-3" />
              <p className="text-sm md:text-base text-foreground font-medium">Esta playlist esta vacia</p>
              <p className="text-[10px] md:text-sm text-muted-foreground mt-1">
                Agrega canciones para comenzar
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 md:mt-4 gap-1 md:gap-2 h-7 md:h-9 text-xs md:text-sm"
                onClick={() => setShowAddSongs(true)}
              >
                <Plus className="h-3 w-3 md:h-4 md:w-4" />
                Agregar primera cancion
              </Button>
            </div>
          ) : (
            <div className="space-y-1 md:space-y-2">
              {playlistItems.map((item, index) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index + 1)}
                  className={`flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg border hover:bg-secondary/50 transition-colors ${
                    draggedItem === item.id ? 'opacity-50' : ''
                  }`}
                >
                  <GripVertical className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground cursor-move flex-shrink-0" />

                  <div className="w-5 md:w-8 text-center flex-shrink-0">
                    <span className="text-[10px] md:text-sm font-medium text-muted-foreground">
                      {index + 1}
                    </span>
                  </div>

                  <img
                    src={item.song_cover_url || '/placeholder.jpg'}
                    alt={item.song_title}
                    className="w-8 h-8 md:w-10 md:h-10 rounded object-cover flex-shrink-0"
                    onError={(e) => { e.currentTarget.src = '/placeholder.jpg'; }}
                  />

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs md:text-sm truncate">{item.song_title}</p>
                    <div className="flex items-center gap-1 md:gap-2">
                      <p className="text-[10px] md:text-xs text-muted-foreground truncate">{item.song_artist}</p>
                      {item.song_rating && (
                        <Badge variant="outline" className="text-[9px] md:text-xs px-1 md:px-2 py-0 md:py-0.5 h-auto">
                          {item.song_rating.toFixed(1)}
                        </Badge>
                      )}
                    </div>
                    {item.notes && (
                      <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1 truncate">{item.notes}</p>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 md:h-9 md:w-9 flex-shrink-0"
                    onClick={() => handleRemoveSong(item.id, item.song_title || '')}
                    title="Eliminar de la playlist"
                  >
                    <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex w-full items-center justify-between">
            <p className="text-[10px] md:text-sm text-muted-foreground">Arrastra para reordenar</p>
            <Button variant="outline" size="sm" className="h-7 md:h-9 text-xs md:text-sm" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}