import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';

export interface BlogPost {
  id: string;
  user_id: string;
  bio: string;
  banner_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SpecialSong {
  id: string;
  user_id: string;
  music_entry_id: string;
  super_review: string;
  song_url?: string | null;
  created_at: string;
  updated_at: string;
  song_title?: string;
  song_artist?: string;
  song_cover_url?: string;
  song_rating?: number;
  song_review?: string;
  song_type?: string;
}

export function useMyBlog() {
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
  const [specialSongs, setSpecialSongs] = useState<SpecialSong[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  // Cargar blog post
  const loadBlogPost = useCallback(async () => {
    try {
      let query = supabase.from('blog_posts').select('*');

      // Si esta autenticado, carga su propio blog
      // Si no, carga el primer blog disponible (el de ImDashie)
      if (user?.id) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setBlogPost(data || null);
    } catch (error) {
      logger.error('Error loading blog post:', error);
      setBlogPost(null);
    }
  }, [user?.id]);

  // Cargar special songs
  const loadSpecialSongs = useCallback(async () => {
    try {
      let query = supabase.from('special_songs_with_details').select('*');

      // Si esta autenticado, carga sus propias special songs
      // Si no, carga todas (solo hay un usuario de todas formas)
      if (user?.id) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false });

        if (error) throw error;
      setSpecialSongs(data || []);
    } catch (error) {
      logger.error('Error loading special songs:', error);
      setSpecialSongs([]);
    }
  }, [user?.id]);

  // Cargar datos al montar
  useEffect(() => {
    const loadAll = async () => {
      setIsLoading(true);
      await Promise.all([loadBlogPost(), loadSpecialSongs()]);
      setIsLoading(false);
  };
    loadAll();
  }, [loadBlogPost, loadSpecialSongs]);

  // Guardar biografia
  const saveBio = useCallback(async (bio: string): Promise<boolean> => {
    if (!isAuthenticated || !user) return false;

    try {
      const { error } = await supabase
        .from('blog_posts')
        .upsert({ user_id: user.id, bio }, { onConflict: 'user_id' });

      if (error) throw error;

      await loadBlogPost();
      return true;
    } catch (error) {
      logger.error('Error saving bio:', error);
      return false;
    }
  }, [isAuthenticated, user, loadBlogPost]);

  // Guardar banner URL
  const saveBanner = useCallback(async (bannerUrl: string): Promise<boolean> => {
    if (!isAuthenticated || !user) return false;

    try {
      const { error } = await supabase
        .from('blog_posts')
        .upsert({ user_id: user.id, banner_url: bannerUrl }, { onConflict: 'user_id' });

      if (error) throw error;

      await loadBlogPost();
      return true;
    } catch (error) {
      logger.error('Error saving banner:', error);
      return false;
    }
  }, [isAuthenticated, user, loadBlogPost]);

  // Crear special song
  const createSpecialSong = useCallback(async (
    musicEntryId: string,
    superReview: string,
    songUrl?: string
  ): Promise<boolean> => {
    if (!isAuthenticated || !user) return false;

    try {
      const { error } = await supabase
        .from('special_songs')
        .insert({
          user_id: user.id,
          music_entry_id: musicEntryId,
          super_review: superReview,
          song_url: songUrl || null,
        });

      if (error) throw error;

      await loadSpecialSongs();
      return true;
    } catch (error) {
      logger.error('Error creating special song:', error);
      return false;
    }
  }, [isAuthenticated, user, loadSpecialSongs]);

  // Eliminar special song
  const deleteSpecialSong = useCallback(async (id: string): Promise<boolean> => {
    if (!isAuthenticated || !user) return false;

    try {
      const { error } = await supabase
        .from('special_songs')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await loadSpecialSongs();
      return true;
    } catch (error) {
      logger.error('Error deleting special song:', error);
      return false;
    }
  }, [isAuthenticated, user, loadSpecialSongs]);

  // Actualizar special song
  const updateSpecialSong = useCallback(async (
    id: string,
    superReview: string,
    songUrl?: string
  ): Promise<boolean> => {
    if (!isAuthenticated || !user) return false;

    try {
      const { error } = await supabase
        .from('special_songs')
        .update({
          super_review: superReview,
          song_url: songUrl || null,
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await loadSpecialSongs();
      return true;
    } catch (error) {
      logger.error('Error updating special song:', error);
      return false;
    }
  }, [isAuthenticated, user, loadSpecialSongs]);

  return {
    blogPost,
    specialSongs,
    isLoading,
    saveBio,
    saveBanner,
    createSpecialSong,
    updateSpecialSong,
    deleteSpecialSong,
  };
}
