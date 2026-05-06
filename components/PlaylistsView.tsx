'use client';

import { useState, useEffect } from 'react';
import { usePlaylists, Playlist } from '@/hooks/usePlaylists';
import { useAuth } from '@/hooks/useAuth';
import { SimplePlaylistCover } from './PlaylistCover';
import { Plus, Music, Trash2, Eye, EyeOff, Search, Grid, List } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { toast } from 'sonner';
import CreatePlaylistModal from './CreatePlaylistModal';
import PlaylistDetailsModal from './PlaylistDetailsModal';

// ---------- Skeleton ----------

function GridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(count)].map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-square w-full" />
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------- Shared Grid/List Content ----------

interface PlaylistsContentProps {
  filteredPlaylists: Playlist[];
  viewMode: 'grid' | 'list';
  handlePlaylistClick: (playlist: Playlist) => void;
  handleDeletePlaylist: ((playlistId: string, playlistName: string) => void) | null;
  searchQuery: string;
  showCreateButton?: boolean;
  onCreateClick?: () => void;
}

function PlaylistsContent({
  filteredPlaylists,
  viewMode,
  handlePlaylistClick,
  handleDeletePlaylist,
  searchQuery,
  showCreateButton,
  onCreateClick,
}: PlaylistsContentProps) {
  if (filteredPlaylists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <Music className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">
          {searchQuery ? 'No se encontraron playlists' : 'Aun no tienes playlists'}
        </h3>
        <p className="text-muted-foreground mb-6">
          {searchQuery
            ? 'Intenta con otros terminos de busqueda'
            : 'Crea tu primera playlist para organizar tu musica favorita!'}
        </p>
        {showCreateButton && !searchQuery && onCreateClick && (
          <Button onClick={onCreateClick} className="gap-2">
            <Plus className="h-4 w-4" />
            Crear primera playlist
          </Button>
        )}
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {filteredPlaylists.map((playlist) => (
          <Card
            key={playlist.id}
            className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
            onClick={() => handlePlaylistClick(playlist)}
          >
            <div className="aspect-square overflow-hidden relative group-hover:scale-105 transition-transform duration-300">
              <SimplePlaylistCover
                playlist={playlist}
                alt={playlist.name}
                className="w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <div className="text-white">
                  <p className="text-sm font-medium">{playlist.song_count || 0} canciones</p>
                </div>
              </div>
            </div>

            <CardContent className="p-3 md:p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm md:text-base text-foreground truncate" title={playlist.name}>
                    {playlist.name}
                  </h3>
                  {playlist.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {playlist.description}
                    </p>
                  )}
                </div>
                {!playlist.is_public && (
                  <EyeOff className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                )}
              </div>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                <Badge variant="outline" className="text-[10px] md:text-xs px-1.5 md:px-2 py-0 md:py-0.5 h-auto">
                  {playlist.song_count || 0} canciones
                </Badge>
                <span className="text-[10px] md:text-xs text-muted-foreground">
                  {new Date(playlist.updated_at).toLocaleDateString('es-ES', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </CardContent>

            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-white/90 hover:bg-white"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlaylistClick(playlist);
                }}
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
              {handleDeletePlaylist && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8 bg-white/90 hover:bg-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePlaylist(playlist.id, playlist.name);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-2">
      {filteredPlaylists.map((playlist) => (
        <div
          key={playlist.id}
          className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer group"
          onClick={() => handlePlaylistClick(playlist)}
        >
          <div className="w-12 h-12 md:w-16 md:h-16 flex-shrink-0 rounded-lg overflow-hidden">
            <SimplePlaylistCover
              playlist={playlist}
              alt={playlist.name}
              className="w-full h-full"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm md:text-base text-foreground truncate">{playlist.name}</h3>
              {!playlist.is_public && (
                <EyeOff className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              )}
            </div>
            {playlist.description && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{playlist.description}</p>
            )}
            <div className="flex items-center gap-2 mt-1 text-[10px] md:text-xs text-muted-foreground">
              <span>{playlist.song_count || 0} canciones</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
              <span>
                {new Date(playlist.updated_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                handlePlaylistClick(playlist);
              }}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
            {handleDeletePlaylist && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePlaylist(playlist.id, playlist.name);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- Main Component ----------

export function PlaylistsView() {
  const { playlists, isLoading, loadPlaylists, deletePlaylist, searchPlaylists } = usePlaylists();
  const { isAuthenticated } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPlaylists, setFilteredPlaylists] = useState<Playlist[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Filtrar playlists basado en busqueda
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPlaylists(playlists);
    } else {
      const filtered = playlists.filter(
        (playlist) =>
          playlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (playlist.description &&
            playlist.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredPlaylists(filtered);
    }
  }, [playlists, searchQuery]);

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      const results = await searchPlaylists(searchQuery);
      setFilteredPlaylists(results);
    } else {
      setFilteredPlaylists(playlists);
    }
  };

  const handleDeletePlaylist = async (playlistId: string, playlistName: string) => {
    if (!confirm(`Estas seguro de que quieres eliminar la playlist "${playlistName}"?`)) {
      return;
    }
    try {
      await deletePlaylist(playlistId);
      toast.success(`Playlist "${playlistName}" eliminada correctamente`);
    } catch (error) {
      toast.error('Error al eliminar la playlist');
    }
  };

  const handlePlaylistClick = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setShowDetailsModal(true);
  };

  // ---- Usuarios NO autenticados: solo playlists publicas ----
  if (!isAuthenticated) {
    if (isLoading) return <GridSkeleton />;

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar playlists publicas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            title={viewMode === 'grid' ? 'Vista de lista' : 'Vista de cuadricula'}
          >
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
          </Button>
        </div>

        <PlaylistsContent
          filteredPlaylists={filteredPlaylists}
          viewMode={viewMode}
          handlePlaylistClick={handlePlaylistClick}
          handleDeletePlaylist={null}
          searchQuery={searchQuery}
          showCreateButton={false}
        />

        {selectedPlaylist && (
          <PlaylistDetailsModal
            isOpen={showDetailsModal}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedPlaylist(null);
            }}
            playlist={selectedPlaylist}
            onUpdate={() => loadPlaylists()}
            onDelete={() => {
              setShowDetailsModal(false);
              setSelectedPlaylist(null);
            }}
          />
        )}
      </div>
    );
  }

  // ---- Usuarios autenticados ----
  if (isLoading) return <GridSkeleton />;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Playlist
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar playlists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          title={viewMode === 'grid' ? 'Vista de lista' : 'Vista de cuadricula'}
        >
          {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
        </Button>
      </div>

      <PlaylistsContent
        filteredPlaylists={filteredPlaylists}
        viewMode={viewMode}
        handlePlaylistClick={handlePlaylistClick}
        handleDeletePlaylist={handleDeletePlaylist}
        searchQuery={searchQuery}
        showCreateButton={true}
        onCreateClick={() => setShowCreateModal(true)}
      />

      <CreatePlaylistModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          toast.success('Playlist creada correctamente');
        }}
      />

      {selectedPlaylist && (
        <PlaylistDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedPlaylist(null);
          }}
          playlist={selectedPlaylist}
          onUpdate={() => loadPlaylists()}
          onDelete={() => {
            setShowDetailsModal(false);
            setSelectedPlaylist(null);
            toast.success('Playlist eliminada correctamente');
          }}
        />
      )}
    </div>
  );
}