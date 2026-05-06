import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';
import { MusicEntry } from './useMusicJournal';
import { getPlaylistCover } from '@/lib/playlistCoverGenerator';

export interface Playlist {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  is_public: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
  song_count?: number;
  generated_cover_url?: string;
}

export interface PlaylistItem {
  id: string;
  playlist_id: string;
  music_entry_id: string;
  position: number;
  added_at: string;
  notes: string | null;
  song_title?: string;
  song_artist?: string;
  song_cover_url?: string;
  song_rating?: number;
  song_type?: string;
  song_mood?: string;
}

export interface PlaylistWithItems extends Playlist {
  items: PlaylistItem[];
}

export function usePlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  // Cargar todas las playlists (propias si autenticado, publicas si no)
  const loadPlaylists = useCallback(async () => {
    try {
      setIsLoading(true);

      let query = supabase
        .from('playlists_with_stats')
        .select('*')
        .order('updated_at', { ascending: false });

      if (isAuthenticated && user?.id) {
        query = query.eq('user_id', user.id);
      } else {
        query = query.eq('is_public', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      setPlaylists(data || []);
    } catch (error) {
      logger.error('Error loading playlists:', error);
      setPlaylists([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  // Cargar una playlist especifica con sus items (publica o propia)
  const loadPlaylistWithItems = useCallback(async (playlistId: string): Promise<PlaylistWithItems | null> => {
    try {
      // Obtener informacion de la playlist
      const { data: playlistData, error: playlistError } = await supabase
        .from('playlists_with_stats')
        .select('*')
        .eq('id', playlistId)
        .single();

      if (playlistError) throw playlistError;

      // Si no esta autenticado, solo permitir playlists publicas
      if (!isAuthenticated && !playlistData.is_public) {
        return null;
      }

      // Obtener items de la playlist con detalles de las canciones
      const { data: itemsData, error: itemsError } = await supabase
        .from('playlist_items_with_details')
        .select('*')
        .eq('playlist_id', playlistId)
        .order('position', { ascending: true });

      if (itemsError) throw itemsError;

      // Generar collage para la portada si no hay una específica
      let finalCoverUrl = playlistData.cover_url || playlistData.generated_cover_url;

      if (!finalCoverUrl && itemsData && itemsData.length > 0) {
        try {
          // Usar el generador de collages del frontend
          const coverImages = itemsData
            .slice(0, 4)
            .map(item => item.song_cover_url)
            .filter((url): url is string => !!url && url.trim() !== '');

          if (coverImages.length > 0) {
            finalCoverUrl = await getPlaylistCover(itemsData);
          }
        } catch (error) {
          logger.warn('Error generating playlist cover collage:', error);
          // Si falla, usar la primera imagen disponible
          const firstImage = itemsData.find(item => item.song_cover_url)?.song_cover_url;
          if (firstImage) {
            finalCoverUrl = firstImage;
          }
        }
      }

      return {
        ...playlistData,
        cover_url: finalCoverUrl,
        items: itemsData || [],
      };
    } catch (error) {
      logger.error('Error loading playlist with items:', error);
      return null;
    }
  }, [isAuthenticated]);

  // Crear nueva playlist
  const createPlaylist = useCallback(async (
    name: string, 
    description?: string, 
    isPublic: boolean = true
  ): Promise<Playlist | null> => {
    if (!isAuthenticated) {
      logger.warn('User not authenticated, cannot create playlist');
      return null;
    }

    try {
      const newPlaylist = {
        name,
        description: description || null,
        is_public: isPublic,
        user_id: user?.id,
      };

      const { data, error } = await supabase
        .from('playlists')
        .insert(newPlaylist)
        .select()
        .single();

      if (error) throw error;

      // Actualizar lista de playlists
      await loadPlaylists();
      
      return data;
    } catch (error) {
      logger.error('Error creating playlist:', error);
      throw error;
    }
  }, [isAuthenticated, user?.id, loadPlaylists]);

  // Actualizar playlist
  const updatePlaylist = useCallback(async (
    playlistId: string, 
    updates: Partial<Omit<Playlist, 'id' | 'user_id' | 'created_at'>>
  ): Promise<Playlist | null> => {
    if (!isAuthenticated) return null;

    try {
      const { data, error } = await supabase
        .from('playlists')
        .update(updates)
        .eq('id', playlistId)
        .select()
        .single();

      if (error) throw error;

      // Actualizar lista de playlists
      await loadPlaylists();
      
      return data;
    } catch (error) {
      logger.error('Error updating playlist:', error);
      throw error;
    }
  }, [isAuthenticated, user?.id, loadPlaylists]);

  // Eliminar playlist
  const deletePlaylist = useCallback(async (playlistId: string): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlistId)
        .eq('user_id', user?.id); // Solo el dueño puede eliminar

      if (error) throw error;

      // Actualizar lista de playlists
      await loadPlaylists();
      
      return true;
    } catch (error) {
      logger.error('Error deleting playlist:', error);
      throw error;
    }
  }, [isAuthenticated, user?.id, loadPlaylists]);

  // Agregar canción a playlist
  const addSongToPlaylist = useCallback(async (
    playlistId: string, 
    musicEntryId: string, 
    notes?: string
  ): Promise<PlaylistItem | null> => {
    if (!isAuthenticated) return null;

    try {
      // Obtener la posición más alta actual
      const { data: existingItems, error: fetchError } = await supabase
        .from('playlist_items')
        .select('position')
        .eq('playlist_id', playlistId)
        .order('position', { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      const nextPosition = existingItems && existingItems.length > 0 
        ? existingItems[0].position + 1 
        : 1;

      const newItem = {
        playlist_id: playlistId,
        music_entry_id: musicEntryId,
        position: nextPosition,
        notes: notes || null,
      };

      const { data, error } = await supabase
        .from('playlist_items')
        .insert(newItem)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      logger.error('Error adding song to playlist:', error);
      throw error;
    }
  }, [isAuthenticated]);

  // Eliminar canción de playlist
  const removeSongFromPlaylist = useCallback(async (
    playlistId: string, 
    itemId: string
  ): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      const { error } = await supabase
        .from('playlist_items')
        .delete()
        .eq('id', itemId)
        .eq('playlist_id', playlistId);

      if (error) throw error;

      // Reordenar posiciones restantes
      await reorderPlaylistItems(playlistId);
      
      return true;
    } catch (error) {
      logger.error('Error removing song from playlist:', error);
      throw error;
    }
  }, [isAuthenticated]);

  // Reordenar items en playlist
  const reorderPlaylistItems = useCallback(async (playlistId: string): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      // Obtener todos los items ordenados por posición actual
      const { data: items, error: fetchError } = await supabase
        .from('playlist_items')
        .select('id, position')
        .eq('playlist_id', playlistId)
        .order('position', { ascending: true });

      if (fetchError) throw fetchError;

      // Actualizar posiciones secuencialmente
      const updates = items?.map((item, index) => ({
        id: item.id,
        position: index + 1,
      })) || [];

      for (const update of updates) {
        const { error } = await supabase
          .from('playlist_items')
          .update({ position: update.position })
          .eq('id', update.id);

        if (error) throw error;
      }

      return true;
    } catch (error) {
      logger.error('Error reordering playlist items:', error);
      throw error;
    }
  }, [isAuthenticated]);

  // Mover canción en playlist
  const moveSongInPlaylist = useCallback(async (
    playlistId: string,
    itemId: string,
    newPosition: number
  ): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      // Obtener posición actual
      const { data: currentItem, error: fetchError } = await supabase
        .from('playlist_items')
        .select('position')
        .eq('id', itemId)
        .single();

      if (fetchError) throw fetchError;

      const currentPosition = currentItem.position;

      if (currentPosition === newPosition) return true;

      // Actualizar posición del item
      const { error: updateError } = await supabase
        .from('playlist_items')
        .update({ position: newPosition })
        .eq('id', itemId);

      if (updateError) throw updateError;

      // Ajustar posiciones de otros items
      const { data: allItems, error: itemsError } = await supabase
        .from('playlist_items')
        .select('id, position')
        .eq('playlist_id', playlistId)
        .order('position', { ascending: true });

      if (itemsError) throw itemsError;

      // Reasignar posiciones
      let position = 1;
      for (const item of allItems || []) {
        if (item.id === itemId) continue; // Ya actualizado
        
        if (position === newPosition) position++; // Saltar la nueva posición
        
        if (item.position !== position) {
          await supabase
            .from('playlist_items')
            .update({ position })
            .eq('id', item.id);
        }
        
        position++;
      }

      return true;
    } catch (error) {
      logger.error('Error moving song in playlist:', error);
      throw error;
    }
  }, [isAuthenticated]);

  // Buscar playlists por nombre (publicas si no autenticado, propias si si)
  const searchPlaylists = useCallback(async (query: string): Promise<Playlist[]> => {
    try {
      let queryBuilder = supabase
        .from('playlists_with_stats')
        .select('*')
        .ilike('name', `%${query}%`)
        .order('updated_at', { ascending: false });

      if (isAuthenticated && user?.id) {
        queryBuilder = queryBuilder.eq('user_id', user.id);
      } else {
        queryBuilder = queryBuilder.eq('is_public', true);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error searching playlists:', error);
      return [];
    }
  }, [isAuthenticated, user?.id]);

  // Cargar playlists al montar el componente
  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  return {
    playlists,
    isLoading,
    loadPlaylists,
    loadPlaylistWithItems,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    moveSongInPlaylist,
    searchPlaylists,
  };
}