import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, UserCheck, UserX, Gift, Calendar, Newspaper } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

export function AdminOverview() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [profiles, pendingVerifications, pandits, inKindDonations, events, news] = await Promise.all([
        supabase.from('profiles').select('id, verification_status', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' }).eq('verification_status', 'pending'),
        supabase.from('pandits').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('in_kind_donations').select('id', { count: 'exact' }).eq('status', 'pledged'),
        supabase.from('events').select('id', { count: 'exact' }).gte('event_date', new Date().toISOString()),
        supabase.from('news').select('id', { count: 'exact' }),
      ]);

      return {
        totalUsers: profiles.count || 0,
        pendingVerifications: pendingVerifications.count || 0,
        activePandits: pandits.count || 0,
        pendingDonations: inKindDonations.count || 0,
        upcomingEvents: events.count || 0,
        totalNews: news.count || 0,
      };
    },
  });

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-primary' },
    { label: 'Pending Verifications', value: stats?.pendingVerifications || 0, icon: UserCheck, color: 'text-gold' },
    { label: 'Active Pandits', value: stats?.activePandits || 0, icon: UserX, color: 'text-maroon' },
    { label: 'Pending Donations', value: stats?.pendingDonations || 0, icon: Gift, color: 'text-primary' },
    { label: 'Upcoming Events', value: stats?.upcomingEvents || 0, icon: Calendar, color: 'text-gold' },
    { label: 'News Articles', value: stats?.totalNews || 0, icon: Newspaper, color: 'text-maroon' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="border-border shadow-temple">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-heading text-foreground">
                {stat.value}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
