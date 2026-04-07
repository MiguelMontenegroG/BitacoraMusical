'use client';

import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Send, Music } from 'lucide-react';
import { toast } from 'sonner';
import { useRecommendations } from '@/hooks/useRecommendations';

export function RecommendationForm() {
  const { submitRecommendation } = useRecommendations();
  const [isLoading, setIsLoading] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    message: '',
    recommender_name: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.artist.trim()) {
      toast.error('Por favor completa el título y el artista');
      return;
    }

    setIsLoading(true);
    
    try {
      await submitRecommendation({
        title: formData.title.trim(),
        artist: formData.artist.trim(),
        message: formData.message.trim(),
        recommender_name: isAnonymous ? undefined : formData.recommender_name.trim() || undefined,
        is_anonymous: isAnonymous,
      });

      toast.success('¡Recomendación enviada con éxito! 🎵', {
        description: 'Gracias por compartir tu música conmigo',
        duration: 5000,
      });
      
      // Reset form
      setFormData({
        title: '',
        artist: '',
        message: '',
        recommender_name: '',
      });
      setIsAnonymous(false);
      
      // Scroll suave hacia arriba para que el usuario vea el toast
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al enviar la recomendación. Intenta de nuevo.', {
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-secondary to-card border-border p-6">
      <div className="flex items-center gap-2 mb-4">
        <Music className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Recomiéndame Música</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        ¿Hay algún álbum o canción que deba escuchar? ¡Déjame tu recomendación!
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              placeholder="Nombre del álbum o canción"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="artist">Artista *</Label>
            <Input
              id="artist"
              placeholder="Nombre del artista"
              value={formData.artist}
              onChange={(e) => setFormData(prev => ({ ...prev, artist: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Mensaje (opcional)</Label>
          <Textarea
            id="message"
            placeholder="¿Por qué me recomiendas esto? Cuéntame más..."
            value={formData.message}
            onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
            rows={3}
          />
        </div>

        <div className="space-y-3 pt-4 border-t-2 border-primary/20">
          <div className="flex items-center space-x-3 bg-secondary/50 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
            <Checkbox
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary h-5 w-5 border-2"
            />
            <Label htmlFor="anonymous" className="text-sm font-medium cursor-pointer select-none text-foreground">
              👤 Enviar como anónimo
            </Label>
          </div>

          {!isAnonymous && (
            <div className="space-y-2 animate-in slide-in-from-top-2">
              <Label htmlFor="name">Tu nombre (opcional)</Label>
              <Input
                id="name"
                placeholder="¿Cómo te llamas?"
                value={formData.recommender_name}
                onChange={(e) => setFormData(prev => ({ ...prev, recommender_name: e.target.value }))}
              />
            </div>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Enviando...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Enviar Recomendación
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}
