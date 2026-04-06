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
      return null; // Retornar null silenciosamente
    }

    try {
      // Preparar datos para insertar (ahora 'ep' es válido)
      const insertData: any = {
        title: entry.title,
        artist: entry.artist,
        cover_url: entry.coverUrl,
        rating: entry.rating,
        review: entry.review,
        type: entry.type, // 'album', 'song', o 'ep'
        mood: entry.mood,
      };

      // Solo agregar track_count si existe
      if (entry.trackCount !== undefined) {
        insertData.track_count = entry.trackCount;
      }

      console.log('📤 Attempting to insert entry:', insertData);

      const { data, error } = await supabase
        .from('music_entries')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        console.error('❌ Data that failed:', insertData);
        throw new Error(`Supabase error: ${error.message || 'Unknown error'}`);
      }

      console.log('✅ Entry inserted successfully:', data);

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
      console.error('💥 Error adding entry:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error adding entry');
    }
  }, [isAuthenticated]);

  const updateEntry = useCallback(async (id: string, updates: Partial<MusicEntry>) => {
    if (!isAuthenticated) {
      return null; // Retornar null silenciosamente
    }

    try {
      // Preparar datos de actualización (ahora 'ep' es válido)
      const updateData: any = {};
      
      if (updates.title) updateData.title = updates.title;
      if (updates.artist) updateData.artist = updates.artist;
      if (updates.coverUrl) updateData.cover_url = updates.coverUrl;
      if (updates.rating !== undefined) updateData.rating = updates.rating;
      if (updates.review !== undefined) updateData.review = updates.review;
      if (updates.type) updateData.type = updates.type; // 'album', 'song', o 'ep'
      if (updates.mood !== undefined) updateData.mood = updates.mood;
      if (updates.trackCount !== undefined) updateData.track_count = updates.trackCount;

      console.log('📤 Attempting to update entry:', id, updateData);

      const { error } = await supabase
        .from('music_entries')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('❌ Supabase update error:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        console.error('❌ Data that failed:', updateData);
        throw new Error(`Supabase update error: ${error.message || 'Unknown error'}`);
      }

      console.log('✅ Entry updated successfully');

      setEntries((prev) =>
        prev.map((entry) => (entry.id === id ? { ...entry, ...updates } : entry))
      );
    } catch (error) {
      console.error('💥 Error updating entry:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error updating entry');
    }
  }, [isAuthenticated]);

  const deleteEntry = useCallback(async (id: string) => {
    if (!isAuthenticated) {
      return null; // Retornar null silenciosamente
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
