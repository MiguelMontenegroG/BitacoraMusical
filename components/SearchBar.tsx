'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { RatingModal } from './RatingModal';
import { MusicEntry } from '@/hooks/useMusicJournal';

interface SearchBarProps {
  onAddEntry: (entry: Omit<MusicEntry, 'id' | 'date'>) => void;
}

interface SearchResult {
  title: string;
  artist: string;
  coverUrl: string;
  type: 'album' | 'song';
}

export function SearchBar({ onAddEntry }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Simulated search results - ready for API integration
    const mockResults: SearchResult[] = [
      {
        title: 'The Dark Side of the Moon',
        artist: 'Pink Floyd',
        coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop',
        type: 'album',
      },
      {
        title: 'Blinding Lights',
        artist: 'The Weeknd',
        coverUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=300&h=300&fit=crop',
        type: 'song',
      },
      {
        title: 'Rumours',
        artist: 'Fleetwood Mac',
        coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop',
        type: 'album',
      },
    ];

    setSearchResults(mockResults);
    setShowResults(true);
  };

  const handleSelectResult = (result: SearchResult) => {
    setSelectedResult(result);
    setShowRatingModal(true);
  };

  const handleAddEntry = (entry: Omit<MusicEntry, 'id' | 'date'>) => {
    onAddEntry(entry);
    setShowRatingModal(false);
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    setSelectedResult(null);
  };

  return (
    <>
      <form onSubmit={handleSearch} className="w-full">
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for albums or songs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary border-border hover:border-primary/50 focus:border-primary"
            />
          </div>
          <Button type="submit" className="bg-primary hover:bg-primary/90">
            Search
          </Button>
        </div>
      </form>

      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Search Results</DialogTitle>
            <DialogDescription>
              Select an album or song to add to your journal.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((result, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectResult(result)}
                className="group overflow-hidden rounded-lg bg-secondary hover:bg-secondary/80 transition-all"
              >
                <div className="aspect-square overflow-hidden bg-muted">
                  <img
                    src={result.coverUrl}
                    alt={result.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="p-3 text-left">
                  <p className="font-medium text-sm truncate text-foreground">
                    {result.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {result.artist}
                  </p>
                  <p className="text-xs text-primary mt-1">
                    {result.type === 'album' ? '💿 Album' : '🎵 Song'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {selectedResult && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          music={selectedResult}
          onSubmit={handleAddEntry}
        />
      )}
    </>
  );
}
