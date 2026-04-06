'use client';

import { MusicEntry } from '@/hooks/useMusicJournal';
import { Trash2, Star } from 'lucide-react';
import { Button } from './ui/button';

interface MusicGridProps {
  entries: MusicEntry[];
  onDelete: (id: string) => void;
  isAuthenticated: boolean;
}

export function MusicGrid({ entries, onDelete, isAuthenticated }: MusicGridProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-muted-foreground text-center space-y-2">
          <p className="text-xl">🎵 No entries yet</p>
          <p className="text-sm">Start rating your favorite albums and songs!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="group relative rounded-lg overflow-hidden bg-secondary border border-border hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10"
        >
          {/* Cover Image */}
          <div className="aspect-square overflow-hidden bg-muted relative">
            <img
              src={entry.coverUrl}
              alt={entry.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            {/* Overlay on hover - Only show delete if authenticated */}
            {isAuthenticated && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(entry.id)}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-3 space-y-2">
            {/* Title and Artist */}
            <div>
              <p className="font-semibold text-sm text-foreground truncate">
                {entry.title}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {entry.artist}
              </p>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="text-sm font-medium text-foreground">
                {entry.rating.toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground">/10</span>
            </div>

            {/* Mood and Type */}
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-1 bg-primary/20 text-primary rounded">
                {entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}
              </span>
              <span className="text-muted-foreground">
                {entry.type === 'album' ? '💿' : '🎵'}
              </span>
            </div>

            {/* Review Preview */}
            {entry.review && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {entry.review}
              </p>
            )}

            {/* Date */}
            <p className="text-xs text-muted-foreground">
              {new Date(entry.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
