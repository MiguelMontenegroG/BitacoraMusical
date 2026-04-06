'use client';

import { Music, BarChart3, Disc, Users, Bell } from 'lucide-react';
import { Button } from './ui/button';

interface SidebarProps {
  activeTab: 'journal' | 'albums' | 'artists' | 'stats' | 'notifications';
  onTabChange: (tab: 'journal' | 'albums' | 'artists' | 'stats' | 'notifications') => void;
  unreadCount?: number;
}

export function Sidebar({ activeTab, onTabChange, unreadCount = 0 }: SidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-gradient-to-b from-sidebar via-sidebar to-sidebar/95 border-r border-sidebar-border backdrop-blur-sm flex-col">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-sidebar-border bg-gradient-to-r from-sidebar-primary/10 to-transparent">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sidebar-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30 animate-pulse-slow">
                <Music className="h-6 w-6 text-sidebar-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-sidebar-foreground bg-gradient-to-r from-sidebar-foreground to-sidebar-foreground/70 bg-clip-text">Music Journal</h1>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-6 space-y-2">
            <Button
              variant={activeTab === 'journal' ? 'default' : 'ghost'}
              className="w-full justify-start gap-3 transition-all duration-200 hover:scale-105"
              onClick={() => onTabChange('journal')}
            >
              <Music className="h-4 w-4" />
              <span>Journal</span>
            </Button>
            <Button
              variant={activeTab === 'albums' ? 'default' : 'ghost'}
              className="w-full justify-start gap-3 transition-all duration-200 hover:scale-105"
              onClick={() => onTabChange('albums')}
            >
              <Disc className="h-4 w-4" />
              <span>Albums</span>
            </Button>
            <Button
              variant={activeTab === 'artists' ? 'default' : 'ghost'}
              className="w-full justify-start gap-3 transition-all duration-200 hover:scale-105"
              onClick={() => onTabChange('artists')}
            >
              <Users className="h-4 w-4" />
              <span>Artists</span>
            </Button>
            <Button
              variant={activeTab === 'stats' ? 'default' : 'ghost'}
              className="w-full justify-start gap-3 transition-all duration-200 hover:scale-105"
              onClick={() => onTabChange('stats')}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Statistics</span>
            </Button>
            <Button
              variant={activeTab === 'notifications' ? 'default' : 'ghost'}
              className="w-full justify-start gap-3 relative transition-all duration-200 hover:scale-105"
              onClick={() => onTabChange('notifications')}
            >
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-in zoom-in">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </nav>

          {/* Footer Info */}
          <div className="p-6 border-t border-sidebar-border bg-gradient-to-r from-sidebar-primary/5 to-transparent text-xs text-sidebar-accent-foreground space-y-1">
            <p className="flex items-center gap-2"><span className="animate-bounce">✨</span> Your music journey</p>
            <p className="flex items-center gap-2"><span>💿</span> Albums & 🎵 Songs</p>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-bottom">
        <div className="grid grid-cols-5 gap-1 p-2">
          <button
            onClick={() => onTabChange('journal')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${
              activeTab === 'journal' ? 'text-primary bg-primary/10' : 'text-muted-foreground'
            }`}
          >
            <Music className="h-5 w-5" />
            <span className="text-[10px] mt-1 font-medium">Journal</span>
          </button>
          <button
            onClick={() => onTabChange('albums')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${
              activeTab === 'albums' ? 'text-primary bg-primary/10' : 'text-muted-foreground'
            }`}
          >
            <Disc className="h-5 w-5" />
            <span className="text-[10px] mt-1 font-medium">Albums</span>
          </button>
          <button
            onClick={() => onTabChange('artists')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${
              activeTab === 'artists' ? 'text-primary bg-primary/10' : 'text-muted-foreground'
            }`}
          >
            <Users className="h-5 w-5" />
            <span className="text-[10px] mt-1 font-medium">Artists</span>
          </button>
          <button
            onClick={() => onTabChange('stats')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${
              activeTab === 'stats' ? 'text-primary bg-primary/10' : 'text-muted-foreground'
            }`}
          >
            <BarChart3 className="h-5 w-5" />
            <span className="text-[10px] mt-1 font-medium">Stats</span>
          </button>
          <button
            onClick={() => onTabChange('notifications')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors relative ${
              activeTab === 'notifications' ? 'text-primary bg-primary/10' : 'text-muted-foreground'
            }`}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[8px] rounded-full h-4 w-4 flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            <span className="text-[10px] mt-1 font-medium">Alerts</span>
          </button>
        </div>
      </nav>
    </>
  );
}
