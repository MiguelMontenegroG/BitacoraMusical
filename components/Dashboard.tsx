'use client';

import { MusicEntry } from '@/hooks/useMusicJournal';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card } from './ui/card';
import { TrendingUp, TrendingDown, Minus, Star, Disc, Music } from 'lucide-react';

interface DashboardProps {
  entries: MusicEntry[];
}

interface RatingRangeData {
  range: string;
  count: number;
  percentage: number;
  fill: string;
}

interface ArtistData {
  artist: string;
  count: number;
  averageRating: number;
}

interface TagData {
  tag: string;
  count: number;
}

interface MonthlyData {
  month: string;
  count: number;
  averageRating: number;
  fullMonth: string;
}

interface TypeRatingData {
  type: string;
  averageRating: number;
  count: number;
}

interface AlbumData {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  rating: number;
  date: string;
}

export function Dashboard({ entries }: DashboardProps) {
  const ratingColors = [
    'oklch(0.577 0.245 27.325)',
    'oklch(0.65 0.18 50)',
    'oklch(0.75 0.15 100)',
    'oklch(0.65 0.18 150)',
    'oklch(0.65 0.2 280)',
  ];

  const getRatingDistributionByRange = (): RatingRangeData[] => {
    const ranges = [
      { min: 0, max: 2, label: '0-2' },
      { min: 2, max: 4, label: '2-4' },
      { min: 4, max: 6, label: '4-6' },
      { min: 6, max: 8, label: '6-8' },
      { min: 8, max: 10, label: '8-10' },
    ];

    return ranges.map((range, index) => {
      const count = entries.filter(
        (e) => e.rating >= range.min && e.rating < (range.max === 10 ? 10.1 : range.max)
      ).length;
      const percentage = entries.length > 0 ? Math.round((count / entries.length) * 100) : 0;
      
      return {
        range: range.label,
        count,
        percentage,
        fill: ratingColors[index],
      };
    });
  };

  const getTopArtists = (): ArtistData[] => {
    const artistStats: Record<string, { count: number; totalRating: number }> = {};
    
    entries.forEach((entry) => {
      if (!artistStats[entry.artist]) {
        artistStats[entry.artist] = { count: 0, totalRating: 0 };
      }
      artistStats[entry.artist].count += 1;
      artistStats[entry.artist].totalRating += entry.rating;
    });

    return Object.entries(artistStats)
      .map(([artist, stats]) => ({
        artist,
        count: stats.count,
        averageRating: Math.round((stats.totalRating / stats.count) * 10) / 10,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const getTopTags = (): TagData[] => {
    const tagCounts: Record<string, number> = {};
    
    entries.forEach((entry) => {
      if (entry.mood) {
        const tags = entry.mood.split(',').map((tag) => tag.trim()).filter(Boolean);
        tags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  };

  const getMonthlyTrends = (): MonthlyData[] => {
    const monthlyStats: Record<string, { count: number; totalRating: number }> = {};
    
    entries.forEach((entry) => {
      const date = new Date(entry.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { count: 0, totalRating: 0 };
      }
      monthlyStats[monthKey].count += 1;
      monthlyStats[monthKey].totalRating += entry.rating;
    });

    return Object.entries(monthlyStats)
      .map(([key, stats]) => {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return {
          month: date.toLocaleDateString('es-ES', { month: 'short' }),
          fullMonth: date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
          count: stats.count,
          averageRating: Math.round((stats.totalRating / stats.count) * 10) / 10,
        };
      })
      .sort((a, b) => {
        const dateA = new Date(a.fullMonth);
        const dateB = new Date(b.fullMonth);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-12);
  };

  const getRatingByType = (): TypeRatingData[] => {
    const albumEntries = entries.filter((e) => e.type === 'album');
    const epEntries = entries.filter((e) => e.type === 'ep');
    const songEntries = entries.filter((e) => e.type === 'song');

    const albumAvg = albumEntries.length > 0
      ? Math.round((albumEntries.reduce((sum, e) => sum + e.rating, 0) / albumEntries.length) * 10) / 10
      : 0;
    
    const epAvg = epEntries.length > 0
      ? Math.round((epEntries.reduce((sum, e) => sum + e.rating, 0) / epEntries.length) * 10) / 10
      : 0;
    
    const songAvg = songEntries.length > 0
      ? Math.round((songEntries.reduce((sum, e) => sum + e.rating, 0) / songEntries.length) * 10) / 10
      : 0;

    return [
      { type: 'Álbumes', averageRating: albumAvg, count: albumEntries.length },
      { type: 'EPs', averageRating: epAvg, count: epEntries.length },
      { type: 'Canciones', averageRating: songAvg, count: songEntries.length },
    ];
  };

  const getAllAlbums = (): AlbumData[] => {
    // Filtrar solo álbumes (excluir EPs y singles)
    const albumEntries = entries.filter((e) => e.type === 'album');
    
    // Agrupar por título y artista para evitar duplicados
    const albumMap = new Map<string, typeof albumEntries[0]>();
    
    albumEntries.forEach((entry) => {
      const key = `${entry.title}|||${entry.artist}`;
      
      if (!albumMap.has(key)) {
        albumMap.set(key, entry);
      } else {
        const existing = albumMap.get(key)!;
        if (entry.rating > existing.rating) {
          albumMap.set(key, entry);
        }
      }
    });
    
    return Array.from(albumMap.values())
      .sort((a, b) => b.rating - a.rating)
      .map((album) => ({
        id: album.id,
        title: album.title,
        artist: album.artist,
        coverUrl: album.coverUrl,
        rating: album.rating,
        date: album.date,
      }));
  };

  const getAllEPs = (): AlbumData[] => {
    // Filtrar solo EPs (2-4 tracks)
    const epEntries = entries.filter((e) => e.type === 'ep');
    
    // Agrupar por título y artista para evitar duplicados
    const epMap = new Map<string, typeof epEntries[0]>();
    
    epEntries.forEach((entry) => {
      const key = `${entry.title}|||${entry.artist}`;
      
      if (!epMap.has(key)) {
        epMap.set(key, entry);
      } else {
        const existing = epMap.get(key)!;
        if (entry.rating > existing.rating) {
          epMap.set(key, entry);
        }
      }
    });
    
    return Array.from(epMap.values())
      .sort((a, b) => b.rating - a.rating)
      .map((ep) => ({
        id: ep.id,
        title: ep.title,
        artist: ep.artist,
        coverUrl: ep.coverUrl,
        rating: ep.rating,
        date: ep.date,
      }));
  };

  const getAllSongs = (): AlbumData[] => {
    // Filtrar solo canciones (type === 'song')
    const songEntries = entries.filter((e) => e.type === 'song');
    
    // Ordenar por rating (mayor a menor)
    return songEntries
      .sort((a, b) => b.rating - a.rating)
      .map((song) => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        coverUrl: song.coverUrl,
        rating: song.rating,
        date: song.date,
      }));
  };

  const avgRating = entries.length > 0
    ? Math.round((entries.reduce((sum, e) => sum + e.rating, 0) / entries.length) * 10) / 10
    : 0;
  
  const highestRating = entries.length > 0 ? Math.max(...entries.map((e) => e.rating)) : 0;
  const lowestRating = entries.length > 0 ? Math.min(...entries.map((e) => e.rating)) : 0;
  const totalEntries = entries.length;
  const uniqueArtists = new Set(entries.map((e) => e.artist)).size;
  
  const calculateTrend = () => {
    if (entries.length < 2) return { direction: 'neutral', value: 0 };
    
    const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const midPoint = Math.floor(sorted.length / 2);
    
    const firstHalf = sorted.slice(0, midPoint);
    const secondHalf = sorted.slice(midPoint);
    
    const firstAvg = firstHalf.reduce((sum, e) => sum + e.rating, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, e) => sum + e.rating, 0) / secondHalf.length;
    
    const diff = secondAvg - firstAvg;
    return {
      direction: diff > 0.2 ? 'up' : diff < -0.2 ? 'down' : 'neutral',
      value: Math.abs(Math.round(diff * 10)) / 10,
    };
  };
  
  const trend = calculateTrend();

  const ratingRangeData = getRatingDistributionByRange();
  const topArtists = getTopArtists();
  const topTags = getTopTags();
  const monthlyTrends = getMonthlyTrends();
  const ratingByType = getRatingByType();
  const allAlbums = getAllAlbums();
  const allEPs = getAllEPs();
  const allSongs = getAllSongs();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="bg-gradient-to-br from-secondary/80 to-card/80 backdrop-blur-sm border-border/50 p-4 text-center animate-in fade-in zoom-in-95 duration-500 fill-mode-backwards hover:shadow-lg hover:shadow-primary/20 transition-all duration-300" style={{ animationDelay: `${i * 100}ms` }}>
            {i === 0 && (
              <>
                <p className="text-xs text-muted-foreground">Total Entradas</p>
                <p className="text-2xl font-bold text-primary">{totalEntries}</p>
              </>
            )}
            {i === 1 && (
              <>
                <p className="text-xs text-muted-foreground">Artistas Únicos</p>
                <p className="text-2xl font-bold text-accent">{uniqueArtists}</p>
              </>
            )}
            {i === 2 && (
              <>
                <p className="text-xs text-muted-foreground">Promedio General</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-2xl font-bold text-primary">{avgRating}</p>
                  {trend.direction === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                  {trend.direction === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                  {trend.direction === 'neutral' && <Minus className="h-4 w-4 text-muted-foreground" />}
                </div>
              </>
            )}
            {i === 3 && (
              <>
                <p className="text-xs text-muted-foreground">Mejor Rating</p>
                <p className="text-2xl font-bold text-accent">{highestRating.toFixed(1)}</p>
              </>
            )}
            {i === 4 && (
              <>
                <p className="text-xs text-muted-foreground">Peor Rating</p>
                <p className="text-2xl font-bold text-primary">{lowestRating.toFixed(1)}</p>
              </>
            )}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-secondary/80 to-card/80 backdrop-blur-sm border-border/50 p-6 hover:shadow-lg transition-all duration-300">
          <h3 className="text-lg font-semibold text-foreground mb-2">Distribución de Ratings</h3>
          <p className="text-xs text-muted-foreground mb-4">Rangos de calificación con porcentajes</p>
          {ratingRangeData.some((d) => d.count > 0) ? (
            <div className="space-y-3">
              {ratingRangeData.map((item) => (
                <div key={item.range} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground font-medium">{item.range}</span>
                    <span className="text-muted-foreground">{item.count} ({item.percentage}%)</span>
                  </div>
                  <div className="h-3 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.fill,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Sin datos aún</p>
          )}
        </Card>

        <Card className="bg-gradient-to-br from-secondary/80 to-card/80 backdrop-blur-sm border-border/50 p-6 hover:shadow-lg transition-all duration-300">
          <h3 className="text-lg font-semibold text-foreground mb-2">Top 5 Artistas</h3>
          <p className="text-xs text-muted-foreground mb-4">Más escuchados con rating promedio</p>
          {topArtists.length > 0 ? (
            <div className="space-y-3">
              {topArtists.map((artist) => {
                const maxCount = topArtists[0].count;
                const percentage = (artist.count / maxCount) * 100;
                return (
                  <div key={artist.artist} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground font-medium truncate" title={artist.artist}>
                        {artist.artist}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {artist.count} • {artist.averageRating.toFixed(1)}★
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all bg-primary"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Sin datos aún</p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-secondary/80 to-card/80 backdrop-blur-sm border-border/50 p-6 hover:shadow-lg transition-all duration-300">
          <h3 className="text-lg font-semibold text-foreground mb-2">Tendencia Mensual</h3>
          <p className="text-xs text-muted-foreground mb-4">Entradas y rating promedio por mes</p>
          {monthlyTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                <XAxis
                  dataKey="month"
                  stroke="var(--muted-foreground)"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  yAxisId="left"
                  stroke="var(--muted-foreground)"
                  style={{ fontSize: '12px' }}
                  label={{ value: 'Entradas', angle: -90, position: 'insideLeft', fill: 'var(--muted-foreground)' }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 10]}
                  stroke="var(--accent)"
                  style={{ fontSize: '12px' }}
                  label={{ value: 'Rating', angle: 90, position: 'insideRight', fill: 'var(--accent)' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    color: 'var(--foreground)',
                  }}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      return payload[0].payload.fullMonth;
                    }
                    return label;
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="count"
                  name="Entradas"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--primary)', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="averageRating"
                  name="Rating Promedio"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--accent)', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-center py-8">Sin datos aún</p>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-secondary/80 to-card/80 backdrop-blur-sm border-border/50 p-6 hover:shadow-lg transition-all duration-300">
            <h3 className="text-lg font-semibold text-foreground mb-2">Rating por Tipo</h3>
            <p className="text-xs text-muted-foreground mb-4">Comparación álbumes vs canciones</p>
            {ratingByType.some((d) => d.count > 0) ? (
              <div className="space-y-4">
                {ratingByType.map((item) => (
                  <div key={item.type} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-foreground">{item.type}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{item.count} entradas</span>
                        <span className="text-lg font-bold text-accent">{item.averageRating.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all bg-accent"
                        style={{ width: `${(item.averageRating / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Sin datos aún</p>
            )}
          </Card>

          <Card className="bg-gradient-to-br from-secondary/80 to-card/80 backdrop-blur-sm border-border/50 p-6 hover:shadow-lg transition-all duration-300">
            <h3 className="text-lg font-semibold text-foreground mb-2">Tags Populares</h3>
            <p className="text-xs text-muted-foreground mb-4">Géneros y etiquetas más usadas</p>
            {topTags.length > 0 ? (
              <div className="space-y-2 max-h-[180px] overflow-y-auto">
                {topTags.map((tagData, index) => {
                  const maxCount = topTags[0].count;
                  const percentage = (tagData.count / maxCount) * 100;
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-foreground font-medium">{tagData.tag}</span>
                        <span className="text-muted-foreground">{tagData.count}</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: `var(--chart-${(index % 5) + 1})`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Sin datos aún</p>
            )}
          </Card>
        </div>
      </div>

      {/* Top 5 Albums - Destacados */}
      {allAlbums.length > 0 && (
        <>
          <Card className="bg-gradient-to-br from-secondary to-card border-border p-6">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              <h3 className="text-lg font-semibold text-foreground">Top 5 Álbumes Destacados</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-6">Los mejor calificados de tu colección</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {allAlbums.slice(0, 5).map((album, index) => (
                <div
                  key={`top-${album.id}`}
                  className="group relative bg-card rounded-xl overflow-hidden border-2 border-primary/30 hover:border-primary transition-all hover:scale-105 shadow-lg"
                >
                  {/* Ranking Badge */}
                  <div className="absolute top-2 left-2 z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-amber-700' :
                      'bg-primary'
                    }`}>
                      <span className="text-xs font-bold text-white">#{index + 1}</span>
                    </div>
                  </div>

                  {/* Album Cover */}
                  <div className="aspect-square relative overflow-hidden bg-muted">
                    {album.coverUrl ? (
                      <img
                        src={album.coverUrl}
                        alt={`${album.title} - ${album.artist}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.jpg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl">💿</span>
                      </div>
                    )}
                    
                    {/* Rating Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-bold text-white">{album.rating.toFixed(1)}</span>
                        <span className="text-xs text-white/70">/10</span>
                      </div>
                    </div>
                  </div>

                  {/* Album Info */}
                  <div className="p-3 space-y-1">
                    <h4 className="font-semibold text-sm text-foreground truncate" title={album.title}>
                      {album.title}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate" title={album.artist}>
                      {album.artist}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(album.date).toLocaleDateString('es-ES', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* All Albums List */}
          {allAlbums.length > 5 && (
            <Card className="bg-gradient-to-br from-secondary/80 to-card/80 backdrop-blur-sm border-border/50 p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <Disc className="h-5 w-5 text-accent" />
                <h3 className="text-lg font-semibold text-foreground">Todos los Álbumes ({allAlbums.length})</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-6">Álbumes del #6 en adelante</p>
              
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {allAlbums.slice(5).map((album, index) => (
                  <div
                    key={`list-${album.id}`}
                    className="flex items-center gap-4 p-3 bg-card rounded-lg border border-border hover:border-primary/50 transition-all"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-sm font-medium text-muted-foreground">#{index + 6}</span>
                    </div>

                    <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-muted">
                      {album.coverUrl ? (
                        <img
                          src={album.coverUrl}
                          alt={`${album.title} - ${album.artist}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.jpg';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-2xl">💿</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-foreground truncate" title={album.title}>
                        {album.title}
                      </h4>
                      <p className="text-xs text-muted-foreground truncate" title={album.artist}>
                        {album.artist}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(album.date).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>

                    <div className="flex-shrink-0 flex items-center gap-2">
                      <Star className="h-5 w-5 fill-accent text-accent" />
                      <span className="text-xl font-bold text-foreground">{album.rating.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground">/10</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Top EPs Section */}
      {allEPs.length > 0 && (
        <>
          <Card className="bg-gradient-to-br from-secondary to-card border-border p-6">
            <div className="flex items-center gap-2 mb-2">
              <Disc className="h-5 w-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-foreground">Top 5 EPs Destacados</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-6">Los EPs mejor calificados (2-4 tracks)</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {allEPs.slice(0, 5).map((ep, index) => (
                <div
                  key={`top-ep-${ep.id}`}
                  className="group relative bg-card rounded-xl overflow-hidden border-2 border-orange-500/30 hover:border-orange-500 transition-all hover:scale-105 shadow-lg"
                >
                  {/* Ranking Badge */}
                  <div className="absolute top-2 left-2 z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-amber-700' :
                      'bg-orange-500'
                    }`}>
                      <span className="text-xs font-bold text-white">#{index + 1}</span>
                    </div>
                  </div>

                  {/* EP Cover */}
                  <div className="aspect-square relative overflow-hidden bg-muted">
                    {ep.coverUrl ? (
                      <img
                        src={ep.coverUrl}
                        alt={`${ep.title} - ${ep.artist}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.jpg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl">💿</span>
                      </div>
                    )}
                    
                    {/* Rating Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-bold text-white">{ep.rating.toFixed(1)}</span>
                        <span className="text-xs text-white/70">/10</span>
                      </div>
                    </div>
                  </div>

                  {/* EP Info */}
                  <div className="p-3 space-y-1">
                    <h4 className="font-semibold text-sm text-foreground truncate" title={ep.title}>
                      {ep.title}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate" title={ep.artist}>
                      {ep.artist}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(ep.date).toLocaleDateString('es-ES', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* All EPs List */}
          {allEPs.length > 5 && (
            <Card className="bg-gradient-to-br from-secondary/80 to-card/80 backdrop-blur-sm border-border/50 p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <Disc className="h-5 w-5 text-orange-500" />
                <h3 className="text-lg font-semibold text-foreground">Todos los EPs ({allEPs.length})</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-6">EPs del #6 en adelante</p>
              
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {allEPs.slice(5).map((ep, index) => (
                  <div
                    key={`list-ep-${ep.id}`}
                    className="flex items-center gap-4 p-3 bg-card rounded-lg border border-border hover:border-orange-500/50 transition-all"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-sm font-medium text-muted-foreground">#{index + 6}</span>
                    </div>

                    <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-muted">
                      {ep.coverUrl ? (
                        <img
                          src={ep.coverUrl}
                          alt={`${ep.title} - ${ep.artist}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.jpg';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-2xl">💿</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-foreground truncate" title={ep.title}>
                        {ep.title}
                      </h4>
                      <p className="text-xs text-muted-foreground truncate" title={ep.artist}>
                        {ep.artist}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(ep.date).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>

                    <div className="flex-shrink-0 flex items-center gap-2">
                      <Star className="h-5 w-5 fill-orange-500 text-orange-500" />
                      <span className="text-xl font-bold text-foreground">{ep.rating.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground">/10</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Top Songs Section */}
      {allSongs.length > 0 && (
        <>
          <Card className="bg-gradient-to-br from-secondary to-card border-border p-6">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-5 w-5 text-accent fill-accent" />
              <h3 className="text-lg font-semibold text-foreground">Top 5 Canciones Destacadas</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-6">Las canciones mejor calificadas</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {allSongs.slice(0, 5).map((song, index) => (
                <div
                  key={`top-song-${song.id}`}
                  className="group relative bg-card rounded-xl overflow-hidden border-2 border-accent/30 hover:border-accent transition-all hover:scale-105 shadow-lg"
                >
                  {/* Ranking Badge */}
                  <div className="absolute top-2 left-2 z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-amber-700' :
                      'bg-accent'
                    }`}>
                      <span className="text-xs font-bold text-white">#{index + 1}</span>
                    </div>
                  </div>

                  {/* Song Cover */}
                  <div className="aspect-square relative overflow-hidden bg-muted">
                    {song.coverUrl ? (
                      <img
                        src={song.coverUrl}
                        alt={`${song.title} - ${song.artist}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.jpg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl">🎵</span>
                      </div>
                    )}
                    
                    {/* Rating Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-bold text-white">{song.rating.toFixed(1)}</span>
                        <span className="text-xs text-white/70">/10</span>
                      </div>
                    </div>
                  </div>

                  {/* Song Info */}
                  <div className="p-3 space-y-1">
                    <h4 className="font-semibold text-sm text-foreground truncate" title={song.title}>
                      {song.title}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate" title={song.artist}>
                      {song.artist}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(song.date).toLocaleDateString('es-ES', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* All Songs List */}
          {allSongs.length > 5 && (
            <Card className="bg-gradient-to-br from-secondary/80 to-card/80 backdrop-blur-sm border-border/50 p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <Music className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Todas las Canciones ({allSongs.length})</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-6">Canciones del #6 en adelante</p>
              
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {allSongs.slice(5).map((song, index) => (
                  <div
                    key={`list-song-${song.id}`}
                    className="flex items-center gap-4 p-3 bg-card rounded-lg border border-border hover:border-accent/50 transition-all"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-sm font-medium text-muted-foreground">#{index + 6}</span>
                    </div>

                    <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-muted">
                      {song.coverUrl ? (
                        <img
                          src={song.coverUrl}
                          alt={`${song.title} - ${song.artist}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.jpg';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-2xl">🎵</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-foreground truncate" title={song.title}>
                        {song.title}
                      </h4>
                      <p className="text-xs text-muted-foreground truncate" title={song.artist}>
                        {song.artist}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(song.date).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>

                    <div className="flex-shrink-0 flex items-center gap-2">
                      <Star className="h-5 w-5 fill-accent text-accent" />
                      <span className="text-xl font-bold text-foreground">{song.rating.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground">/10</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
