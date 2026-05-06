'use client';

import { useState, useEffect } from 'react';

interface PlaylistCoverProps {
  imageUrls: string[];
  size?: number;
  className?: string;
  alt?: string;
}

export function PlaylistCover({ 
  imageUrls, 
  size = 400, 
  className = '', 
  alt = 'Playlist cover' 
}: PlaylistCoverProps) {
  const [loadedImages, setLoadedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar imágenes
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    const loadImages = async () => {
      const validUrls = imageUrls
        .slice(0, 4)
        .filter(url => url && url.trim() !== '');
      
      if (validUrls.length === 0) {
        if (mounted) {
          setLoadedImages([]);
          setIsLoading(false);
        }
        return;
      }

      // Intentar cargar cada imagen
      const loaded: string[] = [];
      for (const url of validUrls) {
        try {
          await new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              loaded.push(url);
              resolve(null);
            };
            img.onerror = reject;
            img.src = url;
          });
        } catch (error) {
          console.warn(`Failed to load image: ${url}`);
        }
      }

      if (mounted) {
        setLoadedImages(loaded);
        setIsLoading(false);
      }
    };

    loadImages();

    return () => {
      mounted = false;
    };
  }, [imageUrls]);

  // Si no hay imágenes o está cargando, mostrar placeholder
  if (isLoading || loadedImages.length === 0) {
    return (
      <div 
        className={`bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="text-muted-foreground">
          <svg 
            className="w-12 h-12 mx-auto" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" 
            />
          </svg>
        </div>
      </div>
    );
  }

  // Si solo hay una imagen, mostrarla completa
  if (loadedImages.length === 1) {
    return (
      <div className={`overflow-hidden ${className}`} style={{ width: size, height: size }}>
        <img
          src={loadedImages[0]}
          alt={alt}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = '/placeholder.jpg';
          }}
        />
      </div>
    );
  }

  // Para múltiples imágenes, crear un collage CSS
  const gridSize = loadedImages.length <= 2 ? 2 : 2; // Siempre 2x2 grid
  const itemSize = size / gridSize;
  
  return (
    <div 
      className={`grid grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      {loadedImages.map((url, index) => (
        <div key={index} className="overflow-hidden">
          <img
            src={url}
            alt={`${alt} part ${index + 1}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.jpg';
            }}
          />
        </div>
      ))}
      {/* Rellenar espacios vacíos si hay menos de 4 imágenes */}
      {Array.from({ length: 4 - loadedImages.length }).map((_, index) => (
        <div 
          key={`empty-${index}`}
          className="bg-gradient-to-br from-primary/10 to-secondary/10"
        />
      ))}
    </div>
  );
}

// Versión simplificada para uso rápido
interface SimplePlaylistCoverProps {
  playlist: {
    cover_url?: string | null;
    generated_cover_url?: string | null;
    song_count?: number | null;
  };
  size?: number;
  className?: string;
  alt?: string;
}

export function SimplePlaylistCover({ 
  playlist, 
  size = 400, 
  className = '', 
  alt = 'Playlist cover' 
}: SimplePlaylistCoverProps) {
  const coverUrl = playlist.cover_url || playlist.generated_cover_url;
  
  if (!coverUrl) {
    return (
      <div 
        className={`bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="text-muted-foreground">
          <svg 
            className="w-12 h-12 mx-auto" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" 
            />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden relative ${className}`} style={{ width: size, height: size }}>
      <img
        src={coverUrl}
        alt={alt}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.src = '/placeholder.jpg';
        }}
      />
      {/* Grid overlay para mostrar que es un collage (si tiene múltiples canciones) */}
      {playlist.song_count && playlist.song_count > 1 && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-1/2 h-1/2 border-r border-b border-white/20"></div>
          <div className="absolute top-0 right-0 w-1/2 h-1/2 border-l border-b border-white/20"></div>
          <div className="absolute bottom-0 left-0 w-1/2 h-1/2 border-r border-t border-white/20"></div>
          <div className="absolute bottom-0 right-0 w-1/2 h-1/2 border-l border-t border-white/20"></div>
        </div>
      )}
    </div>
  );
}