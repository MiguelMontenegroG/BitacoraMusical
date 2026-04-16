import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Recommendation {
  id: string;
  created_at: string;
  title: string;
  artist: string;
  message: string;
  recommender_name: string | null;
  is_anonymous: boolean;
  is_read: boolean;
}

export function useRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Cargar recomendaciones
  const loadRecommendations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('recommendations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRecommendations(data || []);
      setUnreadCount(data?.filter(r => !r.is_read).length || 0);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Enviar recomendación (público) con rate limiting
  const submitRecommendation = async (data: {
    title: string;
    artist: string;
    message: string;
    recommender_name?: string;
    is_anonymous: boolean;
  }) => {
    try {
      // Rate limiting: verificar cuántas recomendaciones se han enviado en la última hora
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { count, error: countError } = await supabase
        .from('recommendations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneHourAgo);

      if (countError) {
        console.error('Error checking rate limit:', countError);
        throw new Error('Error al verificar límite de recomendaciones');
      }

      // Límite: 7 recomendaciones por hora
      if (count && count >= 7) {
        throw new Error('RATE_LIMIT_EXCEEDED');
      }

      // Si está dentro del límite, insertar la recomendación
      const { error } = await supabase.from('recommendations').insert({
        title: data.title,
        artist: data.artist,
        message: data.message,
        recommender_name: data.is_anonymous ? null : data.recommender_name || null,
        is_anonymous: data.is_anonymous,
        is_read: false,
      });

      if (error) throw error;
      
      // Recargar para actualizar contador
      await loadRecommendations();
    } catch (error) {
      console.error('Error submitting recommendation:', error);
      throw error;
    }
  };

  // Marcar como leída
  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('recommendations')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;

      // Actualizar estado local
      setRecommendations(prev =>
        prev.map(rec => rec.id === id ? { ...rec, is_read: true } : rec)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
      throw error;
    }
  };

  // Marcar todas como leídas
  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('recommendations')
        .update({ is_read: true })
        .eq('is_read', false);

      if (error) throw error;

      // Actualizar estado local
      setRecommendations(prev =>
        prev.map(rec => ({ ...rec, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  return {
    recommendations,
    unreadCount,
    loading,
    submitRecommendation,
    markAsRead,
    markAllAsRead,
    refresh: loadRecommendations,
  };
}
