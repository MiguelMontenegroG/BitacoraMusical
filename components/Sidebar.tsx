'use client';

import { Music, BarChart3, Disc } from 'lucide-react';
import { Button } from './ui/button';

interface SidebarProps {
  activeTab: 'journal' | 'albums' | 'stats';
  onTabChange: (tab: 'journal' | 'albums' | 'stats') => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="w-full md:w-64 bg-sidebar border-b md:border-b-0 md:border-r border-sidebar-border">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <Music className="h-6 w-6 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-sidebar-foreground">Music Journal</h1>
              <p className="text-xs text-sidebar-accent-foreground">Rate & Reflect</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 md:p-6 space-y-2">
          <Button
            variant={activeTab === 'journal' ? 'default' : 'ghost'}
            className="w-full justify-start gap-3"
            onClick={() => onTabChange('journal')}
          >
            <Music className="h-4 w-4" />
            <span>Journal</span>
          </Button>
          <Button
            variant={activeTab === 'albums' ? 'default' : 'ghost'}
            className="w-full justify-start gap-3"
            onClick={() => onTabChange('albums')}
          >
            <Disc className="h-4 w-4" />
            <span>Albums</span>
          </Button>
          <Button
            variant={activeTab === 'stats' ? 'default' : 'ghost'}
            className="w-full justify-start gap-3"
            onClick={() => onTabChange('stats')}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Statistics</span>
          </Button>
        </nav>

        {/* Footer Info */}
        <div className="p-4 md:p-6 border-t border-sidebar-border text-xs text-sidebar-accent-foreground space-y-1">
          <p>✨ Your music journey</p>
          <p>💿 Albums & 🎵 Songs</p>
        </div>
      </div>
    </aside>
  );
}
