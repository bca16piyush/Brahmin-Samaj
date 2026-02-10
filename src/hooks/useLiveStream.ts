import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

interface LiveEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  end_date: string | null;
  youtube_live_url: string | null;
  is_live: boolean;
  location: string | null;
}

export function useLiveStream() {
  const { data: liveEvents, isLoading: isLoadingLive } = useQuery({
    queryKey: ['live-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_live', true)
        .order('event_date', { ascending: false });

      if (error) throw error;
      return data as LiveEvent[];
    },
    refetchInterval: 30000,
  });

  const { data: upcomingEvents, isLoading: isLoadingUpcoming } = useQuery({
    queryKey: ['upcoming-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(10);

      if (error) throw error;
      return data as LiveEvent[];
    },
  });

  // Auto-transfer completed live events every 5 minutes
  useEffect(() => {
    const checkAndTransfer = async () => {
      try {
        await supabase.functions.invoke('auto-transfer-live');
      } catch (e) {
        // Silent fail - this is a background task
      }
    };

    // Check on mount
    checkAndTransfer();

    const interval = setInterval(checkAndTransfer, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const nextEvent = upcomingEvents?.[0] || null;

  return {
    liveEvents: liveEvents || [],
    upcomingEvents: upcomingEvents || [],
    nextEvent,
    isLoading: isLoadingLive || isLoadingUpcoming,
    isLive: (liveEvents?.length || 0) > 0,
  };
}
