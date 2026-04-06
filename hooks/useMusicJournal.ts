import { useState, useEffect, useCallback } from 'react';

export interface MusicEntry {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  rating: number;
  review: string;
  date: string;
  type: 'album' | 'song';
  mood: string;
}

const STORAGE_KEY = 'musicJournal_entries';

export function useMusicJournal() {
  const [entries, setEntries] = useState<MusicEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setEntries(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to load entries from localStorage', error);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever entries change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    }
  }, [entries, isLoaded]);

  const addEntry = useCallback((entry: Omit<MusicEntry, 'id' | 'date'>) => {
    const newEntry: MusicEntry = {
      ...entry,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    };
    setEntries((prev) => [newEntry, ...prev]);
    return newEntry;
  }, []);

  const updateEntry = useCallback((id: string, updates: Partial<MusicEntry>) => {
    setEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, ...updates } : entry))
    );
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

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
