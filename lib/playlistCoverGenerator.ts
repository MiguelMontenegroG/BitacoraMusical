/**
 * Utilidades para generar portadas de playlists
 * Versión simplificada - la generación real se hace en el componente PlaylistCover
 */

/**
 * Obtiene las URLs de las imágenes de las primeras canciones de una playlist
 */
export function getPlaylistCoverImages(playlistItems: Array<{ song_cover_url?: string }>): string[] {
  if (!playlistItems || playlistItems.length === 0) {
    return [];
  }

  return playlistItems
    .slice(0, 4) // Tomar máximo 4 canciones
    .map(item => item.song_cover_url)
    .filter((url): url is string => !!url && url.trim() !== '');
}

/**
 * Función de utilidad para obtener la portada de una playlist
 * Ahora simplemente retorna la primera imagen o placeholder
 */
export async function getPlaylistCover(
  playlistItems: Array<{ song_cover_url?: string }>
): Promise<string> {
  const imageUrls = getPlaylistCoverImages(playlistItems);
  
  if (imageUrls.length === 0) {
    return 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop';
  }

  // Retornar la primera imagen
  // El collage se generará en el componente PlaylistCover
  return imageUrls[0];
}

/**
 * Hook para usar en componentes React
 * Ahora es más simple ya que el collage se genera en el componente
 */
import { useState, useEffect } from 'react';

export function usePlaylistCover(playlistItems: Array<{ song_cover_url?: string }>) {
  const [coverUrl, setCoverUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadCover = async () => {
      setIsLoading(true);
      try {
        const url = await getPlaylistCover(playlistItems);
        if (mounted) {
          setCoverUrl(url);
        }
      } catch (error) {
        console.error('Error loading playlist cover:', error);
        if (mounted) {
          setCoverUrl('https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadCover();

    return () => {
      mounted = false;
    };
  }, [playlistItems]);

  return { coverUrl, isLoading };
}

// Re-export para compatibilidad
export { useState, useEffect };