'use client';

import { ThumbsUp, ThumbsDown, Minus } from 'lucide-react';

interface RatingBadgeProps {
  rating: number;
  showNumber?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Componente que muestra la calificacion como un circulo de color.
 * El circulo de color SIEMPRE se muestra (es decorativo).
 * El numero de calificacion se oculta si showNumber=false.
 *
 * Rangos:
 * - 4.5 a 10.0: Verde con pulgar arriba
 * - 2.0 a 4.4: Naranja con guion neutral
 * - 0 a 1.9: Rojo con pulgar abajo
 */
export function RatingBadge({ rating, showNumber = true, size = 'md' }: RatingBadgeProps) {
  const getColorClass = () => {
    if (rating >= 4.5) return 'bg-green-500';
    if (rating >= 2.0) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getTextColorClass = () => {
    if (rating >= 4.5) return 'text-green-500';
    if (rating >= 2.0) return 'text-orange-500';
    return 'text-red-500';
  };

  const sizeClasses = {
    sm: {
      container: 'w-8 h-8',
      iconSize: 'h-3.5 w-3.5',
      text: 'text-[10px]',
    },
    md: {
      container: 'w-10 h-10',
      iconSize: 'h-4 w-4',
      text: 'text-xs',
    },
    lg: {
      container: 'w-14 h-14',
      iconSize: 'h-6 w-6',
      text: 'text-sm',
    },
  };

  const sizeClass = sizeClasses[size];

  const renderCircleContent = () => {
    if (rating >= 4.5) {
      return <ThumbsUp className={`${sizeClass.iconSize} text-white`} />;
    }
    if (rating >= 2.0) {
      return <Minus className={`${sizeClass.iconSize} text-white`} />;
    }
    return <ThumbsDown className={`${sizeClass.iconSize} text-white`} />;
  };

  return (
    <div className="flex items-center gap-2">
      {/* Circulo de color - Siempre visible, es decorativo */}
      <div
        className={`${sizeClass.container} ${getColorClass()} rounded-full flex items-center justify-center shadow-lg`}
      >
        {renderCircleContent()}
      </div>

      {/* Numero (opcional) - Se oculta cuando showNumber=false */}
      {showNumber && (
        <div className="flex items-center gap-1">
          <span className={`text-base font-bold ${getTextColorClass()}`}>
            {rating.toFixed(1)}
          </span>
          <span className="text-sm text-muted-foreground">/10</span>
        </div>
      )}
    </div>
  );
}
