'use client';

import { useState } from 'react';
import { MusicEntry } from '@/hooks/useMusicJournal';
import { Trash2, Star, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { RatingModal } from './RatingModal';

interface MusicGridProps {
  entries: MusicEntry[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<MusicEntry>) => void;
  isAuthenticated: boolean;
  itemsPerPage?: number;
}

export function MusicGrid({ entries, onDelete, onUpdate, isAuthenticated, itemsPerPage = 12 }: MusicGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [editingEntry, setEditingEntry] = useState<MusicEntry | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Calcular paginación
  const totalPages = Math.ceil(entries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEntries = entries.slice(startIndex, endIndex);

  // Resetear a página 1 si la página actual excede el total
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }

  const handlePrevious = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };
  const handleEditClick = (entry: MusicEntry) => {
    setEditingEntry(entry);
    setShowEditModal(true);
  };

  const handleUpdateEntry = (updatedData: Omit<MusicEntry, 'id' | 'date'>) => {
    if (editingEntry) {
      onUpdate(editingEntry.id, updatedData);
      setShowEditModal(false);
      setEditingEntry(null);
    }
  };

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
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {currentEntries.map((entry, index) => (
        <div
          key={entry.id}
          className="group relative rounded-xl overflow-hidden bg-gradient-to-br from-secondary/80 to-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/60 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-2 animate-in fade-in zoom-in-95 fill-mode-backwards"
          style={{ animationDelay: `${index * 50}ms` }}
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
            {/* Title and Artist - Clickable for edit */}
            <div 
              onClick={() => isAuthenticated && handleEditClick(entry)}
              className={isAuthenticated ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
            >
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
              {entry.mood && (
                <span className="px-2 py-1 bg-primary/20 text-primary rounded">
                  {entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}
                </span>
              )}
              <span className="text-muted-foreground">
                {entry.type === 'album' ? '💿' : '🎵'}
              </span>
              {isAuthenticated && (
                <Edit className="h-3 w-3 text-muted-foreground ml-auto" />
              )}
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

    {/* Pagination Controls */}
    {totalPages > 1 && (
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Info */}
        <div className="text-sm text-muted-foreground order-2 sm:order-1">
          Showing {startIndex + 1}-{Math.min(endIndex, entries.length)} of {entries.length} entries
        </div>

        {/* Page Controls */}
        <div className="flex items-center gap-2 order-1 sm:order-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className="border-border hover:bg-secondary"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Previous</span>
          </Button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => {
                // Mostrar primera, última, página actual y adyacentes
                return (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                );
              })
              .map((page, index, array) => {
                // Agregar ellipsis si hay gaps
                const showEllipsis = index > 0 && page - array[index - 1] > 1;
                return (
                  <div key={page} className="flex items-center">
                    {showEllipsis && (
                      <span className="px-2 text-muted-foreground">...</span>
                    )}
                    <Button
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageClick(page)}
                      className={`w-9 h-9 p-0 ${
                        currentPage === page
                          ? 'bg-primary hover:bg-primary/90'
                          : 'border-border hover:bg-secondary'
                      }`}
                    >
                      {page}
                    </Button>
                  </div>
                );
              })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="border-border hover:bg-secondary"
          >
            <span className="hidden sm:inline mr-1">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )}
    
    {/* Edit Modal */}
    {editingEntry && (
      <RatingModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingEntry(null);
        }}
        music={{
          title: editingEntry.title,
          artist: editingEntry.artist,
          coverUrl: editingEntry.coverUrl,
          type: editingEntry.type,
        }}
        onSubmit={handleUpdateEntry}
        existingData={{
          rating: editingEntry.rating,
          review: editingEntry.review,
          tags: editingEntry.mood ? editingEntry.mood.split(', ').filter(Boolean) : [],
        }}
      />
    )}
    </>
  );
}
