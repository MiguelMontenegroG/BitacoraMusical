'use client';

import { MusicEntry } from '@/hooks/useMusicJournal';
import { Star, Music, TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface AlbumSummaryCardProps {
  album: MusicEntry;
  songs: MusicEntry[];
  artistEntries: MusicEntry[];
}

export function AlbumSummaryCard({ album, songs, artistEntries }: AlbumSummaryCardProps) {
  // Calcular estadísticas
  const ratedSongsCount = songs.length;
  const averageRating = songs.length > 0
    ? Math.round((songs.reduce((sum, s) => sum + s.rating, 0) / songs.length) * 10) / 10
    : null;

  const artistAvg = artistEntries.length > 0
    ? Math.round((artistEntries.reduce((sum, e) => sum + e.rating, 0) / artistEntries.length) * 10) / 10
    : null;

  // Preparar datos para la gráfica
  const chartData = songs.map((song, index) => ({
    trackNumber: index + 1,
    name: song.title,
    rating: song.rating,
  }));

  return (
    <div 
      id="album-summary-card"
      style={{ 
        width: '1080px',
        height: '1080px',
        padding: '48px',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        background: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)',
        color: '#ffffff'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', gap: '32px', marginBottom: '32px' }}>
        {/* Cover Image */}
        <div style={{ 
          width: '256px', 
          height: '256px', 
          borderRadius: '12px', 
          overflow: 'hidden', 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: '4px solid rgba(255, 255, 255, 0.2)',
          flexShrink: 0
        }}>
          <img
            src={album.coverUrl}
            alt={album.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            crossOrigin="anonymous"
          />
        </div>

        {/* Album Info */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h1 style={{ 
            fontSize: '48px', 
            fontWeight: 'bold', 
            marginBottom: '12px', 
            lineHeight: 1.2,
            color: '#ffffff'
          }}>
            {album.title}
          </h1>
          <p style={{ fontSize: '30px', marginBottom: '24px', color: '#d8b4fe' }}>{album.artist}</p>
          
          {/* Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Star style={{ width: '40px', height: '40px', fill: '#facc15', color: '#facc15' }} />
            <span style={{ fontSize: '60px', fontWeight: 'bold', color: '#ffffff' }}>{album.rating.toFixed(1)}</span>
            <span style={{ fontSize: '30px', color: 'rgba(255, 255, 255, 0.6)' }}>/10</span>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '24px', color: 'rgba(255, 255, 255, 0.8)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Music style={{ width: '20px', height: '20px' }} />
              <span style={{ fontSize: '18px' }}>{ratedSongsCount} canciones calificadas</span>
            </div>
            {averageRating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp style={{ width: '20px', height: '20px' }} />
                <span style={{ fontSize: '18px' }}>Promedio: {averageRating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart Section */}
      {chartData.length > 0 && (
        <div style={{ 
          flex: 1, 
          borderRadius: '12px', 
          padding: '24px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)', 
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{ 
            fontSize: '24px', 
            fontWeight: '600', 
            marginBottom: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            color: '#ffffff'
          }}>
            <TrendingUp style={{ width: '24px', height: '24px', color: '#c084fc' }} />
            Distribución de Ratings
          </h3>
          
          <div style={{ height: '400px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 40, left: 20, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" opacity={0.3} />
                <XAxis
                  dataKey="trackNumber"
                  tickFormatter={(value) => `#${value}`}
                  stroke="#ffffff80"
                  fontSize={14}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  domain={[0, 10]}
                  tickCount={11}
                  stroke="#ffffff80"
                  fontSize={14}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e1b4b',
                    border: '2px solid #7c3aed',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '14px',
                  }}
                  labelStyle={{ color: '#ffffff', fontWeight: 'bold', fontSize: '16px' }}
                  itemStyle={{ color: '#ffffff', fontSize: '14px' }}
                  formatter={(value: number | null) => {
                    if (value === null) return ['No calificado', 'Rating'];
                    return [value.toFixed(1), 'Rating'];
                  }}
                  labelFormatter={(label) => {
                    const track = chartData.find(d => d.trackNumber === label);
                    return track ? `${track.name}` : `Track #${label}`;
                  }}
                />
                
                <Line
                  type="monotone"
                  dataKey="rating"
                  stroke="#a78bfa"
                  strokeWidth={3}
                  dot={{ fill: '#a78bfa', r: 6, stroke: '#1e1b4b', strokeWidth: 2 }}
                  activeDot={{ r: 8, fill: '#a78bfa', stroke: '#1e1b4b', strokeWidth: 2 }}
                  name="Rating Canción"
                  connectNulls={false}
                />
                
                {album.rating && (
                  <ReferenceLine
                    y={album.rating}
                    stroke="#06b6d4"
                    strokeDasharray="5 5"
                    strokeWidth={3}
                    label={{
                      value: `Álbum: ${album.rating.toFixed(1)}`,
                      position: 'right',
                      fill: '#06b6d4',
                      fontSize: 14,
                      fontWeight: 'bold',
                      background: { fill: '#1e1b4b', opacity: 0.9 },
                    }}
                  />
                )}
                
                {artistAvg && (
                  <ReferenceLine
                    y={artistAvg}
                    stroke="#f97316"
                    strokeDasharray="3 3"
                    strokeWidth={3}
                    label={{
                      value: `Artista: ${artistAvg.toFixed(1)}`,
                      position: 'left',
                      fill: '#f97316',
                      fontSize: 14,
                      fontWeight: 'bold',
                      background: { fill: '#1e1b4b', opacity: 0.9 },
                    }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)' }}>
          Dashie's music blog • {new Date(album.date).toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>
    </div>
  );
}
