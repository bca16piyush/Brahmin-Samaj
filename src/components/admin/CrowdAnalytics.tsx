import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, MapPin, Calendar, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { BoothLocationManager } from './BoothLocationManager';

export function CrowdAnalytics() {
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['crowd-analytics', dateFilter],
    queryFn: async () => {
      const startOfDay = `${dateFilter}T00:00:00.000Z`;
      const endOfDay = `${dateFilter}T23:59:59.999Z`;

      // Get all logs for the selected date
      const { data: logs, error } = await supabase
        .from('event_logs')
        .select('id, user_id, booth_location, scanned_at')
        .gte('scanned_at', startOfDay)
        .lte('scanned_at', endOfDay);

      if (error) throw error;

      // Total scans
      const totalScans = logs?.length || 0;

      // Unique visitors
      const uniqueVisitors = new Set(logs?.map(l => l.user_id)).size;

      // Per-booth breakdown
      const boothCounts: Record<string, number> = {};
      logs?.forEach(l => {
        boothCounts[l.booth_location] = (boothCounts[l.booth_location] || 0) + 1;
      });

      // Sort booths by count descending
      const boothBreakdown = Object.entries(boothCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      // Hourly distribution
      const hourly: Record<number, number> = {};
      logs?.forEach(l => {
        const hour = new Date(l.scanned_at).getHours();
        hourly[hour] = (hourly[hour] || 0) + 1;
      });

      return { totalScans, uniqueVisitors, boothBreakdown, hourly };
    },
    refetchInterval: 15000, // Auto-refresh every 15s
  });

  // Get today's total for the live counter
  const { data: liveTotal } = useQuery({
    queryKey: ['live-crowd-count'],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { count, error } = await supabase
        .from('event_logs')
        .select('id', { count: 'exact', head: true })
        .gte('scanned_at', `${today}T00:00:00.000Z`);
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 10000,
  });

  const { data: liveUniqueCount } = useQuery({
    queryKey: ['live-unique-visitors'],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('event_logs')
        .select('user_id')
        .gte('scanned_at', `${today}T00:00:00.000Z`);
      if (error) throw error;
      return new Set(data?.map(d => d.user_id)).size;
    },
    refetchInterval: 10000,
  });

  return (
    <div className="space-y-6">
      {/* Live Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Live Total Scans (Today)
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold font-heading text-foreground">{liveTotal ?? 0}</span>
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-primary/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Unique Visitors (Today)
              </CardTitle>
              <Users className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold font-heading text-foreground">{liveUniqueCount ?? 0}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Date Filter */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Booth Breakdown
            </CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="date-filter" className="text-sm text-muted-foreground whitespace-nowrap">
                <Calendar className="w-4 h-4 inline mr-1" />
                Filter Date:
              </Label>
              <Input
                id="date-filter"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-auto"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading analytics...</div>
          ) : analytics?.boothBreakdown.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No scans recorded for this date</div>
          ) : (
            <div className="space-y-3">
              {/* Summary row */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border mb-4">
                <span className="font-medium text-foreground">Total Scans</span>
                <span className="font-heading text-xl font-bold text-foreground">{analytics?.totalScans}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border mb-4">
                <span className="font-medium text-foreground">Unique Visitors</span>
                <span className="font-heading text-xl font-bold text-foreground">{analytics?.uniqueVisitors}</span>
              </div>

              {/* Booth bars */}
              {analytics?.boothBreakdown.map((booth, i) => {
                const maxCount = analytics.boothBreakdown[0]?.count || 1;
                const percentage = (booth.count / maxCount) * 100;
                return (
                  <motion.div
                    key={booth.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-32 sm:w-40 text-sm font-medium text-foreground truncate">{booth.name}</div>
                    <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, delay: i * 0.05 }}
                        className="h-full bg-gradient-saffron rounded-full flex items-center justify-end pr-2"
                      >
                        {percentage > 20 && (
                          <span className="text-xs font-bold text-primary-foreground">{booth.count}</span>
                        )}
                      </motion.div>
                    </div>
                    {percentage <= 20 && (
                      <span className="text-sm font-bold text-foreground w-12 text-right">{booth.count}</span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Booth Location Management */}
      <BoothLocationManager />
    </div>
  );
}
