'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { MusicEntry } from '@/hooks/useMusicJournal';
import { X, Plus } from 'lucide-react';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  music: {
    title: string;
    artist: string;
    coverUrl: string;
    type: 'album' | 'song';
  };
  onSubmit: (entry: Omit<MusicEntry, 'id' | 'date'>) => void;
}

export function RatingModal({
  isOpen,
  onClose,
  music,
  onSubmit,
}: RatingModalProps) {
  const [rating, setRating] = useState([7.0]);
  const [review, setReview] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      onSubmit({
        title: music.title,
        artist: music.artist,
        coverUrl: music.coverUrl,
        rating: rating[0],
        review,
        type: music.type,
        mood: tags.join(', '), // Usamos el campo mood para guardar tags
      });
    } finally {
      setIsSubmitting(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setRating([7.0]);
    setReview('');
    setTags([]);
    setTagInput('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle>Rate This {music.type === 'album' ? 'Album' : 'Song'}</DialogTitle>
          <DialogDescription>
            Add your rating and optional details for this music.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Album/Song Preview */}
          <div className="flex gap-4">
            <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
              <img
                src={music.coverUrl}
                alt={music.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <p className="font-semibold text-foreground text-sm truncate">
                {music.title}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {music.artist}
              </p>
            </div>
          </div>

          {/* Rating Slider */}
          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">
              Rating: <span className="text-primary">{rating[0].toFixed(1)}</span>/10
            </label>
            <Slider
              min={0}
              max={10}
              step={0.1}
              value={rating}
              onValueChange={setRating}
              className="cursor-pointer"
            />
          </div>

          {/* Tags/Géneros */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Tags/Genres (opcional)
            </label>
            <div className="space-y-2">
              <Input
                placeholder="Escribe y presiona Enter para agregar (ej: Rock, Alternative, 90s)..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="bg-secondary border-border"
              />
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-primary/20 text-primary rounded-full text-xs"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:bg-primary/30 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Presiona Enter para agregar múltiples etiquetas
            </p>
          </div>

          {/* Review Text */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Personal Review (opcional)
            </label>
            <Textarea
              placeholder="Write your thoughts about this music..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="bg-secondary border-border text-foreground placeholder-muted-foreground"
              rows={4}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={handleClose}
              className="border-border hover:bg-secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? 'Saving...' : 'Save Entry'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
