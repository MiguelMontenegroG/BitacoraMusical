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

export interface AlbumTrack {
  name: string;
  duration: number; // en segundos
  url: string;
}

export interface AlbumDetails {
  name: string;
  artist: string;
  coverUrl: string;
  tracks: AlbumTrack[];
  url: string;
}

export interface SearchResult {
  title: string;
  artist: string;
  coverUrl: string;
  type: 'album' | 'song';
}

/**
 * Buscar álbumes en Last.fm con paginación
 */
export async function searchAlbums(query: string, page: number = 1): Promise<SearchResult[]> {
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
      page: page.toString(),
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
 * Buscar canciones/tracks en Last.fm con paginación
 */
export async function searchTracks(query: string, page: number = 1): Promise<SearchResult[]> {
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
      page: page.toString(),
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
 * Búsqueda combinada: álbumes y canciones con paginación
 */
export async function searchMusic(query: string, page: number = 1): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  // Buscar álbumes y tracks en paralelo
  const [albums, tracks] = await Promise.all([
    searchAlbums(query, page),
    searchTracks(query, page),
  ]);

  // Combinar resultados, priorizando álbumes
  const combined = [...albums, ...tracks];
  
  // Eliminar duplicados (mismo título y artista)
  const unique = combined.filter((item, index, self) => 
    index === self.findIndex(t => t.title === item.title && t.artist === item.artist)
  );

  return unique.slice(0, 12); // Limitar a 12 resultados por página
}

/**
 * Obtener detalles completos de un álbum con su tracklist
 */
export async function getAlbumDetails(artist: string, album: string): Promise<AlbumDetails | null> {
  if (!API_KEY) {
    console.error('Last.fm API key not configured');
    return null;
  }

  try {
    const params = new URLSearchParams({
      method: 'album.getInfo',
      artist: artist,
      album: album,
      api_key: API_KEY,
      format: 'json',
    });

    const response = await fetch(`${BASE_URL}?${params}`);
    const data = await response.json();

    const albumData = data.album;
    if (!albumData) return null;

    // Asegurar que tracks sea un array
    const tracksData = albumData.tracks?.track;
    const tracksArray = Array.isArray(tracksData) 
      ? tracksData 
      : tracksData 
        ? [tracksData] // Si es un solo objeto, convertirlo a array
        : [];

    const tracks: AlbumTrack[] = tracksArray.map((track: any) => ({
      name: track.name,
      duration: track.duration ? Math.floor(track.duration / 1000) : 0,
      url: track.url || '',
    }));

    return {
      name: albumData.name,
      artist: albumData.artist,
      coverUrl: getBestImageUrl(albumData.image || []),
      tracks,
      url: albumData.url || '',
    };
  } catch (error) {
    console.error('Error getting album details:', error);
    return null;
  }
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
