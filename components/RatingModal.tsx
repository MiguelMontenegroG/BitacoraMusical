'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Textarea } from './ui/textarea';
import { MusicEntry } from '@/hooks/useMusicJournal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

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

const MOODS = [
  { value: 'happy', label: '😊 Happy' },
  { value: 'sad', label: '😢 Sad' },
  { value: 'energetic', label: '⚡ Energetic' },
  { value: 'calm', label: '😌 Calm' },
  { value: 'inspired', label: '✨ Inspired' },
  { value: 'melancholic', label: '🌧️ Melancholic' },
  { value: 'thoughtful', label: '🤔 Thoughtful' },
  { value: 'excited', label: '🎉 Excited' },
];

export function RatingModal({
  isOpen,
  onClose,
  music,
  onSubmit,
}: RatingModalProps) {
  const [rating, setRating] = useState([7.0]);
  const [review, setReview] = useState('');
  const [mood, setMood] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!mood) {
      alert('Please select a mood');
      return;
    }

    setIsSubmitting(true);
    try {
      onSubmit({
        title: music.title,
        artist: music.artist,
        coverUrl: music.coverUrl,
        rating: rating[0],
        review,
        type: music.type,
        mood,
      });
    } finally {
      setIsSubmitting(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setRating([7.0]);
    setReview('');
    setMood('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle>Rate This {music.type === 'album' ? 'Album' : 'Song'}</DialogTitle>
          <DialogDescription>
            Add your rating, mood, and personal review for this music.
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

          {/* Mood Selector */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Your Mood
            </label>
            <Select value={mood} onValueChange={setMood}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select your mood..." />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {MOODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Review Text */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Personal Review
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
