'use client';

import { useState } from 'react';
import { useMusicJournal } from '@/hooks/useMusicJournal';
import { useAuth } from '@/hooks/useAuth';
import { useRecommendations } from '@/hooks/useRecommendations';
import { Sidebar } from '@/components/Sidebar';
import { SearchBar } from '@/components/SearchBar';
import { MusicGrid } from '@/components/MusicGrid';
import { AlbumsView } from '@/components/AlbumsView';
import { ArtistsView } from '@/components/ArtistsView';
import { Dashboard } from '@/components/Dashboard';
import { NotificationsView } from '@/components/NotificationsView';
import { RecommendationForm } from '@/components/RecommendationForm';
import { LoginModal } from '@/components/LoginModal';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';

export default function Home() {
  const { entries, isLoaded, addEntry, updateEntry, deleteEntry } = useMusicJournal();
  const { user, signOut, loading: authLoading } = useAuth();
  const { unreadCount } = useRecommendations();
  const [activeTab, setActiveTab] = useState<'journal' | 'albums' | 'artists' | 'stats' | 'notifications'>('journal');
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
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} unreadCount={unreadCount} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-screen p-4 md:p-8 space-y-8">
          {/* Header Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-bold text-foreground">
                  {activeTab === 'journal' ? 'My Music Journal' : 
                   activeTab === 'albums' ? 'My Albums' : 
                   activeTab === 'artists' ? 'My Artists' : 
                   activeTab === 'notifications' ? 'Notifications' :
                   'Statistics'}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {activeTab === 'journal'
                    ? 'Rate and reflect on your favorite music'
                    : activeTab === 'albums'
                    ? 'View and manage your album collection'
                    : activeTab === 'artists'
                    ? 'Explore your favorite artists and their discography'
                    : activeTab === 'notifications'
                    ? 'Check recommendations from your listeners'
                    : 'Visualize your listening patterns and preferences'}
                </p>
              </div>
              
              {/* Auth Status */}
              <div>
                {user ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground font-medium">ImDashie</span>
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
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="max-w-md">
                  <SearchBar onAddEntry={addEntry} existingEntries={entries} />
                </div>
                <Button 
                  variant="outline" 
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  onClick={() => {
                    const formElement = document.getElementById('recommendation-form');
                    if (formElement) {
                      formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }}
                >
                  🎵 Recomendar canción
                </Button>
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'journal' ? (
              <MusicGrid entries={entries} onDelete={deleteEntry} onUpdate={updateEntry} isAuthenticated={!!user} />
            ) : activeTab === 'albums' ? (
              <AlbumsView 
                entries={entries} 
                existingEntries={entries}
                onAddEntry={addEntry}
                onUpdateEntry={updateEntry}
              />
            ) : activeTab === 'artists' ? (
              <ArtistsView entries={entries} />
            ) : activeTab === 'notifications' ? (
              user ? <NotificationsView /> : (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <p className="text-xl text-foreground font-semibold mb-2">Inicia sesión para ver notificaciones</p>
                  <Button onClick={() => setShowLoginModal(true)}>
                    Iniciar Sesión
                  </Button>
                </div>
              )
            ) : (
              <Dashboard entries={entries} />
            )}
          </div>

          {/* Recommendation Form - Visible for everyone in journal tab */}
          {activeTab === 'journal' && (
            <div id="recommendation-form" className="max-w-2xl mx-auto pt-8 border-t-2 border-dashed border-primary/30 animate-in fade-in zoom-in-95 duration-700 delay-200">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-foreground mb-2">¿Tienes una recomendación?</h3>
                <p className="text-muted-foreground">¡Me encantaría escuchar qué música debería explorar!</p>
              </div>
              <RecommendationForm />
            </div>
          )}
        </div>
      </main>
      
      {/* Login Modal */}
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
}
