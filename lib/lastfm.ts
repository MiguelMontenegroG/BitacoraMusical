const API_KEY = process.env.NEXT_PUBLIC_LASTFM_API_KEY;
const BASE_URL = 'https://ws.audioscrobbler.com/2.0/';

export interface LastFmTrack {
  name: string;
  artist: string;
  album?: string;
  image: Array<{ size: string; '#text': string }>;
  url: string;
}

export interface LastFmAlbum {
  name: string;
  artist: string;
  image: Array<{ size: string; '#text': string }>;
  url: string;
}

export interface SearchResult {
  title: string;
  artist: string;
  coverUrl: string;
  type: 'album' | 'song';
}

/**
 * Buscar álbumes en Last.fm
 */
export async function searchAlbums(query: string): Promise<SearchResult[]> {
  if (!API_KEY) {
    console.error('Last.fm API key not configured');
    return [];
  }

  try {
    const params = new URLSearchParams({
      method: 'album.search',
      album: query,
      api_key: API_KEY,
      format: 'json',
      limit: '12',
    });

    const response = await fetch(`${BASE_URL}?${params}`);
    const data = await response.json();

    const albums = data.results?.albummatches?.album || [];
    
    return albums.map((album: LastFmAlbum) => ({
      title: album.name,
      artist: album.artist,
      coverUrl: getBestImageUrl(album.image),
      type: 'album' as const,
    }));
  } catch (error) {
    console.error('Error searching albums:', error);
    return [];
  }
}

/**
 * Buscar canciones/tracks en Last.fm
 */
export async function searchTracks(query: string): Promise<SearchResult[]> {
  if (!API_KEY) {
    console.error('Last.fm API key not configured');
    return [];
  }

  try {
    const params = new URLSearchParams({
      method: 'track.search',
      track: query,
      api_key: API_KEY,
      format: 'json',
      limit: '12',
    });

    const response = await fetch(`${BASE_URL}?${params}`);
    const data = await response.json();

    const tracks = data.results?.trackmatches?.track || [];
    
    return tracks.map((track: LastFmTrack) => ({
      title: track.name,
      artist: track.artist,
      coverUrl: getBestImageUrl(track.image),
      type: 'song' as const,
    }));
  } catch (error) {
    console.error('Error searching tracks:', error);
    return [];
  }
}

/**
 * Búsqueda combinada: álbumes y canciones
 */
export async function searchMusic(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  // Buscar álbumes y tracks en paralelo
  const [albums, tracks] = await Promise.all([
    searchAlbums(query),
    searchTracks(query),
  ]);

  // Combinar resultados, priorizando álbumes
  const combined = [...albums, ...tracks];
  
  // Eliminar duplicados (mismo título y artista)
  const unique = combined.filter((item, index, self) => 
    index === self.findIndex(t => t.title === item.title && t.artist === item.artist)
  );

  return unique.slice(0, 12); // Limitar a 12 resultados
}

/**
 * Obtener la mejor imagen disponible (extra large o large)
 */
function getBestImageUrl(images: Array<{ size: string; '#text': string }>): string {
  if (!images || images.length === 0) {
    return 'https://via.placeholder.com/300x300?text=No+Cover';
  }

  // Priorizar extra large, luego large, luego medium
  const sizes = ['extralarge', 'large', 'medium'];
  
  for (const size of sizes) {
    const image = images.find(img => img.size === size);
    if (image && image['#text']) {
      return image['#text'];
    }
  }

  // Fallback a la primera imagen disponible
  return images[0]['#text'] || 'https://via.placeholder.com/300x300?text=No+Cover';
}
