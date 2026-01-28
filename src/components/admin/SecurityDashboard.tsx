import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldAlert, ShieldCheck, AlertTriangle, TrendingUp, Clock, Users, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, eachDayOfInterval, eachHourOfInterval, subHours, startOfHour } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend } from 'recharts';

interface SecurityEvent {
  id: string;
  action: string;
  created_at: string;
  admin_id: string;
  details: Record<string, unknown>;
  ip_address: string | null;
}

const SECURITY_ACTIONS = [
  'unauthorized_access_attempt',
  'rate_limit_exceeded',
  'unauthorized_reminder_attempt',
  'delete_user',
  'reject_verification',
];

const SEVERITY_MAP: Record<string, { level: string; color: string; bgColor: string }> = {
  unauthorized_access_attempt: { level: 'Critical', color: 'text-red-500', bgColor: 'bg-red-500/10' },
  rate_limit_exceeded: { level: 'High', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  unauthorized_reminder_attempt: { level: 'Critical', color: 'text-red-500', bgColor: 'bg-red-500/10' },
  delete_user: { level: 'Medium', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
  reject_verification: { level: 'Low', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
};

const TIME_RANGES = [
  { label: 'Last 24 Hours', value: '24h', days: 1, hourly: true },
  { label: 'Last 7 Days', value: '7d', days: 7, hourly: false },
  { label: 'Last 30 Days', value: '30d', days: 30, hourly: false },
];

export function SecurityDashboard() {
  const [timeRange, setTimeRange] = useState<string>('7d');
  
  const selectedRange = TIME_RANGES.find(r => r.value === timeRange) || TIME_RANGES[1];

  // Fetch security-related audit logs
  const { data: securityEvents, isLoading } = useQuery({
    queryKey: ['security-events', timeRange],
    queryFn: async () => {
      const startDate = startOfDay(subDays(new Date(), selectedRange.days));
      
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .select('id, action, created_at, admin_id, details, ip_address')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as SecurityEvent[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!securityEvents) return null;

    const totalEvents = securityEvents.length;
    const securityAlerts = securityEvents.filter(e => 
      e.action.includes('unauthorized') || e.action.includes('rate_limit')
    ).length;
    const rateLimitHits = securityEvents.filter(e => e.action === 'rate_limit_exceeded').length;
    const unauthorizedAttempts = securityEvents.filter(e => 
      e.action.includes('unauthorized')
    ).length;
    const userDeletions = securityEvents.filter(e => e.action === 'delete_user').length;
    const uniqueIPs = new Set(securityEvents.map(e => e.ip_address).filter(Boolean)).size;

    return {
      totalEvents,
      securityAlerts,
      rateLimitHits,
      unauthorizedAttempts,
      userDeletions,
      uniqueIPs,
    };
  }, [securityEvents]);

  // Timeline data for chart
  const timelineData = useMemo(() => {
    if (!securityEvents) return [];

    const now = new Date();
    let intervals: Date[];
    
    if (selectedRange.hourly) {
      intervals = eachHourOfInterval({
        start: subHours(startOfHour(now), 23),
        end: now,
      });
    } else {
      intervals = eachDayOfInterval({
        start: subDays(startOfDay(now), selectedRange.days - 1),
        end: now,
      });
    }

    return intervals.map(date => {
      const nextDate = selectedRange.hourly 
        ? new Date(date.getTime() + 60 * 60 * 1000)
        : new Date(date.getTime() + 24 * 60 * 60 * 1000);
      
      const eventsInPeriod = securityEvents.filter(e => {
        const eventDate = new Date(e.created_at);
        return eventDate >= date && eventDate < nextDate;
      });

      return {
        date: selectedRange.hourly 
          ? format(date, 'HH:mm')
          : format(date, 'MMM d'),
        total: eventsInPeriod.length,
        security: eventsInPeriod.filter(e => 
          e.action.includes('unauthorized') || e.action.includes('rate_limit')
        ).length,
        admin: eventsInPeriod.filter(e => 
          !e.action.includes('unauthorized') && !e.action.includes('rate_limit')
        ).length,
      };
    });
  }, [securityEvents, selectedRange]);

  // Event type distribution
  const eventDistribution = useMemo(() => {
    if (!securityEvents) return [];

    const distribution: Record<string, number> = {};
    securityEvents.forEach(e => {
      distribution[e.action] = (distribution[e.action] || 0) + 1;
    });

    return Object.entries(distribution)
      .map(([action, count]) => ({
        name: action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: count,
        action,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [securityEvents]);

  // Recent critical events
  const criticalEvents = useMemo(() => {
    if (!securityEvents) return [];
    
    return securityEvents
      .filter(e => SECURITY_ACTIONS.slice(0, 3).includes(e.action))
      .slice(0, 10);
  }, [securityEvents]);

  const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(var(--warning))', 'hsl(var(--secondary))'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-heading text-xl font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Security Dashboard
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor security events and potential threats
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            {TIME_RANGES.map(range => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics?.totalEvents || 0}</p>
                <p className="text-xs text-muted-foreground">Total Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics?.securityAlerts || 0}</p>
                <p className="text-xs text-muted-foreground">Security Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics?.rateLimitHits || 0}</p>
                <p className="text-xs text-muted-foreground">Rate Limits</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics?.unauthorizedAttempts || 0}</p>
                <p className="text-xs text-muted-foreground">Unauthorized</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics?.userDeletions || 0}</p>
                <p className="text-xs text-muted-foreground">User Deletions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics?.uniqueIPs || 0}</p>
                <p className="text-xs text-muted-foreground">Unique IPs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Event Timeline */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Event Timeline</CardTitle>
            <CardDescription>Admin actions and security events over time</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-[250px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="colorAdmin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSecurity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="admin" 
                    stroke="hsl(var(--primary))" 
                    fill="url(#colorAdmin)" 
                    name="Admin Actions"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="security" 
                    stroke="hsl(var(--destructive))" 
                    fill="url(#colorSecurity)"
                    name="Security Events"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Event Distribution */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Event Distribution</CardTitle>
            <CardDescription>Top event types by frequency</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-[250px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : eventDistribution.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                <div className="text-center">
                  <ShieldCheck className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No events in this period</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={eventDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={120} 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar dataKey="value" name="Count" radius={[0, 4, 4, 0]}>
                    {eventDistribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={SECURITY_ACTIONS.includes(entry.action) 
                          ? 'hsl(var(--destructive))' 
                          : 'hsl(var(--primary))'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Critical Events */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-destructive" />
            Recent Security Events
          </CardTitle>
          <CardDescription>
            Unauthorized access attempts and rate limit violations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : criticalEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-green-500 opacity-50" />
              <p className="font-medium">No critical security events</p>
              <p className="text-sm mt-1">Your system is running securely</p>
            </div>
          ) : (
            <div className="space-y-3">
              {criticalEvents.map((event, index) => {
                const severity = SEVERITY_MAP[event.action] || { level: 'Info', color: 'text-muted-foreground', bgColor: 'bg-muted' };
                
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${severity.bgColor} flex items-center justify-center`}>
                        <ShieldAlert className={`w-5 h-5 ${severity.color}`} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {event.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {format(new Date(event.created_at), 'MMM d, HH:mm')}
                          {event.ip_address && (
                            <>
                              <span>•</span>
                              <span className="font-mono">{event.ip_address}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant={severity.level === 'Critical' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {severity.level}
                    </Badge>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
