'use client';

import { useState } from 'react';
import { useMusicJournal } from '@/hooks/useMusicJournal';
import { Sidebar } from '@/components/Sidebar';
import { SearchBar } from '@/components/SearchBar';
import { MusicGrid } from '@/components/MusicGrid';
import { Dashboard } from '@/components/Dashboard';

export default function Home() {
  const { entries, isLoaded, addEntry, deleteEntry } = useMusicJournal();
  const [activeTab, setActiveTab] = useState<'journal' | 'stats'>('journal');

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="inline-block">
            <div className="h-12 w-12 rounded-full border-4 border-primary border-t-accent animate-spin"></div>
          </div>
          <p className="text-muted-foreground">Loading your Music Journal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-screen p-4 md:p-8 space-y-8">
          {/* Header Section */}
          <div className="space-y-4">
            <div>
              <h2 className="text-3xl font-bold text-foreground">
                {activeTab === 'journal' ? 'My Music Journal' : 'Statistics'}
              </h2>
              <p className="text-muted-foreground text-sm">
                {activeTab === 'journal'
                  ? 'Rate and reflect on your favorite music'
                  : 'Visualize your listening patterns and preferences'}
              </p>
            </div>

            {/* Search Bar - Only visible in journal tab */}
            {activeTab === 'journal' && (
              <div className="max-w-md">
                <SearchBar onAddEntry={addEntry} />
              </div>
            )}
          </div>

          {/* Content Area */}
          <div>
            {activeTab === 'journal' ? (
              <MusicGrid entries={entries} onDelete={deleteEntry} />
            ) : (
              <Dashboard entries={entries} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
