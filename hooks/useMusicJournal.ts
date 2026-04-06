import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface MusicEntry {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  rating: number;
  review: string;
  date: string;
  type: 'album' | 'song' | 'ep';
  mood: string;
  trackCount?: number; // Número de tracks (para álbumes/EPs)
}

export function useMusicJournal() {
  const [entries, setEntries] = useState<MusicEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { isAuthenticated } = useAuth();

  // Cargar entradas desde Supabase
  const loadEntries = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('music_entries')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      const formattedEntries: MusicEntry[] = (data || []).map(entry => ({
        id: entry.id,
        title: entry.title,
        artist: entry.artist,
        coverUrl: entry.cover_url || '',
        rating: Number(entry.rating),
        review: entry.review || '',
        date: entry.date,
        type: entry.type || 'song',
        mood: entry.mood || '',
        trackCount: entry.track_count || undefined,
      }));

      setEntries(formattedEntries);
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const addEntry = useCallback(async (entry: Omit<MusicEntry, 'id' | 'date'>) => {
    if (!isAuthenticated) {
      throw new Error('Debes iniciar sesión para agregar entradas');
    }

    try {
      const { data, error } = await supabase
        .from('music_entries')
        .insert({
          title: entry.title,
          artist: entry.artist,
          cover_url: entry.coverUrl,
          rating: entry.rating,
          review: entry.review,
          type: entry.type,
          mood: entry.mood,
          track_count: entry.trackCount,
        })
        .select()
        .single();

      if (error) throw error;

      const newEntry: MusicEntry = {
        id: data.id,
        title: data.title,
        artist: data.artist,
        coverUrl: data.cover_url || '',
        rating: Number(data.rating),
        review: data.review || '',
        date: data.date,
        type: data.type || 'song',
        mood: data.mood || '',
        trackCount: data.track_count || undefined,
      };

      setEntries((prev) => [newEntry, ...prev]);
      return newEntry;
    } catch (error) {
      console.error('Error adding entry:', error);
      throw error;
    }
  }, [isAuthenticated]);

  const updateEntry = useCallback(async (id: string, updates: Partial<MusicEntry>) => {
    if (!isAuthenticated) {
      throw new Error('Debes iniciar sesión para actualizar entradas');
    }

    try {
      const { error } = await supabase
        .from('music_entries')
        .update({
          ...(updates.title && { title: updates.title }),
          ...(updates.artist && { artist: updates.artist }),
          ...(updates.coverUrl && { cover_url: updates.coverUrl }),
          ...(updates.rating !== undefined && { rating: updates.rating }),
          ...(updates.review !== undefined && { review: updates.review }),
          ...(updates.type && { type: updates.type }),
          ...(updates.mood !== undefined && { mood: updates.mood }),
          ...(updates.trackCount !== undefined && { track_count: updates.trackCount }),
        })
        .eq('id', id);

      if (error) throw error;

      setEntries((prev) =>
        prev.map((entry) => (entry.id === id ? { ...entry, ...updates } : entry))
      );
    } catch (error) {
      console.error('Error updating entry:', error);
      throw error;
    }
  }, [isAuthenticated]);

  const deleteEntry = useCallback(async (id: string) => {
    if (!isAuthenticated) {
      throw new Error('Debes iniciar sesión para eliminar entradas');
    }

    try {
      const { error } = await supabase
        .from('music_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEntries((prev) => prev.filter((entry) => entry.id !== id));
    } catch (error) {
      console.error('Error deleting entry:', error);
      throw error;
    }
  }, [isAuthenticated]);

  const getRatingDistribution = useCallback(() => {
    const distribution: Record<number, number> = {};
    entries.forEach((entry) => {
      const roundedRating = Math.round(entry.rating * 10) / 10;
      distribution[roundedRating] = (distribution[roundedRating] || 0) + 1;
    });
    return Object.entries(distribution)
      .map(([rating, count]) => ({
        rating: parseFloat(rating),
        count,
      }))
      .sort((a, b) => a.rating - b.rating);
  }, [entries]);

  const getAverageRatingOverTime = useCallback(() => {
    const sortedEntries = [...entries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let cumulativeSum = 0;
    return sortedEntries.map((entry, index) => {
      cumulativeSum += entry.rating;
      const date = new Date(entry.date);
      return {
        date: date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        average: Math.round((cumulativeSum / (index + 1)) * 10) / 10,
        fullDate: entry.date,
      };
    });
  }, [entries]);

  return {
    entries,
    isLoaded,
    addEntry,
    updateEntry,
    deleteEntry,
    getRatingDistribution,
    getAverageRatingOverTime,
  };
}
