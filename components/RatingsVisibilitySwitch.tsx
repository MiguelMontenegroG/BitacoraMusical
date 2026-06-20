'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RatingsVisibilitySwitchProps {
  ratingsVisible: boolean;
  onToggle: () => Promise<boolean>;
  isAuthenticated: boolean;
}

export function RatingsVisibilitySwitch({
  ratingsVisible,
  onToggle,
  isAuthenticated,
}: RatingsVisibilitySwitchProps) {
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión para cambiar la visibilidad');
      return;
    }

    setIsToggling(true);
    try {
      const success = await onToggle();
      if (success) {
        toast.success(
          ratingsVisible
            ? 'Calificaciones ocultadas para todos'
            : 'Calificaciones visibles para todos'
        );
      } else {
        toast.error('Error al cambiar la visibilidad');
      }
    } catch (error) {
      toast.error('Error al cambiar la visibilidad');
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            {isToggling ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : ratingsVisible ? (
              <Eye className="h-4 w-4 text-green-500" />
            ) : (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            )}
            <Switch
              checked={ratingsVisible}
              onCheckedChange={handleToggle}
              disabled={!isAuthenticated || isToggling}
              className={!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {isAuthenticated
            ? ratingsVisible
              ? 'Ocultar calificaciones para los visitantes'
              : 'Mostrar calificaciones para los visitantes'
            : 'Inicia sesión para controlar la visibilidad de las calificaciones'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
