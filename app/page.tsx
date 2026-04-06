'use client';

import { useState } from 'react';
import { useMusicJournal } from '@/hooks/useMusicJournal';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from '@/components/Sidebar';
import { SearchBar } from '@/components/SearchBar';
import { MusicGrid } from '@/components/MusicGrid';
import { AlbumsView } from '@/components/AlbumsView';
import { Dashboard } from '@/components/Dashboard';
import { LoginModal } from '@/components/LoginModal';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';

export default function Home() {
  const { entries, isLoaded, addEntry, updateEntry, deleteEntry } = useMusicJournal();
  const { user, signOut, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'journal' | 'albums' | 'stats'>('journal');
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Sesión cerrada correctamente');
    } catch (error) {
      toast.error('Error al cerrar sesión');
    }
  };

  if (!isLoaded || authLoading) {
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
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-bold text-foreground">
                  {activeTab === 'journal' ? 'My Music Journal' : activeTab === 'albums' ? 'My Albums' : 'Statistics'}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {activeTab === 'journal'
                    ? 'Rate and reflect on your favorite music'
                    : activeTab === 'albums'
                    ? 'View and manage your album collection'
                    : 'Visualize your listening patterns and preferences'}
                </p>
              </div>
              
              {/* Auth Status */}
              <div>
                {user ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{user.email}</span>
                    <Button variant="outline" size="sm" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar Sesión
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setShowLoginModal(true)}>
                    Iniciar Sesión
                  </Button>
                )}
              </div>
            </div>

            {/* Search Bar - Only visible in journal tab */}
            {activeTab === 'journal' && (
              <div className="max-w-md">
                <SearchBar onAddEntry={addEntry} existingEntries={entries} />
              </div>
            )}
          </div>

          {/* Content Area */}
          <div>
            {activeTab === 'journal' ? (
              <MusicGrid entries={entries} onDelete={deleteEntry} onUpdate={updateEntry} isAuthenticated={!!user} />
            ) : activeTab === 'albums' ? (
              <AlbumsView 
                entries={entries} 
                existingEntries={entries}
                onAddEntry={addEntry}
                onUpdateEntry={updateEntry}
              />
            ) : (
              <Dashboard entries={entries} />
            )}
          </div>
        </div>
      </main>
      
      {/* Login Modal */}
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
}
