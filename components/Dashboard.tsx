'use client';

import { MusicEntry } from '@/hooks/useMusicJournal';
import {
  BarChart,
  Bar,
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

interface DashboardProps {
  entries: MusicEntry[];
}

interface RatingData {
  rating: number;
  count: number;
}

interface TimeSeriesData {
  date: string;
  average: number;
  fullDate: string;
}

export function Dashboard({ entries }: DashboardProps) {
  // Calculate rating distribution
  const getRatingDistribution = (): RatingData[] => {
    const distribution: Record<number, number> = {};
    entries.forEach((entry) => {
      const roundedRating = Math.round(entry.rating * 10) / 10;
      distribution[roundedRating] = (distribution[roundedRating] || 0) + 1;
    });
    return Object.entries(distribution)
      .map(([rating, count]) => ({
        rating: parseFloat(rating),
        count,
      }))
      .sort((a, b) => a.rating - b.rating);
  };

  // Calculate average rating over time
  const getAverageRatingOverTime = (): TimeSeriesData[] => {
    const sortedEntries = [...entries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let cumulativeSum = 0;
    return sortedEntries.map((entry, index) => {
      cumulativeSum += entry.rating;
      const date = new Date(entry.date);
      return {
        date: date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        average: Math.round((cumulativeSum / (index + 1)) * 10) / 10,
        fullDate: entry.date,
      };
    });
  };

  // Calculate statistics
  const avgRating =
    entries.length > 0
      ? Math.round((entries.reduce((sum, e) => sum + e.rating, 0) / entries.length) * 10) / 10
      : 0;
  const highestRating = entries.length > 0 ? Math.max(...entries.map((e) => e.rating)) : 0;
  const lowestRating = entries.length > 0 ? Math.min(...entries.map((e) => e.rating)) : 0;
  const totalEntries = entries.length;
  const albumCount = entries.filter((e) => e.type === 'album').length;
  const songCount = entries.filter((e) => e.type === 'song').length;

  const ratingData = getRatingDistribution();
  const timeSeriesData = getAverageRatingOverTime();

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-secondary border-border p-4 text-center">
          <p className="text-xs text-muted-foreground">Total Entries</p>
          <p className="text-2xl font-bold text-primary">{totalEntries}</p>
        </Card>
        <Card className="bg-secondary border-border p-4 text-center">
          <p className="text-xs text-muted-foreground">Albums</p>
          <p className="text-2xl font-bold text-accent">{albumCount}</p>
        </Card>
        <Card className="bg-secondary border-border p-4 text-center">
          <p className="text-xs text-muted-foreground">Songs</p>
          <p className="text-2xl font-bold text-primary">{songCount}</p>
        </Card>
        <Card className="bg-secondary border-border p-4 text-center">
          <p className="text-xs text-muted-foreground">Avg Rating</p>
          <p className="text-2xl font-bold text-accent">{avgRating}</p>
        </Card>
        <Card className="bg-secondary border-border p-4 text-center">
          <p className="text-xs text-muted-foreground">Highest</p>
          <p className="text-2xl font-bold text-primary">{highestRating.toFixed(1)}</p>
        </Card>
        <Card className="bg-secondary border-border p-4 text-center">
          <p className="text-xs text-muted-foreground">Lowest</p>
          <p className="text-2xl font-bold text-accent">{lowestRating.toFixed(1)}</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Distribution */}
        <Card className="bg-secondary border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Rating Distribution</h3>
          {ratingData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ratingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="rating"
                  stroke="var(--muted-foreground)"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    color: 'var(--foreground)',
                  }}
                  cursor={{ fill: 'rgba(102, 51, 153, 0.1)' }}
                />
                <Bar
                  dataKey="count"
                  fill="var(--primary)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-center py-8">No data yet</p>
          )}
        </Card>

        {/* Average Rating Over Time */}
        <Card className="bg-secondary border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Average Rating Over Time
          </h3>
          {timeSeriesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  stroke="var(--muted-foreground)"
                  style={{ fontSize: '12px' }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  domain={[0, 10]}
                  stroke="var(--muted-foreground)"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    color: 'var(--foreground)',
                  }}
                  cursor={{ stroke: 'var(--primary)', strokeWidth: 1 }}
                />
                <Line
                  type="monotone"
                  dataKey="average"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--accent)', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-center py-8">No data yet</p>
          )}
        </Card>
      </div>
    </div>
  );
}
