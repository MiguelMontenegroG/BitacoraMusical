'use client';

import { Card } from './ui/card';
import { Button } from './ui/button';
import { Bell, Check, CheckCheck, X, User } from 'lucide-react';
import { useRecommendations } from '@/hooks/useRecommendations';
import { toast } from 'sonner';

export function NotificationsView() {
  const { recommendations, unreadCount, markAsRead, markAllAsRead, loading, refresh } = useRecommendations();

  const handleToggleRead = async (id: string, currentStatus: boolean) => {
    try {
      await markAsRead(id);
      await refresh();
      toast.success(currentStatus ? 'Marcada como no leída' : 'Marcada como leída');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      await refresh();
      toast.success('Todas marcadas como leídas');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <div className="inline-block h-8 w-8 rounded-full border-4 border-primary border-t-accent animate-spin"></div>
          <p className="text-muted-foreground">Cargando notificaciones...</p>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <Bell className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
        <p className="text-xl text-foreground font-semibold">Sin notificaciones</p>
        <p className="text-sm text-muted-foreground mt-2">Aún no has recibido recomendaciones</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      {unreadCount > 0 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {unreadCount} recomendación{unreadCount !== 1 ? 'es' : ''} sin leer
          </p>
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Marcar todas como leídas
          </Button>
        </div>
      )}

      {/* Recommendations List */}
      <div className="space-y-3">
        {recommendations.map((rec) => (
          <Card
            key={rec.id}
            className={`border-border transition-all ${
              !rec.is_read
                ? 'bg-primary/5 border-primary/30 shadow-md'
                : 'bg-secondary opacity-75'
            }`}
          >
            <div className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2">
                    {!rec.is_read && (
                      <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
                    )}
                    <h4 className="font-semibold text-foreground truncate">
                      {rec.title}
                    </h4>
                    <span className="text-muted-foreground">—</span>
                    <p className="text-sm text-muted-foreground truncate">
                      {rec.artist}
                    </p>
                  </div>

                  {/* Message */}
                  <p className="text-sm text-foreground mb-3">{rec.message}</p>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      {rec.is_anonymous ? (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Anónimo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {rec.recommender_name || 'Desconocido'}
                        </span>
                      )}
                      <span>•</span>
                      <span>
                        {new Date(rec.created_at).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {!rec.is_read ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleRead(rec.id, false)}
                        className="h-7 px-2 text-green-600 hover:text-green-700"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Marcar como leída
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleRead(rec.id, true)}
                        className="h-7 px-2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Marcar como no leída
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
